import React from 'react';

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
const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

// useToast custom hook
export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// ToastProvider component
export const ToastProvider = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const toastTimers = React.useRef<{ [id: string]: NodeJS.Timeout }>({});

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

  React.useEffect(() => {
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

/**
 * Toast component responsible for rendering the toast content.
 * If the content is a React element, it clones the element and injects the onClose prop,
 * which allows the Alert component to call back to hide the toast.
 * Otherwise, it renders the content as is.
 */
const Toast = ({ toast, hideToast }: ToastProps): React.ReactElement => {
  const handleClose = () => {
    hideToast(toast.id);
  };

  // Check if toast.content is a valid React element to inject onClose prop
  // Define a type for the props to be injected, here only onClose is expected
  type InjectedProps = { onClose: () => void };

  const contentWithOnClose = React.isValidElement<InjectedProps>(toast.content)
    ? React.cloneElement(toast.content, { onClose: handleClose })
    : toast.content;

  return <div className="toast toast-center">{contentWithOnClose}</div>;
};
