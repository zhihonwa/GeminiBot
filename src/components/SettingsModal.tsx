import React, { useState } from 'react';
import { X, Save, Sun, Moon, Type as TypeIcon, Sliders, Globe, Database, Plus, Trash2 } from 'lucide-react';
import { AppSettings, CustomModel } from '../types';
import { motion } from 'motion/react';
import { MODELS } from '../constants';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

export default function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<'general' | 'model_params' | 'models_management' | 'appearance'>('general');

  const [newModel, setNewModel] = useState<Partial<CustomModel>>({ id: '', name: '', baseUrl: '' });

  const handleAddModel = () => {
    if (newModel.id && newModel.name) {
      setLocalSettings(prev => ({
        ...prev,
        customModels: [...(prev.customModels || []), newModel as CustomModel]
      }));
      setNewModel({ id: '', name: '', baseUrl: '' });
    }
  };

  const handleDeleteModel = (id: string) => {
    setLocalSettings(prev => ({
      ...prev,
      customModels: (prev.customModels || []).filter(m => m.id !== id),
      // Automatically switch default if the deleted model is the current one
      model: prev.model === id ? (prev.customModels?.[0]?.id || '') : prev.model
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">设置</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Tabs */}
          <div className="w-32 border-r border-slate-100 dark:border-slate-800 p-2 space-y-1">
            <button 
              onClick={() => setActiveTab('general')}
              className={`w-full flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${activeTab === 'general' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <Sliders size={20} />
              <span className="text-[10px] font-bold">常规</span>
            </button>
            <button 
              onClick={() => setActiveTab('model_params')}
              className={`w-full flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${activeTab === 'model_params' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <TypeIcon size={20} />
              <span className="text-[10px] font-bold">模型参数</span>
            </button>
            <button 
              onClick={() => setActiveTab('models_management')}
              className={`w-full flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${activeTab === 'models_management' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <Database size={20} />
              <span className="text-[10px] font-bold">大模型管理</span>
            </button>
            <button 
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${activeTab === 'appearance' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              {localSettings.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              <span className="text-[10px] font-bold">外观</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">默认模型</label>
                  <select 
                    value={localSettings.model}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer appearance-none"
                  >
                    {localSettings.customModels?.map((m: CustomModel) => (
                      <option key={m.id} value={m.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">API Key (可选)</label>
                  <input 
                    type="password"
                    value={localSettings.apiKey}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="留空即使用系统默认 Key"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                      <Globe size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">实时联网搜索</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">允许 Gemini 获取最新信息</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setLocalSettings(prev => ({ ...prev, webSearch: !prev.webSearch }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${localSettings.webSearch ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSettings.webSearch ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'model_params' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Temperature ({localSettings.temperature})</label>
                  </div>
                  <input 
                    type="range" min="0" max="2" step="0.1"
                    value={localSettings.temperature}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">控制随机性：值越高，输出越有创意；值越低，输出越稳定确切。</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Top P ({localSettings.topP})</label>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.01"
                    value={localSettings.topP}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, topP: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Top K ({localSettings.topK})</label>
                  </div>
                  <input 
                    type="range" min="1" max="100" step="1"
                    value={localSettings.topK}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, topK: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            )}

            {activeTab === 'models_management' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">新增大模型</label>
                  <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <input 
                      type="text"
                      value={newModel.name}
                      onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                      placeholder="模型显示名称 (例如: GPT-4)"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                    <input 
                      type="text"
                      value={newModel.id}
                      onChange={(e) => setNewModel({ ...newModel, id: e.target.value })}
                      placeholder="模型调用 ID (例如: gpt-4)"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                    <input 
                      type="text"
                      value={newModel.baseUrl}
                      onChange={(e) => setNewModel({ ...newModel, baseUrl: e.target.value })}
                      placeholder="Base URL (可选, 例如: https://api.openai.com/v1)"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                    <button
                      onClick={handleAddModel}
                      disabled={!newModel.name || !newModel.id}
                      className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <Plus size={16} /> 添加模型
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">已配置模型</label>
                  <div className="space-y-2">
                    {localSettings.customModels?.map((m: CustomModel) => (
                      <div key={m.id} className="flex flex-col gap-1 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden relative group">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate pr-8">{m.name}</span>
                          <button
                            onClick={() => handleDeleteModel(m.id)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-lg transition-all"
                            title="删除模型"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{m.id}</span>
                        {m.baseUrl && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-1 rounded font-mono truncate">{m.baseUrl}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">主题模式</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setLocalSettings(prev => ({ ...prev, theme: 'light' }))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${localSettings.theme === 'light' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/10' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                    >
                      <Sun size={18} />
                      浅色
                    </button>
                    <button 
                      onClick={() => setLocalSettings(prev => ({ ...prev, theme: 'dark' }))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${localSettings.theme === 'dark' ? 'bg-blue-900/30 border-blue-800 text-blue-400 ring-2 ring-blue-500/10' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                    >
                      <Moon size={18} />
                      深色
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">字体大小</label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {(['sm', 'md', 'lg'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setLocalSettings(prev => ({ ...prev, fontSize: size }))}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${localSettings.fontSize === size ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400'}`}
                      >
                        {size === 'sm' ? '小' : size === 'md' ? '中' : '大'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            取消
          </button>
          <button 
            onClick={() => {
              onSave(localSettings);
              onClose();
            }}
            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
          >
            <Save size={18} />
            应用配置
          </button>
        </div>
      </motion.div>
    </div>
  );
}
