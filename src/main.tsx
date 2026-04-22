import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Polyfill for structuredClone which is missing in Android 10 WebView and used by @google/genai
if (typeof structuredClone === 'undefined') {
  (window as any).structuredClone = function (obj: any) {
    return JSON.parse(JSON.stringify(obj));
  };
}

// 强行注销所有可能是之前版本遗留的 Service Worker，防止旧的缓存导致无样式
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  }).catch(function(err) {
    console.log('Service Worker registration failed: ', err);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
