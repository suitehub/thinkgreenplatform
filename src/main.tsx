import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { bootstrapApp } from './lib/bootstrap';
import { getAppBasePath } from './utils/urlUtils';

const container = document.getElementById('root')!;

container.innerHTML = `
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;color:#075e38">
    <div style="text-align:center">
      <div style="width:42px;height:42px;border:4px solid #d1fae5;border-top-color:#075e38;border-radius:50%;margin:0 auto 16px;animation:tgspin 1s linear infinite"></div>
      <p style="font-size:14px;font-weight:600;margin:0">Carregando dados seguros...</p>
      <style>@keyframes tgspin{to{transform:rotate(360deg)}}</style>
    </div>
  </div>`;

const renderApp = () => {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
};

// PWA: registra o service worker (todos os cargos usam o mesmo app instalável)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const base = getAppBasePath();
    navigator.serviceWorker
      .register(`${base}/sw.js`, { scope: `${base}/` })
      .catch(() => undefined);
  });
}

// Render only after Firestore has hydrated the in-memory caches, but never
// block the UI forever if the network is unreachable.
const hydrationTimeout = new Promise<void>((resolve) => setTimeout(resolve, 20000));

Promise.race([bootstrapApp(), hydrationTimeout]).finally(renderApp);
