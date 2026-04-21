import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Loader2, StopCircle, Mic, MicOff, PanelLeft, Paperclip, X } from 'lucide-react';
import { Message } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { MODELS } from '../constants';

interface ChatFieldProps {
  messages: Message[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onStop?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export default function ChatField({
  messages,
  selectedModel,
  onModelChange,
  onSendMessage,
  isLoading,
  onStop,
  isSidebarOpen,
  onToggleSidebar
}: ChatFieldProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Voice Input Logic
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'zh-CN';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error(e);
        }
      }
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        setIsRecording(true);
        recognitionRef.current.start();
      } else {
        alert('您的浏览器不支持语音识别功能。');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || selectedFile) && !isLoading) {
      const messageContent = selectedFile ? `[已附带文件: ${selectedFile.name}]\n${input.trim()}` : input.trim();
      onSendMessage(messageContent);
      setInput('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative overflow-hidden transition-colors duration-300">
      {/* Header */}
      <header className="h-16 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 transition-all">
        <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
          {!isSidebarOpen && onToggleSidebar && (
            <button 
              onClick={onToggleSidebar}
              className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <PanelLeft size={20} />
            </button>
          )}
          <h2 className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[200px] md:max-w-md">
            {messages.length > 0 ? "当前对话" : "新对话"}
          </h2>
        </div>
        <div className="relative group shrink-0">
            <select 
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="appearance-none bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full px-3 py-1 uppercase border border-blue-100 dark:border-blue-900 outline-none cursor-pointer pr-6 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%232563eb%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center' }}
            >
              {MODELS.map(m => (
                <option key={m.id} value={m.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                  {m.name}
                </option>
              ))}
            </select>
          </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
        <div className="max-w-3xl mx-auto space-y-6 pb-32">
          {messages.length === 0 ? (
            <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                <div className="w-6 h-6 border-4 border-white rounded-full"></div>
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-2">有什么我可以帮您的？</h2>
                <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm">
                  不管是写代码、规划行程，还是讨论科学话题，我都在这里。
                </p>
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'model' && (
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-4 shadow-sm border transition-colors ${
                    message.role === 'user' 
                      ? 'bg-blue-600 border-blue-500 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border-slate-100 dark:border-slate-700'
                  }`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <div className={`mt-2 text-[10px] opacity-40 font-medium ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center shrink-0">
                      <User size={16} className="text-white dark:text-slate-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <form 
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto relative flex flex-col gap-2"
        >
          <AnimatePresence>
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-xl text-xs w-full max-w-[200px] border border-blue-100 dark:border-blue-800"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Paperclip size={14} className="shrink-0" />
                  <span className="truncate">{selectedFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl transition-all overflow-hidden p-1 shadow-sm border border-transparent focus-within:border-blue-500/30">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden" 
              accept="*/*"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl transition-all text-slate-400 hover:text-blue-500 hover:bg-slate-200 dark:hover:bg-slate-700"
              title="上传文件"
            >
              <Paperclip size={20} />
            </button>
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-3 rounded-xl transition-all ${
                isRecording 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-500 animate-pulse' 
                  : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-blue-500'
              }`}
              title="语音输入"
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={isRecording ? "正在听..." : "给 Gemini 发送消息..."}
              className="flex-1 max-h-32 resize-none bg-transparent border-none focus:ring-0 text-sm py-3 px-3 outline-none placeholder:text-slate-400 dark:text-slate-200"
            />
            
            <div className="flex items-center gap-2 px-1">
              {isLoading ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="w-10 h-10 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  <StopCircle size={20} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() && !selectedFile}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all ${
                    (input.trim() || selectedFile)
                      ? 'bg-blue-600 text-white shadow-blue-500/30 hover:bg-blue-700' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-600 shadow-none cursor-not-allowed'
                  }`}
                >
                  <Send size={18} />
                </button>
              )}
            </div>
          </div>
          {isLoading && (
            <div className="mt-3 text-center">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 animate-pulse flex items-center justify-center gap-2 font-bold">
                <Loader2 size={12} className="animate-spin text-blue-500" />
                Gemini 正在响应
              </span>
            </div>
          )}
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 mt-4 font-medium uppercase tracking-tight">
            Gemini 可能会提供不准确的信息，请核查重要回复。
          </p>
        </form>
      </footer>
    </div>
  );
}
