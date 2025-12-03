
import React, { useEffect } from 'react';
import { Check, AlertCircle, Info } from 'lucide-react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-gray-800 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white'
  };

  const icons = {
    success: <Check size={16} className="text-green-400" />,
    error: <AlertCircle size={16} />,
    info: <Info size={16} />
  };

  return (
    <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl z-[100] animate-in slide-in-from-bottom-5 duration-300 ${styles[type]}`}>
      {icons[type]}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

export default Toast;
