import { ChatSession, AppSettings } from "../types";

const STORAGE_KEY = 'gemini_bot_sessions';
const SETTINGS_KEY = 'gemini_bot_settings';

export const storage = {
  getSettings: (): AppSettings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : { 
      model: 'gemini-1.5-pro', 
      apiKey: '',
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      theme: 'light',
      fontSize: 'md',
      webSearch: true
    };
  },
  
  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },
  
  getSessions: (): ChatSession[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  saveSessions: (sessions: ChatSession[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  },
  
  addSession: (session: ChatSession) => {
    const sessions = storage.getSessions();
    sessions.unshift(session);
    storage.saveSessions(sessions);
  },
  
  updateSession: (id: string, updates: Partial<ChatSession>) => {
    const sessions = storage.getSessions();
    const index = sessions.findIndex(s => s.id === id);
    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...updates, updatedAt: Date.now() };
      storage.saveSessions(sessions);
    }
  },
  
  deleteSession: (id: string) => {
    const sessions = storage.getSessions();
    const filtered = sessions.filter(s => s.id !== id);
    storage.saveSessions(filtered);
  }
};
