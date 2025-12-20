import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Send, Trash2 } from 'lucide-react';
import { TrackComment, getTrackComments, formatTimestamp, addUserComment, deleteUserComment } from '@/lib/socialData';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  trackName: string;
}

export const CommentsModal = ({ isOpen, onClose, trackId, trackName }: CommentsModalProps) => {
  const [comments, setComments] = useState<TrackComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  
  // Ref pour le long press
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && trackId) {
      setComments(getTrackComments(trackId));
    }
  }, [isOpen, trackId]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleLikeComment = (commentId: string) => {
    setLikedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    // Ajouter le commentaire dans localStorage
    const newCommentObj = addUserComment(trackId, newComment);
    
    // Mettre à jour l'affichage
    setComments(prev => [newCommentObj, ...prev]);
    setNewComment('');
  };

  // Long press handlers
  const handleTouchStart = (commentId: string) => {
    // Seulement pour les commentaires utilisateur (commencent par "user-")
    if (!commentId.startsWith('user-')) return;
    
    longPressTimer.current = setTimeout(() => {
      setCommentToDelete(commentId);
    }, 500); // 500ms pour le long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDeleteComment = () => {
    if (!commentToDelete) return;
    
    // Supprimer du localStorage
    deleteUserComment(trackId, commentToDelete);
    
    // Mettre à jour l'affichage
    setComments(prev => prev.filter(c => c.id !== commentToDelete));
    setCommentToDelete(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-[300] bg-black/50 flex items-end justify-center"
        onClick={handleBackdropClick}
      >
        <div 
          className="bg-[#1a1610] rounded-t-3xl w-full max-h-[70vh] flex flex-col animate-slide-up"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-(--text-color)">{comments.length} commentaires</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Titre de la track */}
          <div className="px-4 py-2 border-b border-white/5">
            <p className="text-sm text-gray-400 truncate">Sur : {trackName}</p>
          </div>

          {/* Liste des commentaires */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.map((comment) => {
              const isLiked = likedComments.has(comment.id);
              const displayLikes = isLiked ? comment.likes + 1 : comment.likes;
              const isUserComment = comment.id.startsWith('user-');
              
              return (
                <div 
                  key={comment.id} 
                  className={`flex gap-3 ${isUserComment ? 'cursor-pointer select-none' : ''}`}
                  onTouchStart={() => handleTouchStart(comment.id)}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={() => handleTouchStart(comment.id)}
                  onMouseUp={handleTouchEnd}
                  onMouseLeave={handleTouchEnd}
                >
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                    isUserComment 
                      ? 'bg-(--yellow) text-(--background-brown)' 
                      : 'bg-gradient-to-br from-purple-500 to-pink-500'
                  }`}>
                    {comment.username.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${isUserComment ? 'text-(--yellow)' : 'text-(--text-color)'}`}>
                        {comment.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {comment.timestamp === 0 ? "À l'instant" : formatTimestamp(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{comment.text}</p>
                  </div>
                  
                  {/* Like */}
                  <button 
                    onClick={() => handleLikeComment(comment.id)}
                    className="flex flex-col items-center gap-1 flex-shrink-0"
                  >
                    <Heart 
                      size={16} 
                      className={isLiked ? 'text-red-500' : 'text-gray-500'} 
                      fill={isLiked ? 'currentColor' : 'none'}
                    />
                    <span className="text-xs text-gray-500">{displayLikes}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Input nouveau commentaire */}
          <div className="flex items-center gap-3 p-4 border-t border-white/10 bg-[#0d0b08]">
            <div className="w-8 h-8 rounded-full bg-(--yellow) flex items-center justify-center text-(--background-brown) text-sm font-bold flex-shrink-0">
              T
            </div>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
              placeholder="Ajouter un commentaire..."
              className="flex-1 bg-[#2a2518] text-(--text-color) placeholder-gray-500 px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-(--yellow)"
            />
            <button 
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              className="p-2.5 bg-(--yellow) rounded-full text-(--background-brown) hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes slideUp {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
          .animate-slide-up {
            animation: slideUp 0.3s ease-out;
          }
        `}</style>
      </div>

      {/* Modal de confirmation de suppression */}
      {commentToDelete && (
        <div 
          className="fixed inset-0 z-[400] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setCommentToDelete(null)}
        >
          <div 
            className="bg-[#1a1610] rounded-2xl w-full max-w-xs p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-(--text-color)">Supprimer ?</h3>
                <p className="text-sm text-gray-400">Cette action est irréversible</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setCommentToDelete(null)}
                className="flex-1 py-2.5 rounded-full border border-gray-600 text-(--text-color) hover:bg-white/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteComment}
                className="flex-1 py-2.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
