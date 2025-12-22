'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { SAMPLE_USERNAMES, SAMPLE_COMMENTS } from './sampleData';
import { getArtistImageByIndex } from './artistsCache';

// Types
export interface Comment {
  id: string;
  postId: string;
  username: string;
  userImage: string;
  content: string;
  createdAt: Date;
  likes: number;
}

interface SocialContextType {
  likedPosts: Set<string>;
  comments: Map<string, Comment[]>;
  likedComments: Set<string>;
  isPostLiked: (postId: string) => boolean;
  toggleLike: (postId: string) => void;
  getComments: (postId: string) => Comment[];
  addComment: (postId: string, content: string, username: string, userImage: string) => void;
  isCommentLiked: (commentId: string) => boolean;
  toggleCommentLike: (commentId: string) => void;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

const LIKES_STORAGE_KEY = 'musiverse_liked_posts';
const COMMENTS_STORAGE_KEY = 'musiverse_comments';
const COMMENT_LIKES_STORAGE_KEY = 'musiverse_liked_comments';

// Générer un hash simple à partir d'un string
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

// Générer un nombre de likes basé sur le postId
export const getPostLikes = (postId: string): number => {
  const hash = hashString(postId);
  // Génère un nombre entre 500 et 50000
  return 500 + (hash % 49500);
};

// Générer un nombre de vues basé sur le postId
export const getPostViews = (postId: string): number => {
  const hash = hashString(postId + '_views');
  // Génère un nombre entre 5000 et 500000
  return 5000 + (hash % 495000);
};

// Générer des commentaires aléatoires simples (appelé côté client uniquement)
const generateRandomComments = (postId: string): Comment[] => {
  const numComments = 10 + Math.floor(Math.random() * 40); // Entre 10 et 50 commentaires
  const comments: Comment[] = [];
  
  for (let i = 0; i < numComments; i++) {
    const randomUsername = SAMPLE_USERNAMES[Math.floor(Math.random() * SAMPLE_USERNAMES.length)];
    const randomContent = SAMPLE_COMMENTS[Math.floor(Math.random() * SAMPLE_COMMENTS.length)];
    const hoursAgo = 1 + Math.floor(Math.random() * 48); // Entre 1h et 48h
    
    // Utiliser une photo d'artiste Jamendo
    const userImage = getArtistImageByIndex(i + hashString(postId));
    
    comments.push({
      id: `${postId}-comment-${i}-${Date.now()}`,
      postId: postId,
      username: randomUsername,
      userImage,
      content: randomContent,
      createdAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
      likes: Math.floor(Math.random() * 100),
    });
  }
  
  // Trier par date (plus récent en premier)
  return comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};


interface SocialProviderProps {
  children: ReactNode;
}

export function SocialProvider({ children }: SocialProviderProps) {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Map<string, Comment[]>>(new Map());
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
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
            likes: c.likes || 0,
          })));
        });
        setComments(commentsMap);
      }

      const storedCommentLikes = localStorage.getItem(COMMENT_LIKES_STORAGE_KEY);
      if (storedCommentLikes) {
        setLikedComments(new Set(JSON.parse(storedCommentLikes)));
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

  // Sauvegarder les likes de commentaires
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(COMMENT_LIKES_STORAGE_KEY, JSON.stringify([...likedComments]));
    }
  }, [likedComments, isLoaded]);

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
    // Ajouter des commentaires simulés si aucun commentaire utilisateur
    if (postComments.length === 0) {
      return generateRandomComments(postId);
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
      likes: 0,
    };

    setComments(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(postId) || generateRandomComments(postId);
      newMap.set(postId, [newComment, ...existing]);
      return newMap;
    });
  }, []);

  const isCommentLiked = useCallback((commentId: string): boolean => {
    return likedComments.has(commentId);
  }, [likedComments]);

  const toggleCommentLike = useCallback((commentId: string) => {
    setLikedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  }, []);

  const value: SocialContextType = {
    likedPosts,
    comments,
    likedComments,
    isPostLiked,
    toggleLike,
    getComments,
    addComment,
    isCommentLiked,
    toggleCommentLike,
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
