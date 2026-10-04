import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import ExperienceBoundary from './app/providers/ExperienceBoundary';
import './app/styles/global.scss';

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
