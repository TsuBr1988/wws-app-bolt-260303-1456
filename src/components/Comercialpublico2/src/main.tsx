import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SystemVersionProvider } from './contexts/SystemVersionContext';
import { YearProvider } from './contexts/YearContext';
import { DepartmentProvider } from './contexts/DepartmentContext';
import { AccessProvider } from './contexts/AccessContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessProvider>
      <SystemVersionProvider>
        <YearProvider>
          <DepartmentProvider>
            <App />
          </DepartmentProvider>
        </YearProvider>
      </SystemVersionProvider>
    </AccessProvider>
  </StrictMode>
);