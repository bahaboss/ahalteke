import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register VitePWA Service Worker cleanly with auto-update support
registerSW({
  immediate: true,
  onOfflineReady() {
    // Oflaýn keş taýýar
  },
});

createRoot(document.getElementById('root')!).render(<App />);
