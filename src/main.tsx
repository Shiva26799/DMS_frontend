import { createRoot } from "react-dom/client";
import App from "./app/App";
import { Toaster } from "./app/components/ui/sonner";
import "./styles/index.css";

createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <Toaster 
      position="top-center" 
      expand={false} 
      duration={1500}
      toastOptions={{
        style: {
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          borderRadius: '10px',
          padding: '8px 16px',
          fontSize: '12px',
          fontWeight: '500',
          color: '#030213',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        }
      }}
    />
  </>
);
