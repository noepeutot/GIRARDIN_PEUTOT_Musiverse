import React, { useState } from 'react';
import Image from 'next/image';
import { X, Send } from 'lucide-react';
import { Comment, useSocial } from '@/lib/socialContext';
import { useAuth } from '@/lib/authContext';
import { RelativeTimeDisplay } from './relativeTimeDisplay';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postUsername: string;
}

export const CommentsModal = ({ isOpen, onClose, postId, postUsername }: CommentsModalProps) => {
  const { getComments, addComment } = useSocial();
  const { user, isAuthenticated } = useAuth();
  const [newComment, setNewComment] = useState('');

  const comments = getComments(postId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated || !user) return;

    addComment(
      postId,
      newComment.trim(),
      user.displayName,
      user.image
    );
    setNewComment('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg max-h-[80vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-bold text-lg text-gray-900">Commentaires</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Post info */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-600">
            Post de <span className="font-semibold text-gray-900">{postUsername}</span>
          </p>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-gray-500">Aucun commentaire pour le moment</p>
              <p className="text-sm text-gray-400 mt-1">Sois le premier à commenter !</p>
            </div>
          ) : (
            comments.map((comment: Comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={comment.userImage}
                    alt={comment.username}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">{comment.username}</span>
                    <span className="text-xs text-gray-400">
                      <RelativeTimeDisplay datePosted={comment.createdAt} />
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-gray-200 px-4 py-3">
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
                className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-(--brown)/50 text-gray-900 placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="p-2 text-(--brown) disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-100 rounded-full transition-colors"
              >
                <Send size={20} />
              </button>
            </form>
          ) : (
            <p className="text-center text-sm text-gray-500 py-2">
              Connecte-toi pour commenter
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
