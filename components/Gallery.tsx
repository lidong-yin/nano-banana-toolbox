
import React, { useState, useMemo } from 'react';
import { Heart, Eye, ArrowUpDown, LayoutGrid, Sparkles } from 'lucide-react';
import { GalleryItem, User } from '../types';

interface GalleryProps {
  items: GalleryItem[];
  currentUser: User | null;
  onLike: (itemId: string) => void;
  onItemClick: (item: GalleryItem) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

type SortOption = 'time' | 'likes' | 'views';

const Gallery: React.FC<GalleryProps> = ({ items, currentUser, onLike, onItemClick, showToast }) => {
  const [sortOption, setSortOption] = useState<SortOption>('time');

  const sortedItems = useMemo(() => {
    // Only show public items in the gallery
    const publicItems = items.filter(item => item.isPublic);
    
    return [...publicItems].sort((a, b) => {
      switch (sortOption) {
        case 'time':
          return b.timestamp - a.timestamp;
        case 'likes':
          return b.likedBy.length - a.likedBy.length;
        case 'views':
          return b.views - a.views;
        default:
          return 0;
      }
    });
  }, [items, sortOption]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-600 mb-2 flex items-center gap-2">
            Painting Gallery <Sparkles className="text-yellow-400" size={24} fill="currentColor"/>
        </h1>
        <p className="text-gray-500">Explore amazing works created by AI</p>
      </div>

      {/* Toolbar */}
      <div className="flex justify-end mb-6 gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 text-sm font-medium text-gray-700 shadow-sm">
            <button 
                onClick={() => setSortOption('time')}
                className={`px-3 py-1.5 rounded-md transition-colors ${sortOption === 'time' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-50'}`}
            >
                Time
            </button>
            <button 
                onClick={() => setSortOption('likes')}
                className={`px-3 py-1.5 rounded-md transition-colors ${sortOption === 'likes' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-50'}`}
            >
                Likes
            </button>
            <button 
                onClick={() => setSortOption('views')}
                className={`px-3 py-1.5 rounded-md transition-colors ${sortOption === 'views' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-50'}`}
            >
                Views
            </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sortedItems.map((item) => {
          const isLiked = currentUser ? item.likedBy.includes(currentUser.id) : false;
          
          return (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 group flex flex-col h-full">
              {/* Image Area */}
              <div 
                className="relative aspect-square bg-gray-100 overflow-hidden cursor-pointer"
                onClick={() => onItemClick(item)}
              >
                  {item.imageUrls.length > 1 ? (
                      <div className="grid grid-cols-2 h-full w-full gap-0.5">
                          {item.imageUrls.slice(0,4).map((url, idx) => (
                              <img key={idx} src={url} alt="" className="w-full h-full object-cover" />
                          ))}
                      </div>
                  ) : (
                      <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold shadow-sm flex items-center gap-1 z-10">
                      <Heart size={12} className={item.likedBy.length > 0 ? "text-red-500 fill-red-500" : "text-gray-400"} />
                      {item.likedBy.length}
                  </div>
              </div>

              {/* Content Area */}
              <div className="p-4 flex-1 flex flex-col">
                <p 
                    className="text-sm text-gray-800 font-medium line-clamp-2 mb-3 cursor-pointer hover:text-purple-600"
                    onClick={() => onItemClick(item)}
                >
                  {item.prompt}
                </p>
                
                <div className="mt-auto flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-3">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onLike(item.id);
                        }}
                        className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
                    >
                      <Heart size={14} className={isLiked ? "fill-current" : ""} /> {item.likedBy.length}
                    </button>
                    <span className="flex items-center gap-1">
                      <Eye size={14} /> {item.views}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 bg-purple-100 rounded-full flex items-center justify-center text-[8px] text-purple-600 font-bold">
                        {item.authorName.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[80px] truncate">{item.authorName}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {sortedItems.length === 0 && (
          <div className="text-center py-20 text-gray-500">
              No artworks found. Be the first to create something amazing!
          </div>
      )}
    </div>
  );
};

export default Gallery;
