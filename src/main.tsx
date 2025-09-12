import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from './components/auth/ClerkProvider';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider>
      <App />
    </ClerkProvider>
  </StrictMode>
);
