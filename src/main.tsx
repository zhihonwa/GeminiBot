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
// Strategy: Try original fetch first (supports streaming/ReadableStream responses).
// If it fails due to CORS, fall back to CapacitorHttp native request (bypasses CORS
// but doesn't support streaming). This ensures @google/genai SDK's streaming requests
// work correctly when CORS allows, and non-streaming requests work via native fallback.
//
// IMPORTANT: capacitor.config.json sets CapacitorHttp.enabled = false to prevent
// native-bridge.js from auto-patching window.fetch, because that patch returns
// Response objects without body (ReadableStream), breaking SDK streaming.
const win = window as any;
if (win.Capacitor && win.Capacitor.isNativePlatform && win.Capacitor.isNativePlatform()) {
  // Use dynamic import() instead of require() because project uses ESM ("type": "module")
  import('@capacitor/core').then(({ CapacitorHttp }) => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      // First, try the original fetch (supports streaming/ReadableStream)
      try {
        const response = await originalFetch(input, init);
        // If response is OK, return it directly (streaming works through this path)
        return response;
      } catch (fetchError: any) {
        // Original fetch failed - likely CORS in Capacitor WebView
        // Fall back to CapacitorHttp native request which bypasses CORS
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

        // Parse request body
        let data: any = undefined;
        if (init?.body) {
          if (typeof init.body === 'string') {
            data = init.body;
          } else {
            try {
              data = JSON.parse(String(init.body));
            } catch {
              data = String(init.body);
            }
          }
        }

        try {
          const nativeResponse = await CapacitorHttp.request({
            url,
            method,
            headers,
            data,
            responseType: 'text',
          });

          return new Response(nativeResponse.data, {
            status: nativeResponse.status,
            statusText: nativeResponse.status >= 200 && nativeResponse.status < 300 ? 'OK' : 'Error',
            headers: new Headers(nativeResponse.headers || {}),
          });
        } catch (nativeError: any) {
          // Native HTTP also failed - throw the original fetch error
          throw fetchError;
        }
      }
    };

    console.log('Capacitor HTTP polyfill applied (try-fetch-first strategy)');
  }).catch((e) => {
    console.warn('Failed to load Capacitor core for HTTP polyfill:', e);
  });
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
