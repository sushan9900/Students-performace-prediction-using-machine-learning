
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ── Theme Initialisation ──────────────────────────────────────────────────────
// Read persisted theme from localStorage and apply before first paint.
// This runs synchronously before React hydration to prevent theme flicker.
const applyPersistedTheme = (): void => {
  try {
    const saved = localStorage.getItem('edu-theme');
    const root  = document.documentElement;
    if (saved === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.remove('light');
    }
  } catch {
    // localStorage not available (private browsing, etc.)
  }
};

applyPersistedTheme();

// ── Mount React App ───────────────────────────────────────────────────────────
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('[EduAnalytics] Root element #root not found in DOM.');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ── Dismiss Initial HTML Loader ───────────────────────────────────────────────
// After React has committed its first render, hide the native HTML loader
// that was shown before the JS bundle executed.
const hideLoader = (): void => {
  if (typeof (window as Window & { __hideLoader?: () => void }).__hideLoader === 'function') {
    (window as Window & { __hideLoader?: () => void }).__hideLoader!();
  }
};

// Use requestAnimationFrame to ensure React has painted before hiding
requestAnimationFrame(() => {
  requestAnimationFrame(hideLoader);
});
