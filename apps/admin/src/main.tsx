import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@app/App';
import '@styles/tailwind.css';
import '@styles/index.css';
import '@styles/theme.css';
import '@styles/mobile.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
