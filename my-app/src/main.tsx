// Polyfills for Node.js modules in browser
import { Buffer } from 'buffer';

// Make them globally available
declare global {
  interface Window {
    global: typeof globalThis;
    Buffer: typeof Buffer;
    process: {
      env: Record<string, string | undefined>;
      browser: boolean;
      nextTick: (callback: () => void) => void;
    };
  }
}

window.global = globalThis;
window.Buffer = Buffer;
window.process = {
  env: {},
  browser: true,
  nextTick: (callback: () => void) => setTimeout(callback, 0)
};

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Provider } from "react-redux";
import { store } from "./store";
import './i18n'; // Initialize i18n
import RTLThemeProvider from './components/common/RTLThemeProvider';
import DynamicToastContainer from './components/common/DynamicToastContainer';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <RTLThemeProvider>
        <App />
        <DynamicToastContainer />
      </RTLThemeProvider>
    </Provider>
  </StrictMode>
);
