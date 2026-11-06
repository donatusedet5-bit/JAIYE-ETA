import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import '@fontsource-variable/geist';
import './styles/tokens.css';
import './styles/landing.css';
import './styles/motion.css';
import './styles/fixes.css';
import './styles/mobile.css';
import './styles/cover.css';
import Landing from './pages/Landing';
import { watchReveals } from './reveal';
import { useTheme } from './theme';
import { CurrencyProvider } from './currency';

// The app is its own bundle so the landing page stays light.
const App = lazy(() => import('./app/App'));

function Root() {
  useTheme();
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app/*" element={<Suspense fallback={<div className="jx-boot" />}><App /></Suspense>} />
    </Routes>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter><CurrencyProvider><Root /></CurrencyProvider></BrowserRouter>
  </StrictMode>,
);
watchReveals();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // An installed iPhone app can stay open for days, so check for a new version whenever
  // it comes back to the front, and reload once when a new version takes over.
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
    }).catch(() => {});
  });
}
