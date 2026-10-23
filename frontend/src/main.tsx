import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { PredictionProvider } from './context/PredictionContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <PredictionProvider>
          <App />
        </PredictionProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
