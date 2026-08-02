import React, { createContext, useContext, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be wrapped inside NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showNotification = (message, type = 'info', duration = 6000) => {
    setToast({ message, type });
    // Reset toast automatically after period
    setTimeout(() => {
      setToast(curr => (curr && curr.message === message ? null : curr));
    }, duration);
  };

  const clearNotification = () => setToast(null);

  return (
    <NotificationContext.Provider value={{ showNotification, clearNotification }}>
      {children}
      {toast && (
        <div 
          id="toast-notification"
          className="fixed bottom-6 right-6 z-[9999] max-w-sm rounded-2xl border bg-slate-900 border-slate-800 p-4 shadow-2xl flex gap-3 items-start animate-fade-in hover:border-slate-700"
        >
          <span className={`mt-0.5 shrink-0 ${
            toast.message.toLowerCase().includes('exceeded')
              ? 'text-red-400' 
              : 'text-amber-400'
          }`}>
            <AlertTriangle className="h-4.5 w-4.5" />
          </span>
          
          <div className="flex-1 text-xs font-semibold text-slate-350 leading-relaxed pr-2">
            {toast.message}
          </div>

          <button 
            onClick={clearNotification}
            className="text-slate-500 hover:text-white shrink-0 p-0.5 rounded hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};
