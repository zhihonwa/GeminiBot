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

// Capacitor HTTP polyfill for Android: bypass CORS restrictions in WebView
// When running in Capacitor native environment, patch window.fetch to use CapacitorHttp
// which makes requests through the native HTTP client, bypassing WebView CORS policy.
// Note: capacitor.config.json also sets plugins.CapacitorHttp.enabled = true for
// automatic fetch/XHR patching. This runtime code serves as a supplemental approach.
const win = window as any;
if (win.Capacitor && win.Capacitor.isNativePlatform && win.Capacitor.isNativePlatform()) {
  try {
    // Import CapacitorHttp dynamically to avoid bundling issues in non-Capacitor builds
    const { CapacitorHttp } = require('@capacitor/core');

    // Store the original fetch for fallback (e.g., streaming requests)
    const originalFetch = window.fetch;

    // Override window.fetch with a version that uses native HTTP for non-streaming requests
    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      const method = init?.method || 'GET';

      // Convert headers to plain object
      const headers: Record<string, string> = {};
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => { headers[key] = value; });
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, value]) => { headers[key] = value; });
        } else {
          Object.assign(headers, init.headers);
        }
      }

      // For streaming requests (used by @google/genai SDK), fall back to original fetch
      // because CapacitorHttp doesn't support ReadableStream responses
      const isStreamingRequest = headers['Accept']?.includes('text/event-stream') ||
                                  init?.body instanceof ReadableStream;

      if (isStreamingRequest) {
        return originalFetch(input, init);
      }

      try {
        // Use CapacitorHttp for non-streaming requests to bypass CORS
        const response = await CapacitorHttp.request({
          url,
          method,
          headers,
          data: init?.body ? (typeof init.body === 'string' ? init.body : JSON.parse(String(init.body))) : undefined,
          responseType: 'text',
        });

        // Wrap the native response into a standard Response object
        return new Response(response.data, {
          status: response.status,
          statusText: response.status >= 200 && response.status < 300 ? 'OK' : 'Error',
          headers: new Headers(response.headers || {}),
        });
      } catch (nativeError: any) {
        // If native HTTP fails, fall back to original fetch
        console.warn('CapacitorHttp request failed, falling back to original fetch:', nativeError);
        return originalFetch(input, init);
      }
    };

    console.log('Capacitor HTTP polyfill applied successfully');
  } catch (e) {
    console.warn('Failed to apply Capacitor HTTP polyfill:', e);
  }
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
