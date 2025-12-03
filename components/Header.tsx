import React from 'react';
import { GalleryHorizontal, Wand2, User as UserIcon, LogOut } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  currentView: 'gallery' | 'generator' | 'profile';
  setCurrentView: (view: 'gallery' | 'generator' | 'profile') => void;
  currentUser: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentView, 
  setCurrentView, 
  currentUser, 
  onLoginClick,
  onLogoutClick 
}) => {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('gallery')}>
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              <span className="pb-1">🍌</span>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">NanoBanana</span>
          </div>

          <nav className="hidden md:flex gap-1">
            <button
              onClick={() => setCurrentView('gallery')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2
                ${currentView === 'gallery' 
                  ? 'text-purple-700 bg-purple-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              <GalleryHorizontal size={18} />
              Painting Gallery
            </button>
            <button
              onClick={() => setCurrentView('generator')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2
                ${currentView === 'generator' 
                  ? 'text-purple-700 bg-purple-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              <Wand2 size={18} />
              Image Generation
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={() => setCurrentView('generator')}
             className="hidden sm:flex bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors items-center gap-2 shadow-sm shadow-purple-200">
             <Wand2 size={16} />
             Start Generating
           </button>
           
           {currentUser ? (
             <div className="flex items-center gap-2">
               <div 
                  onClick={() => setCurrentView('profile')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-colors
                    ${currentView === 'profile' ? 'bg-purple-100' : 'bg-gray-100 hover:bg-gray-200'}`}
               >
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs overflow-hidden">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.username} className="w-full h-full object-cover"/>
                    ) : (
                      <UserIcon size={14} />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 pr-1">{currentUser.username}</span>
               </div>
               <button 
                 onClick={onLogoutClick}
                 className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                 title="Logout"
               >
                 <LogOut size={18} />
               </button>
             </div>
           ) : (
             <button
               onClick={onLoginClick}
               className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
             >
               Login / Register
             </button>
           )}
        </div>
      </div>
    </header>
  );
};

export default Header;
