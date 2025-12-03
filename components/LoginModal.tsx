
import React, { useState } from 'react';
import { X, User, Lock, UserPlus, LogIn } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string, password: string) => boolean;
  onRegister: (username: string, password: string) => boolean;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, onRegister }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (isRegistering) {
      const success = onRegister(username, password);
      if (success) {
        setUsername('');
        setPassword('');
        // Automatically close on success (handled by App usually, but for UX we might just switch or login)
      } else {
        setError("Username already exists");
      }
    } else {
      const success = onLogin(username, password);
      if (success) {
        setUsername('');
        setPassword('');
      } else {
        setError("Invalid username or password");
      }
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError(null);
    setUsername('');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
           <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${isRegistering ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
              {isRegistering ? <UserPlus size={32} /> : <LogIn size={32} />}
           </div>
           <h2 className="text-2xl font-bold text-gray-900">
             {isRegistering ? 'Create Account' : 'Welcome Back'}
           </h2>
           <p className="text-gray-500 text-sm mt-1">
             {isRegistering ? 'Join the community to create and share' : 'Login to access your gallery'}
           </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={16} />
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Username"
                  autoFocus
                />
              </div>
           </div>
           
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="••••••••"
                />
              </div>
           </div>

           {error && (
             <div className="text-red-500 text-xs bg-red-50 p-2 rounded border border-red-100 text-center">
               {error}
             </div>
           )}
           
           <button 
             type="submit"
             className={`w-full text-white py-2.5 rounded-lg font-semibold transition-colors shadow-lg flex items-center justify-center gap-2
               ${isRegistering 
                 ? 'bg-green-600 hover:bg-green-700 shadow-green-200' 
                 : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'}`}
           >
             {isRegistering ? 'Register' : 'Login'}
           </button>
        </form>
        
        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={toggleMode}
            className="text-sm text-gray-500 hover:text-gray-800 underline decoration-dotted underline-offset-4"
          >
            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
