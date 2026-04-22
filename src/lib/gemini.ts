import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

export type GeminiConfig = {
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  webSearch?: boolean;
  systemInstruction?: string;
};

function getAiClient(apiKey?: string, baseUrl?: string) {
  const finalKey = apiKey || process.env.GEMINI_API_KEY || "";
  const opts: any = { apiKey: finalKey };
  if (baseUrl) {
    opts.baseUrl = baseUrl;
  }
  return new GoogleGenAI(opts);
}

// Check if running in Capacitor native environment (Android)
function isCapacitorNative(): boolean {
  const win = window as any;
  return !!(win.Capacitor && win.Capacitor.isNativePlatform && win.Capacitor.isNativePlatform());
}

// Send message using CapacitorHttp native request (bypasses CORS, no streaming)
// This makes a direct HTTP request through Android's native HTTP client,
// then yields the complete response as a single chunk to simulate streaming.
async function* sendMessageNative(messages: Message[], config: GeminiConfig): AsyncGenerator<string> {
  const { CapacitorHttp } = await import('@capacitor/core');

  const finalKey = config.apiKey || process.env.GEMINI_API_KEY || "";
  if (!finalKey) {
    throw new Error("API Key is required");
  }

  // Build the request body matching SDK's format
  const history = messages.slice(0, -1).map(m => ({
    role: m.role as "user" | "model",
    parts: [{ text: m.content }]
  }));

  const lastMessage = messages[messages.length - 1].content;

  const tools: any[] = [];
  if (config.webSearch) {
    tools.push({ googleSearch: {} });
  }

  // Construct the Gemini API URL for streaming (alt=sse)
  // We use the streaming endpoint even with native HTTP because the response
  // format is SSE which we can parse. The non-streaming endpoint also works
  // but returns a single JSON object.
  const baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com';
  const url = `${baseUrl}/v1beta/models/${config.model}:streamGenerateContent?alt=sse`;

  const body: any = {
    contents: [...history, { role: "user", parts: [{ text: lastMessage }] }],
  };

  if (config.systemInstruction) {
    body.systemInstruction = { parts: [{ text: config.systemInstruction }] };
  }

  const generationConfig: any = {};
  if (config.temperature !== undefined) generationConfig.temperature = config.temperature;
  if (config.topP !== undefined) generationConfig.topP = config.topP;
  if (config.topK !== undefined) generationConfig.topK = config.topK;
  if (Object.keys(generationConfig).length > 0) {
    body.generationConfig = generationConfig;
  }

  if (tools.length > 0) {
    body.tools = tools;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-goog-api-key': finalKey,
  };

  try {
    const response = await CapacitorHttp.request({
      url,
      method: 'POST',
      headers,
      data: body,
      responseType: 'text',
    });

    if (response.status >= 400) {
      const errorData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      throw new Error(`API error ${response.status}: ${errorData}`);
    }

    // Parse SSE response - each event starts with "data: " followed by JSON
    const text = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    
    // Parse SSE format: lines starting with "data: " contain JSON chunks
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]' || !jsonStr) continue;
        try {
          const chunk = JSON.parse(jsonStr);
          // Extract text from candidates[0].content.parts[0].text
          const candidates = chunk.candidates || [];
          for (const candidate of candidates) {
            const parts = candidate.content?.parts || [];
            for (const part of parts) {
              if (part.text) {
                yield part.text;
              }
            }
          }
        } catch {
          // Skip unparseable lines
        }
      }
    }
  } catch (error: any) {
    console.error("Gemini Native API Error:", error);
    yield `[系统错误] 对不起，Gemini 响应过程中遇到了问题。可能是因为：
1. API Key 无效或额度超限。
2. 所选模型暂时无法访问。
3. 联网搜索工具调用失败。

错误详情: ${error.message || '未知错误'}`;
    throw error;
  }
}

// Send message using SDK's streaming API (works in browsers/Electron with proper CORS)
async function* sendMessageSDK(messages: Message[], config: GeminiConfig): AsyncGenerator<string> {
  const ai = getAiClient(config.apiKey, config.baseUrl);
  
  const history = messages.slice(0, -1).map(m => ({
    role: m.role as "user" | "model",
    parts: [{ text: m.content }]
  }));
  
  const lastMessage = messages[messages.length - 1].content;

  const tools: any[] = [];
  if (config.webSearch) {
    tools.push({ googleSearch: {} });
  }

  const chat = ai.chats.create({
    model: config.model,
    config: {
      systemInstruction: config.systemInstruction,
      temperature: config.temperature,
      topP: config.topP,
      topK: config.topK,
      tools: tools.length > 0 ? tools : undefined
    },
    history
  });

  const response = await chat.sendMessageStream({ message: lastMessage });

  for await (const chunk of response) {
    const text = chunk.text;
    if (text) {
      yield text;
    }
  }
}

export async function* sendMessageStream(messages: Message[], config: GeminiConfig) {
  try {
    if (isCapacitorNative()) {
      // In Capacitor native environment (Android), use CapacitorHttp to bypass CORS
      // CapacitorHttp makes requests through Android's native HTTP client,
      // which is not subject to WebView CORS restrictions.
      yield* sendMessageNative(messages, config);
    } else {
      // In browser/Electron, use SDK's streaming API directly
      yield* sendMessageSDK(messages, config);
    }
  } catch (error: any) {
    // Error messages are already yielded inside sendMessageNative/sendMessageSDK
    // Just re-throw to signal the stream has ended with an error
    throw error;
  }
}
