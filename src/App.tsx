import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import ChatField from './components/ChatField';
import SettingsModal from './components/SettingsModal';
import { ChatSession, Message, AppSettings } from './types';
import { storage } from './lib/storage';
import { sendMessageStream } from './lib/gemini';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());

  // Initialize sessions from storage
  useEffect(() => {
    const savedSessions = storage.getSessions();
    setSessions(savedSessions);
    if (savedSessions.length > 0) {
      setCurrentSessionId(savedSessions[0].id);
    } else {
      createNewSession();
    }
  }, []);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    storage.addSession(newSession);
    return newSession.id;
  }, []);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const handleSendMessage = async (content: string) => {
    let activeSessionId = currentSessionId;
    
    if (!activeSessionId) {
      activeSessionId = createNewSession();
    }

    const newMessage: Message = {
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const updatedSessions = sessions.map(s => {
      if (s.id === activeSessionId) {
        const updatedMessages = [...s.messages, newMessage];
        const updatedTitle = s.messages.length === 0 ? content.slice(0, 20) + (content.length > 20 ? '...' : '') : s.title;
        return {
          ...s,
          title: updatedTitle,
          messages: updatedMessages,
          updatedAt: Date.now()
        };
      }
      return s;
    });

    setSessions(updatedSessions);
    const sessionToUpdate = updatedSessions.find(s => s.id === activeSessionId);
    if (sessionToUpdate) {
      storage.updateSession(activeSessionId!, { 
        messages: sessionToUpdate.messages, 
        title: sessionToUpdate.title 
      });
    }

    setIsLoading(true);

    try {
      const now = new Date();
      const beijingTime = new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
      }).format(now);

      const systemPrompt = `【GeminiBot 详尽模式协议：已激活】
你是一个博学、热情且绝不敷衍的私人助手。你现在的首要任务是打破“简洁回复”的倾向，提供极具深度的回答。

【当前系统参考时间】
${beijingTime}

【强制性回复指令（严禁违背）】
1. **回复长度**：即便问题很简单，回复也必须包含至少 3 个完整的段落，严禁仅返回数字或短句。
2. **时间格式**：当被询问时间时，回复必须明确采用以下格式：“今天是 [年]年[月]月[日]日 [星期]，现在的北京时间是 [时]点[分]分[秒]秒”。
3. **知识扩展**：在回答核心问题后，你必须根据当前日期/时间扩展至少一条相关的趣味知识（例如：节气、历史事件、或针对该时段的健康建议）。
4. **演示风格**：专业、周到且充满人文关怀。
5. **搜索策略**：将联网搜索结果深度整合为叙事长文。`;

      const messagesForApi = sessionToUpdate ? sessionToUpdate.messages : [newMessage];
      
      const selectedModelInfo = settings.customModels?.find(m => m.id === settings.model);

      const stream = sendMessageStream(messagesForApi, { 
        model: settings.model, 
        apiKey: settings.apiKey,
        baseUrl: selectedModelInfo?.baseUrl,
        temperature: settings.temperature,
        topP: settings.topP,
        topK: settings.topK,
        webSearch: settings.webSearch,
        systemInstruction: systemPrompt
      });
      
      let fullContent = "";
      
      const modelPlaceholder: Message = {
        role: 'model',
        content: "",
        timestamp: Date.now()
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, modelPlaceholder] };
        }
        return s;
      }));

      try {
        for await (const chunk of stream) {
          fullContent += chunk;
          setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
              const lastMessage = { ...s.messages[s.messages.length - 1], content: fullContent };
              return {
                ...s,
                messages: [...s.messages.slice(0, -1), lastMessage]
              };
            }
            return s;
          }));
        }
      } catch (streamError: any) {
        if (!fullContent) {
          // If no content was received, show the error in the chat
          fullContent = (streamError.message && streamError.message.includes('[系统错误]')) 
            ? streamError.message 
            : `[服务错误] 暂时无法获取响应。详情: ${streamError.message || '未知错误'}`;
            
          setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
              const lastMessage = { ...s.messages[s.messages.length - 1], content: fullContent };
              return {
                ...s,
                messages: [...s.messages.slice(0, -1), lastMessage]
              };
            }
            return s;
          }));
        }
      }

      // Save the complete session state to storage
      if (activeSessionId) {
        const currentSession = storage.getSessions().find(s => s.id === activeSessionId);
        if (currentSession) {
          const finalMessages: Message[] = [...currentSession.messages, { role: 'model', content: fullContent, timestamp: Date.now() }];
          storage.updateSession(activeSessionId, { messages: finalMessages });
        }
      }
    } catch (error: any) {
      console.error("Failed to get response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
  };

  const handleDeleteSession = (id: string) => {
    storage.deleteSession(id);
    const updatedSessions = sessions.filter(s => s.id !== id);
    setSessions(updatedSessions);
    if (currentSessionId === id) {
      if (updatedSessions.length > 0) {
        setCurrentSessionId(updatedSessions[0].id);
      } else {
        createNewSession();
      }
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    const sessionToUpdate = sessions.find(s => s.id === id);
    if (sessionToUpdate) {
      const updatedSessions = sessions.map(s => {
        if (s.id === id) {
          return { ...s, title: newTitle, updatedAt: Date.now() };
        }
        return s;
      });
      setSessions(updatedSessions);
      storage.updateSession(id, { title: newTitle });
    }
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
  };

  // Add this useEffect to handle theme and global styles
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      // Polyfill hack for older Android Webviews that ignore class changes dynamically
      document.body.style.backgroundColor = '#0f172a';
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#F8FAFC';
    }
  }, [settings.theme]);

  const handleModelChange = (model: string) => {
    const newSettings = { ...settings, model };
    setSettings(newSettings);
    storage.saveSettings(newSettings);
  };

  const fontSizeMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900 ${fontSizeMap[settings.fontSize]} transition-colors duration-300`}>
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onSelectSession={handleSelectSession}
        onNewSession={createNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      
      <main className="flex-1 overflow-hidden transition-all duration-300">
        <ChatField 
          messages={currentSession?.messages || []}
          selectedModel={settings.model}
          availableModels={settings.customModels || []}
          onModelChange={handleModelChange}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </main>

      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal 
            settings={settings}
            onSave={handleSaveSettings}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
