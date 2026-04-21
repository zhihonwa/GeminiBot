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

export async function* sendMessageStream(messages: Message[], config: GeminiConfig) {
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

  try {
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
      // In @google/genai, chunk is a GenerateContentResponse which has a .text property
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    // Yield a user-friendly error message
    yield `[系统错误] 对不起，Gemini 响应过程中遇到了问题。可能是因为：
1. API Key 无效或额度超限。
2. 所选模型暂时无法访问。
3. 联网搜索工具调用失败。

错误详情: ${error.message || '未知错误'}`;
    throw error;
  }
}
