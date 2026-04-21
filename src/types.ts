export type Message = {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};

export type CustomModel = {
  id: string;
  name: string;
  baseUrl?: string;
};

export type AppSettings = {
  model: string;
  apiKey: string;
  temperature: number;
  topP: number;
  topK: number;
  theme: 'light' | 'dark';
  fontSize: 'sm' | 'md' | 'lg';
  webSearch: boolean;
  customModels: CustomModel[];
};
