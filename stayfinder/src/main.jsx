import './i18n';
import { CurrencyProvider } from './context/CurrencyContext';
import App from './App';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CurrencyProvider>
      <App />
    </CurrencyProvider>
  </StrictMode>
);
