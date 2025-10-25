import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { validateEnvVars } from './utils/security';

// Validate environment variables on startup
const envValidation = validateEnvVars();
if (!envValidation.valid) {
  console.error('❌ Missing required environment variables:', envValidation.missing);
  console.error('Please check your .env file and ensure all required variables are set.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <ProjectProvider>
            <App />
          </ProjectProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
