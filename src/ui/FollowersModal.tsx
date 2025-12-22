'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, UserMinus } from 'lucide-react';
import { FollowedUser, useFollow } from '@/lib/followContext';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'followers' | 'following';
  title: string;
}

export function FollowersModal({ isOpen, onClose, mode, title }: FollowersModalProps) {
  const { followers, following, unfollowUser, isFollowing, followUser } = useFollow();
  const modalRef = useRef<HTMLDivElement>(null);
  const [localList, setLocalList] = useState<FollowedUser[]>([]);

  // Mettre à jour la liste locale quand le modal s'ouvre ou les données changent
  useEffect(() => {
    if (mode === 'followers') {
      setLocalList(followers);
    } else {
      setLocalList(following);
    }
  }, [mode, followers, following, isOpen]);

  // Fermer au clic à l'extérieur
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Bloquer le scroll du body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUnfollow = (userId: string) => {
    unfollowUser(userId);
    if (mode === 'following') {
      setLocalList(prev => prev.filter(u => u.id !== userId));
    }
  };

  const handleFollow = (user: FollowedUser) => {
    followUser(user);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[80vh] z-50 bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-bold text-lg">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        {/* Liste */}
        <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
          {localList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <p>{mode === 'followers' ? 'Aucun abonné' : 'Aucun abonnement'}</p>
            </div>
          ) : (
            localList.map((user) => {
              const isUserFollowed = isFollowing(user.id);
              
              return (
                <div 
                  key={user.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  {/* Info utilisateur */}
                  <Link 
                    href={user.isArtist ? `/profile/${user.id}` : '#'}
                    className="flex items-center gap-3 flex-1 min-w-0"
                    onClick={(e) => {
                      if (!user.isArtist) e.preventDefault();
                      else onClose();
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-gray-500 font-medium text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="font-medium truncate">{user.name}</span>
                  </Link>
                  
                  {/* Bouton action */}
                  {mode === 'following' ? (
                    <button
                      onClick={() => handleUnfollow(user.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <UserMinus size={16} />
                      Retirer
                    </button>
                  ) : (
                    <button
                      onClick={() => isUserFollowed ? handleUnfollow(user.id) : handleFollow(user)}
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                        isUserFollowed 
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                          : 'bg-(--brown) text-(--text-color) hover:opacity-80'
                      }`}
                    >
                      {isUserFollowed ? 'Suivi' : 'Suivre'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
