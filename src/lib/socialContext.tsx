'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Types
export interface Comment {
  id: string;
  postId: string;
  username: string;
  userImage: string;
  content: string;
  createdAt: Date;
}

interface SocialContextType {
  likedPosts: Set<string>;
  comments: Map<string, Comment[]>;
  isPostLiked: (postId: string) => boolean;
  toggleLike: (postId: string) => void;
  getComments: (postId: string) => Comment[];
  addComment: (postId: string, content: string, username: string, userImage: string) => void;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

const LIKES_STORAGE_KEY = 'musiverse_liked_posts';
const COMMENTS_STORAGE_KEY = 'musiverse_comments';

// Commentaires simulés par défaut
const defaultComments: Comment[] = [
  {
    id: 'comment_1',
    postId: 'default',
    username: 'MusicLover',
    userImage: '/photoProfil.png',
    content: 'Super post ! 🔥',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'comment_2',
    postId: 'default',
    username: 'JazzFan',
    userImage: '/photoProfil.png',
    content: 'J\'adore cette musique !',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: 'comment_3',
    postId: 'default',
    username: 'BeatMaker',
    userImage: '/photoProfil.png',
    content: 'Incroyable, continue comme ça 👏',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

interface SocialProviderProps {
  children: ReactNode;
}

export function SocialProvider({ children }: SocialProviderProps) {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Map<string, Comment[]>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger depuis localStorage au démarrage
  useEffect(() => {
    try {
      const storedLikes = localStorage.getItem(LIKES_STORAGE_KEY);
      if (storedLikes) {
        setLikedPosts(new Set(JSON.parse(storedLikes)));
      }

      const storedComments = localStorage.getItem(COMMENTS_STORAGE_KEY);
      if (storedComments) {
        const parsed = JSON.parse(storedComments);
        const commentsMap = new Map<string, Comment[]>();
        Object.entries(parsed).forEach(([postId, postComments]) => {
          commentsMap.set(postId, (postComments as Comment[]).map(c => ({
            ...c,
            createdAt: new Date(c.createdAt),
          })));
        });
        setComments(commentsMap);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données sociales:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sauvegarder les likes dans localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify([...likedPosts]));
    }
  }, [likedPosts, isLoaded]);

  // Sauvegarder les commentaires dans localStorage
  useEffect(() => {
    if (isLoaded) {
      const commentsObj: Record<string, Comment[]> = {};
      comments.forEach((postComments, postId) => {
        commentsObj[postId] = postComments;
      });
      localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(commentsObj));
    }
  }, [comments, isLoaded]);

  const isPostLiked = useCallback((postId: string): boolean => {
    return likedPosts.has(postId);
  }, [likedPosts]);

  const toggleLike = useCallback((postId: string) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  }, []);

  const getComments = useCallback((postId: string): Comment[] => {
    const postComments = comments.get(postId) || [];
    // Ajouter des commentaires simulés si aucun commentaire
    if (postComments.length === 0) {
      return defaultComments.map(c => ({ ...c, postId }));
    }
    return postComments;
  }, [comments]);

  const addComment = useCallback((postId: string, content: string, username: string, userImage: string) => {
    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      postId,
      username,
      userImage,
      content,
      createdAt: new Date(),
    };

    setComments(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(postId) || defaultComments.map(c => ({ ...c, postId }));
      newMap.set(postId, [newComment, ...existing]);
      return newMap;
    });
  }, []);

  const value: SocialContextType = {
    likedPosts,
    comments,
    isPostLiked,
    toggleLike,
    getComments,
    addComment,
  };

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial(): SocialContextType {
  const context = useContext(SocialContext);
  if (context === undefined) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
}
