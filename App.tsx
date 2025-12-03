
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Gallery from './components/Gallery';
import Generator from './components/Generator';
import Profile from './components/Profile';
import ImageModal from './components/ImageModal';
import LoginModal from './components/LoginModal';
import Toast, { ToastProps } from './components/Toast';
import { GalleryItem, User } from './types';

// Initial Mock Data - Cleared for testing from scratch
const INITIAL_GALLERY: GalleryItem[] = [];

interface RegisteredUser extends User {
    password: string; // Mock password storage
}

function App() {
  const [currentView, setCurrentView] = useState<'gallery' | 'generator' | 'profile'>('gallery');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Mock Database
  const [items, setItems] = useState<GalleryItem[]>(INITIAL_GALLERY);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  
  // Modal States
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  
  // Remix State
  const [remixState, setRemixState] = useState<{prompt: string, sourceImage?: string} | null>(null);
  
  // Toast State
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const handleRegister = (username: string, password: string): boolean => {
      if (registeredUsers.some(u => u.username === username)) return false;
      
      const newUser: RegisteredUser = {
          id: username.toLowerCase().replace(/\s/g, '_'),
          username: username,
          password: password,
          avatar: `https://ui-avatars.com/api/?name=${username}&background=random`
      };
      
      setRegisteredUsers(prev => [...prev, newUser]);
      // Auto login after register
      setCurrentUser(newUser);
      setIsLoginOpen(false);
      showToast(`Welcome to NanoBanana, ${username}!`);
      return true;
  };

  const handleLogin = (username: string, password: string): boolean => {
      const user = registeredUsers.find(u => u.username === username && u.password === password);
      if (user) {
          setCurrentUser(user);
          setIsLoginOpen(false);
          showToast(`Welcome back, ${username}!`);
          return true;
      }
      return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('gallery');
    showToast('Logged out successfully', 'info');
  };

  const handleGenerateComplete = (imageUrl: string, prompt: string, isPublic: boolean) => {
    if (!currentUser) return;

    const newItem: GalleryItem = {
      id: Date.now().toString(),
      title: prompt.slice(0, 20) + (prompt.length > 20 ? '...' : ''),
      imageUrls: [imageUrl],
      likedBy: [],
      views: 0,
      date: new Date().toLocaleDateString('en-CA'), // YYYY/MM/DD format
      timestamp: Date.now(),
      prompt: prompt,
      authorId: currentUser.id,
      authorName: currentUser.username,
      isPublic: isPublic
    };

    setItems(prev => {
        // Enforce 100 limit for this specific user's history
        // We need to keep all other users' items intact
        // So: 1. Get other users' items
        // 2. Get this user's items, prepend new one
        // 3. Slice this user's items to 100
        // 4. Combine
        
        const otherItems = prev.filter(i => i.authorId !== currentUser.id);
        const userItems = prev.filter(i => i.authorId === currentUser.id);
        
        const updatedUserItems = [newItem, ...userItems].slice(0, 100);
        
        // Re-sort everything by timestamp to maintain gallery order? 
        // Or just keep the array simple. Appending to top usually works for feeds.
        // Let's sort combined to be safe for global feed.
        return [...updatedUserItems, ...otherItems].sort((a,b) => b.timestamp - a.timestamp);
    });
    
    if (isPublic) {
        showToast('Image published to Gallery!', 'success');
    } else {
        showToast('Image saved to History', 'success');
    }
  };

  const handleDeleteItem = (itemToDelete: GalleryItem) => {
      setItems(prev => prev.filter(item => item.id !== itemToDelete.id));
      showToast("Creation deleted", "info");
      if (selectedItem?.id === itemToDelete.id) setSelectedItem(null);
  };

  const handleTogglePublish = (itemToToggle: GalleryItem) => {
      const newStatus = !itemToToggle.isPublic;
      setItems(prev => prev.map(item => {
          if (item.id === itemToToggle.id) {
              return { ...item, isPublic: newStatus };
          }
          return item;
      }));
      // Update selected item if open
      if (selectedItem?.id === itemToToggle.id) {
          setSelectedItem({ ...selectedItem, isPublic: newStatus });
      }
      showToast(newStatus ? "Published to Gallery" : "Removed from Gallery", "success");
  };

  const handleLike = (itemId: string) => {
    if (!currentUser) {
      setIsLoginOpen(true);
      return;
    }

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const hasLiked = item.likedBy.includes(currentUser.id);
        const newLikedBy = hasLiked 
          ? item.likedBy.filter(id => id !== currentUser.id)
          : [...item.likedBy, currentUser.id];
        
        // Notification logic simulation
        if (!hasLiked && item.authorId !== currentUser.id) {
             // If we had a real backend, we'd send a notification to item.authorId
             // For now, if we were logged in as the author in another window, we'd see it. 
             // We'll just toast the liker.
             showToast(`You liked ${item.authorName}'s work!`);
        } else if (!hasLiked) {
             showToast('Added to liked works');
        } else {
             showToast('Removed like');
        }
        
        const updatedItem = { ...item, likedBy: newLikedBy };
        
        // Update selected item live if it's the one open
        if (selectedItem?.id === itemId) {
             setSelectedItem(updatedItem);
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const handleRemix = (item: GalleryItem) => {
    setRemixState({
        prompt: item.prompt,
        sourceImage: item.imageUrls[0]
    });
    setSelectedItem(null);
    setCurrentView('generator');
    showToast('Ready to remix! Settings loaded.', 'info');
  };

  const handleItemClick = (item: GalleryItem) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, views: i.views + 1 } : i));
    setSelectedItem({ ...item, views: item.views + 1 });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        currentUser={currentUser}
        onLoginClick={() => setIsLoginOpen(true)}
        onLogoutClick={handleLogout}
      />
      
      <main className="flex-1">
        {currentView === 'gallery' && (
          <Gallery 
            items={items} 
            currentUser={currentUser} 
            onLike={handleLike}
            onItemClick={handleItemClick}
            showToast={showToast}
          />
        )}
        
        {currentView === 'generator' && (
          <Generator 
            currentUser={currentUser}
            onGenerateComplete={handleGenerateComplete}
            initialState={remixState}
            onClearInitialState={() => setRemixState(null)}
            showToast={showToast}
          />
        )}

        {currentView === 'profile' && currentUser && (
            <Profile 
                currentUser={currentUser}
                items={items}
                onItemClick={handleItemClick}
                onDelete={handleDeleteItem}
                onTogglePublish={handleTogglePublish}
            />
        )}
      </main>

      {/* Global Toast */}
      {toast && (
          <Toast 
             message={toast.message} 
             type={toast.type} 
             onClose={() => setToast(null)} 
          />
      )}

      {/* Modals */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
      
      {selectedItem && (
          <ImageModal 
            isOpen={!!selectedItem}
            item={selectedItem}
            currentUser={currentUser}
            onClose={() => setSelectedItem(null)}
            onRemix={handleRemix}
            onLike={handleLike}
            onDelete={handleDeleteItem}
            onTogglePublish={handleTogglePublish}
            showToast={showToast}
          />
      )}
    </div>
  );
}

export default App;
