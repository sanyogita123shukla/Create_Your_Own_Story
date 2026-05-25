import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastCtx = createContext(null);

let _toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = 'info', duration = 3500 }) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={addToast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            className={`
              pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold
              backdrop-blur-xl border transition-all animate-in slide-in-from-right-8 fade-in cursor-pointer
              ${t.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' : ''}
              ${t.type === 'error'   ? 'bg-red-950/90 border-red-500/30 text-red-300' : ''}
              ${t.type === 'info'    ? 'bg-indigo-950/90 border-indigo-500/30 text-indigo-300' : ''}
              ${t.type === 'warn'    ? 'bg-amber-950/90 border-amber-500/30 text-amber-300' : ''}
            `}
          >
            <span>
              {t.type === 'success' && '✅'}
              {t.type === 'error'   && '❌'}
              {t.type === 'info'    && 'ℹ️'}
              {t.type === 'warn'    && '⚠️'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return {
    success: (msg) => ctx({ message: msg, type: 'success' }),
    error:   (msg) => ctx({ message: msg, type: 'error' }),
    info:    (msg) => ctx({ message: msg, type: 'info' }),
    warn:    (msg) => ctx({ message: msg, type: 'warn' }),
  };
};
