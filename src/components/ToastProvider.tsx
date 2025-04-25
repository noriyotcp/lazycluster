import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// Toast type definition
interface Toast {
  id: string;
  content: React.ReactNode;
  duration?: number;
}

// ToastContext type definition
interface ToastContextType {
  showToast: (content: React.ReactNode, duration?: number) => string;
  hideToast: (id: string) => void;
}

// Create ToastContext
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// useToast custom hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// ToastProvider component
export const ToastProvider = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimers = useRef<{ [id: string]: NodeJS.Timeout }>({});

  const showToast = (content: React.ReactNode, duration: number = 5000): string => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, content, duration };

    setToasts(prevToasts => [...prevToasts, newToast]);

    if (duration > 0) {
      const timer = setTimeout(() => {
        hideToast(id);
      }, duration);
      toastTimers.current[id] = timer;
    }

    return id;
  };

  const hideToast = (id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    if (toastTimers.current[id]) {
      clearTimeout(toastTimers.current[id]);
      delete toastTimers.current[id];
    }
  };

  useEffect(() => {
    return () => {
      Object.values(toastTimers.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} hideToast={hideToast} />
    </ToastContext.Provider>
  );
};

// ToastContainer component
interface ToastContainerProps {
  toasts: Toast[];
  hideToast: (id: string) => void;
}

const ToastContainer = ({ toasts, hideToast }: ToastContainerProps): React.ReactElement => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} hideToast={hideToast} />
      ))}
    </div>
  );
};

// Toast component
interface ToastProps {
  toast: Toast;
  hideToast: (id: string) => void;
}

const Toast = ({ toast, hideToast }: ToastProps): React.ReactElement => {
  const handleClose = () => {
    hideToast(toast.id);
  };

  return (
    <div className="toast toast-center">
      <div role="alert" className="alert alert-error alert-soft pe-px rounded-lg">
        {toast.content}
        <div>
          <button
            className="btn btn-xs btn-ghost"
            onClick={() => {
              window.location.reload();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
              <path
                fillRule="evenodd"
                d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08.932.75.75 0 0 1-1.3-.75 6 6 0 0 1 9.44-1.242l.842.84V3.227a.75.75 0 0 1 .75-.75Zm-.911 7.5A.75.75 0 0 1 13.199 11a6 6 0 0 1-9.44 1.241l-.84-.84v1.371a.75.75 0 0 1-1.5 0V9.591a.75.75 0 0 1 .75-.75H5.35a.75.75 0 0 1 0 1.5H3.98l.841.841a4.5 4.5 0 0 0 7.08-.932.75.75 0 0 1 1.025-.273Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button className="btn btn-xs btn-ghost" onClick={handleClose}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
