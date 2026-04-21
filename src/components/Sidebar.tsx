import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, Search, PanelLeftClose, PanelLeft, Settings } from 'lucide-react';
import { ChatSession } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onOpenSettings: () => void;
  className?: string;
}

export default function Sidebar({
  sessions,
  currentSessionId,
  isOpen,
  onToggle,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onOpenSettings,
  className = ""
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <motion.aside 
        initial={false}
        animate={{ width: isOpen ? 288 : 0, opacity: isOpen ? 1 : 0 }}
        className={`h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden fixed md:relative z-40 transition-colors duration-300 ${className}`}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <div className="w-4 h-4 border-2 border-white rounded-full"></div>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">GeminiBot</h1>
          <button 
            onClick={onToggle}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded ml-auto text-slate-400 transition-colors"
          >
            <PanelLeftClose size={20} />
          </button>
        </div>

        <div className="px-4 mb-6">
          <button 
            onClick={onNewSession}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Plus size={18} />
            开启新对话
          </button>
        </div>

        <div className="px-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="搜索对话记录..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-blue-400 outline-none transition-all dark:text-slate-300"
            />
          </div>
        </div>

        <div className="px-6 py-2 text-[10px] uppercase tracking-wider text-slate-400 font-bold">最近对话</div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <AnimatePresence>
            {filteredSessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                  currentSessionId === session.id 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare size={16} className={`shrink-0 ${currentSessionId === session.id ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="text-sm truncate">{session.title || '新对话'}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button 
            onClick={onOpenSettings}
            className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
          >
            <Settings size={20} />
            <span className="text-sm font-medium">设置</span>
          </button>
          <span className="text-[10px] text-slate-300 dark:text-slate-600 font-medium tracking-widest">V1.0</span>
        </div>
      </motion.aside>

      {/* Mobile Toggle Button (only visible when sidebar is closed) */}
      {!isOpen && (
        <button 
          onClick={onToggle}
          className="fixed left-4 top-4 z-50 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-100 dark:border-slate-700 text-slate-400"
        >
          <PanelLeft size={20} />
        </button>
      )}

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-30 md:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>
    </>
  );
}
