import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ExperienceBoundary from './ExperienceBoundary';
import './global.scss';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Missing application root element');
}

createRoot(container).render(
  <StrictMode>
    <ExperienceBoundary>
      <App />
    </ExperienceBoundary>
  </StrictMode>,
);
