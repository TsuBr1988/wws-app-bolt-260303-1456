import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SystemVersionProvider } from './contexts/SystemVersionContext';
import { YearProvider } from './contexts/YearContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SystemVersionProvider>
      <YearProvider>
        <App />
      </YearProvider>
    </SystemVersionProvider>
  </StrictMode>
);