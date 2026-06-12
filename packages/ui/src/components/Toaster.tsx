import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ToastData {
  id: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  content: React.ReactNode;
}

interface ToasterContextValue {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToasterContext = createContext<ToasterContextValue | undefined>(undefined);

const useToaster = () => {
  const context = useContext(ToasterContext);
  if (!context) {
    throw new Error('useToaster must be used within a ToasterProvider');
  }
  return context;
};

export const ToasterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToasterContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToasterContext.Provider>
  );
};

export const useToast = () => {
  const { addToast, removeToast } = useToaster();

  return {
    toast: (props: Omit<ToastData, 'id'>) => addToast(props),
    dismiss: (id: string) => removeToast(id),
  };
};

export const Toaster: React.FC = () => {
  const { toasts, removeToast } = useToaster();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-in slide-in-from-right fade-in duration-300"
          onClick={() => removeToast(toast.id)}
        >
          {toast.content}
        </div>
      ))}
    </div>
  );
};
