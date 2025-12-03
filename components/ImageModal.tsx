import React, { useState } from 'react';
import { X, Copy, Wand2, Heart, Download, Eye, Globe, Lock, Trash2, UploadCloud, XCircle, Check } from 'lucide-react';
import { GalleryItem, User } from '../types';

interface ImageModalProps {
  item: GalleryItem;
  isOpen: boolean;
  onClose: () => void;
  onRemix: (item: GalleryItem) => void;
  currentUser: User | null;
  onLike: (itemId: string) => void;
  onTogglePublish?: (item: GalleryItem) => void;
  onDelete?: (item: GalleryItem) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ 
  item, 
  isOpen, 
  onClose, 
  onRemix, 
  currentUser, 
  onLike, 
  onTogglePublish,
  onDelete,
  showToast 
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const isLiked = currentUser ? item.likedBy.includes(currentUser.id) : false;
  const isAuthor = currentUser && currentUser.id === item.authorId;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(item.prompt);
    showToast("Prompt copied to clipboard!");
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!showDeleteConfirm) {
        setShowDeleteConfirm(true);
        return;
    }

    if (onDelete) {
        onDelete(item);
        onClose();
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowDeleteConfirm(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white rounded-2xl overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Image Section */}
        <div className="w-full md:w-3/5 bg-gray-100 flex items-center justify-center p-4 relative group">
           <img 
             src={item.imageUrls[0]} 
             alt="Detail" 
             className="max-w-full max-h-[80vh] object-contain shadow-lg"
           />
           {isAuthor && (
               <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1">
                   {item.isPublic ? <><Globe size={12}/> Public Gallery</> : <><Lock size={12}/> Private History</>}
               </div>
           )}
        </div>

        {/* Details Section */}
        <div className="w-full md:w-2/5 p-6 flex flex-col overflow-y-auto">
           {/* Author Info */}
           <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold overflow-hidden">
                  {/* Need to fetch avatar if possible or just initial */}
                  {item.authorName.charAt(0).toUpperCase()}
              </div>
              <div>
                  <h3 className="font-bold text-gray-900">{item.title || "Untitled Creation"}</h3>
                  <p className="text-sm text-gray-500">by {item.authorName} • {item.date}</p>
              </div>
           </div>

           {/* Stats */}
           <div className="flex gap-4 mb-6 text-sm text-gray-500">
               <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                   <Heart size={16} className={item.likedBy.length > 0 ? "text-red-500 fill-red-500" : ""} />
                   <span>{item.likedBy.length} Likes</span>
               </div>
               <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                   <Eye size={16} />
                   <span>{item.views} Views</span>
               </div>
           </div>

           {/* Prompt */}
           <div className="mb-6 flex-1">
               <div className="flex justify-between items-center mb-2">
                   <h4 className="font-semibold text-gray-700">Prompt</h4>
                   <button 
                     onClick={handleCopyPrompt}
                     className="text-xs flex items-center gap-1 text-gray-500 hover:text-purple-600 transition-colors"
                   >
                       <Copy size={12} /> Copy
                   </button>
               </div>
               <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm text-gray-700 max-h-40 overflow-y-auto">
                   {item.prompt}
               </div>
           </div>
            
           {/* Parameters */}
           <div className="mb-6 space-y-2 text-xs text-gray-500">
               <div className="flex justify-between border-b border-gray-100 pb-2">
                   <span>Model</span>
                   <span className="font-medium text-gray-800">Nano Banana</span>
               </div>
               <div className="flex justify-between border-b border-gray-100 pb-2">
                   <span>Created</span>
                   <span className="font-medium text-gray-800">{item.date}</span>
               </div>
           </div>

           {/* Author Controls */}
           {isAuthor && onTogglePublish && onDelete && (
               <div className="mb-4 grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                   <button 
                        onClick={() => onTogglePublish(item)}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors
                        ${item.isPublic 
                            ? 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100' 
                            : 'bg-green-600 text-white hover:bg-green-700'}`}
                   >
                        {item.isPublic ? <><XCircle size={14}/> Unpublish</> : <><UploadCloud size={14}/> Publish to Gallery</>}
                   </button>
                   
                   {!showDeleteConfirm ? (
                       <button 
                            onClick={handleDeleteClick}
                            className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors"
                       >
                            <Trash2 size={14} /> Delete
                       </button>
                   ) : (
                       <div className="flex gap-2">
                            <button 
                                onClick={handleDeleteClick}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                                <Check size={14} /> Confirm
                            </button>
                            <button 
                                onClick={handleCancelDelete}
                                className="flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                                <X size={14} />
                            </button>
                       </div>
                   )}
               </div>
           )}

           {/* Public Actions */}
           <div className="flex flex-col gap-3 mt-auto">
              <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => onLike(item.id)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-colors
                        ${isLiked 
                            ? 'bg-red-50 text-red-500 border border-red-100' 
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                  >
                      <Heart size={18} className={isLiked ? "fill-current" : ""} />
                      {isLiked ? 'Liked' : 'Like'}
                  </button>
                  <a 
                    href={item.imageUrls[0]} 
                    download={`nano-banana-${item.id}.png`}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                      <Download size={18} />
                      Download
                  </a>
              </div>
              
              <button 
                onClick={() => onRemix(item)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                  <Wand2 size={18} />
                  Remix this creation
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;