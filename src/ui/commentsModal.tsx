import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Send, Heart } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { RelativeTimeDisplay } from './relativeTimeDisplay';

// Interface générique pour un commentaire
export interface BaseComment {
  id: string;
  username: string;
  userImage: string;
  content: string;
  createdAt: Date;
  likes?: number;
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comments: BaseComment[];
  onAddComment: (content: string, username: string, userImage: string) => void;
  onLikeComment?: (commentId: string) => void;
  isCommentLiked?: (commentId: string) => boolean;
  formatLikes?: (count: number) => string;
  variant?: 'light' | 'dark';
  backgroundColor?: string;
}

export const CommentsModal = ({ 
  isOpen, 
  onClose, 
  comments,
  onAddComment,
  onLikeComment,
  isCommentLiked,
  formatLikes,
  variant = 'dark',
  backgroundColor
}: CommentsModalProps) => {
  const { user, isAuthenticated } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [localLikedComments, setLocalLikedComments] = useState<Set<string>>(new Set());

  // Charger l'état des likes au montage
  useEffect(() => {
    if (isOpen && isCommentLiked) {
      const liked = new Set<string>();
      comments.forEach(c => {
        if (isCommentLiked(c.id)) {
          liked.add(c.id);
        }
      });
      setLocalLikedComments(liked);
    }
  }, [isOpen, comments, isCommentLiked]);

  // Animation d'ouverture/fermeture
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Petit délai pour s'assurer que le DOM est rendu avant l'animation
      const timer = setTimeout(() => setIsAnimating(true), 20);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated || !user) return;

    onAddComment(newComment.trim(), user.displayName, user.image);
    setNewComment('');
  };

  const handleLikeComment = (commentId: string) => {
    if (onLikeComment) {
      onLikeComment(commentId);
      setLocalLikedComments(prev => {
        const newSet = new Set(prev);
        if (newSet.has(commentId)) {
          newSet.delete(commentId);
        } else {
          newSet.add(commentId);
        }
        return newSet;
      });
    }
  };

  const getDisplayLikes = (comment: BaseComment) => {
    const baseLikes = comment.likes || 0;
    const isLiked = localLikedComments.has(comment.id);
    const total = isLiked ? baseLikes + 1 : baseLikes;
    return formatLikes ? formatLikes(total) : total.toString();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 transition-opacity duration-400 ease-out ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Bottom Sheet - Animation fluide style iOS */}
      <div 
        className={`relative w-full max-w-[var(--app-max-width)] h-[70vh] rounded-t-3xl flex flex-col shadow-2xl transition-transform duration-400 ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        } ${
          variant === 'light' ? 'bg-white' : ''
        }`}
        style={{ 
          transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
          ...(variant === 'dark' && backgroundColor ? { backgroundColor } : {})
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center py-3">
          <div className={`w-10 h-1 rounded-full ${
            variant === 'light' ? 'bg-gray-300' : 'bg-gray-600'
          }`} />
        </div>

        {/* Header */}
        <div className={`flex items-center justify-between px-4 pb-3 border-b ${
          variant === 'light' ? 'border-gray-200' : 'border-white/10'
        }`}>
          <div />
          <h2 className={`font-bold text-base ${
            variant === 'light' ? 'text-gray-900' : 'text-(--text-color)'
          }`}>{comments.length} commentaires</h2>
          <button 
            onClick={handleClose}
            className={`p-2 rounded-full transition-colors ${
              variant === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'
            }`}
          >
            <X size={20} className={variant === 'light' ? 'text-gray-900' : 'text-(--text-color)'} />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className={variant === 'light' ? 'text-gray-600' : 'text-gray-400'}>Aucun commentaire pour le moment</p>
              <p className={`text-sm mt-1 ${
                variant === 'light' ? 'text-gray-500' : 'text-gray-500'
              }`}>Sois le premier à commenter !</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isLiked = localLikedComments.has(comment.id);
              
              return (
                <div key={comment.id} className="flex gap-3">
                  {/* Avatar */}
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={comment.userImage || '/avatar1.png'}
                      alt={comment.username}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-sm ${
                        variant === 'light' ? 'text-gray-900' : 'text-(--text-color)'
                      }`}>{comment.username}</span>
                      <span className="text-xs text-gray-500">
                        <RelativeTimeDisplay datePosted={comment.createdAt} />
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${
                      variant === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>{comment.content}</p>
                  </div>

                  {/* Like button */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <button 
                      onClick={() => handleLikeComment(comment.id)}
                      className={`p-1 rounded-full transition-colors ${
                        variant === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'
                      }`}
                    >
                      <Heart 
                        size={14} 
                        className={isLiked ? 'text-red-500' : 'text-gray-500'}
                        fill={isLiked ? 'currentColor' : 'none'}
                      />
                    </button>
                    <span className={`text-xs ${isLiked ? 'text-red-400' : 'text-gray-500'}`}>
                      {getDisplayLikes(comment)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input area */}
        <div className={`border-t px-4 py-3 ${
          variant === 'light' ? 'border-gray-200 bg-white' : 'border-white/10'
        }`} style={{
          ...(variant === 'dark' && backgroundColor ? { backgroundColor } : {})
        }}>
          {isAuthenticated && user ? (
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={user.image}
                  alt={user.displayName}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                className={`flex-1 px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-(--yellow)/50 ${
                  variant === 'light' 
                    ? 'bg-gray-100 text-gray-900 placeholder-gray-500' 
                    : 'text-(--text-color) placeholder-gray-400'
                }`}
                style={{
                  ...(variant === 'dark' ? { backgroundColor: 'rgba(255, 255, 255, 0.1)' } : {})
                }}
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className={`p-2 text-(--yellow) disabled:text-gray-600 disabled:cursor-not-allowed rounded-full transition-colors ${
                  variant === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'
                }`}
              >
                <Send size={20} />
              </button>
            </form>
          ) : (
            <p className={`text-center text-sm py-2 ${
              variant === 'light' ? 'text-gray-600' : 'text-gray-500'
            }`}>
              Connecte-toi pour commenter
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
