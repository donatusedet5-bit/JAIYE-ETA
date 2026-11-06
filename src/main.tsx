import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import '@fontsource-variable/geist';
import './styles/tokens.css';
import './styles/landing.css';
import './styles/motion.css';
import './styles/fixes.css';
import Landing from './pages/Landing';
import AppSoon from './pages/AppSoon';
import { useTheme } from './theme';
import { CurrencyProvider } from './currency';

function Root() {
  useTheme(); // applies saved or system theme on every route
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app/*" element={<AppSoon />} />
    </Routes>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter><CurrencyProvider><Root /></CurrencyProvider></BrowserRouter>
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
}
