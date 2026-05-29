import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme as antTheme } from 'antd';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';
import { lightTheme, darkTheme } from './theme/antdTheme';
import { useUiStore } from './store/uiStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function ThemedApp() {
  const darkMode = useUiStore((s) => s.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <ConfigProvider
      theme={{
        ...(darkMode ? darkTheme : lightTheme),
        algorithm: darkMode ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
      }}
    >
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: 8, fontFamily: 'Inter, sans-serif' },
          success: { style: { borderLeft: '4px solid #10B981' } },
          error: { style: { borderLeft: '4px solid #EF4444' } },
        }}
      />
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemedApp />
    </QueryClientProvider>
  </React.StrictMode>,
);
