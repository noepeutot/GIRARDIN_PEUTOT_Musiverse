// Données simulées pour les likes et commentaires
// Ces données sont générées de manière déterministe basée sur l'ID de la track

import { SAMPLE_USERNAMES, SAMPLE_COMMENTS } from './sampleData'; 
import { getArtistImageByIndex } from './artistsCache';

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

// Générer un nombre de likes basé sur l'ID de la track
export const getTrackLikes = (trackId: string): number => {
  const hash = hashString(trackId);
  // Génère un nombre entre 500 et 50000
  return 500 + (hash % 49500);
};

// Formater le nombre de likes
export const formatLikes = (count: number): string => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
};

// Interface pour un commentaire
export interface TrackComment {
  id: string;
  username: string;
  userImage: string;
  text: string;
  timestamp: number; // en minutes (il y a X minutes)
  likes: number;
  isUserComment?: boolean;
}

// Générer des commentaires basés sur l'ID de la track
export const getTrackComments = (trackId: string): TrackComment[] => {
  const hash = hashString(trackId);
  const numComments = 8 + (hash % 20); // Entre 8 et 27 commentaires
  
  const comments: TrackComment[] = [];
  
  for (let i = 0; i < numComments; i++) {
    const commentHash = hashString(trackId + i.toString());
    const usernameIndex = commentHash % SAMPLE_USERNAMES.length;
    const commentIndex = (commentHash * 7) % SAMPLE_COMMENTS.length;
    
    // Utiliser une photo d'artiste Jamendo
    const userImage = getArtistImageByIndex(commentHash);
    
    comments.push({
      id: `${trackId}-comment-${i}`,
      username: SAMPLE_USERNAMES[usernameIndex],
      userImage,
      text: SAMPLE_COMMENTS[commentIndex],
      timestamp: 1 + (commentHash % 10080), // Entre 1 min et 7 jours
      likes: commentHash % 5000, // Jusqu'à 5000 likes
    });
  }
  
  // Ajouter les commentaires utilisateur sauvegardés
  const userComments = getUserComments(trackId);
  
  // Combiner et trier par likes (les plus likés en premier)
  const allComments = [...userComments, ...comments];
  return allComments.sort((a, b) => {
    // Les commentaires utilisateur récents en premier
    if (a.isUserComment && !b.isUserComment) return -1;
    if (!a.isUserComment && b.isUserComment) return 1;
    return b.likes - a.likes;
  });
};

// Formater le timestamp
export const formatTimestamp = (minutes: number): string => {
  if (minutes === 0) return "à l'instant";
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}j`;
  }
  const weeks = Math.floor(days / 7);
  return `${weeks}sem`;
};

// Clé localStorage pour les commentaires utilisateur
const USER_COMMENTS_KEY = 'musiverse_user_comments';
const COMMENT_LIKES_KEY = 'musiverse_comment_likes';

// Récupérer les commentaires utilisateur pour une track
export const getUserComments = (trackId: string): TrackComment[] => {
  try {
    const saved = localStorage.getItem(USER_COMMENTS_KEY);
    if (!saved) return [];
    
    const allComments: Record<string, TrackComment[]> = JSON.parse(saved);
    return allComments[trackId] || [];
  } catch {
    return [];
  }
};

// Ajouter un commentaire utilisateur
export const addUserComment = (trackId: string, text: string, username: string, userImage: string): TrackComment => {
  const newComment: TrackComment = {
    id: `user-${trackId}-${Date.now()}`,
    username: username,
    userImage: userImage,
    text: text.trim(),
    timestamp: 0, // 0 = à l'instant
    likes: 0,
    isUserComment: true,
  };
  
  try {
    const saved = localStorage.getItem(USER_COMMENTS_KEY);
    const allComments: Record<string, TrackComment[]> = saved ? JSON.parse(saved) : {};
    
    if (!allComments[trackId]) {
      allComments[trackId] = [];
    }
    
    allComments[trackId].unshift(newComment);
    localStorage.setItem(USER_COMMENTS_KEY, JSON.stringify(allComments));
  } catch (error) {
    console.error('Erreur sauvegarde commentaire:', error);
  }
  
  return newComment;
};

// Supprimer un commentaire utilisateur
export const deleteUserComment = (trackId: string, commentId: string): void => {
  try {
    const saved = localStorage.getItem(USER_COMMENTS_KEY);
    if (!saved) return;
    
    const allComments: Record<string, TrackComment[]> = JSON.parse(saved);
    if (!allComments[trackId]) return;
    
    allComments[trackId] = allComments[trackId].filter(c => c.id !== commentId);
    localStorage.setItem(USER_COMMENTS_KEY, JSON.stringify(allComments));
  } catch (error) {
    console.error('Erreur suppression commentaire:', error);
  }
};

// Gérer les likes de commentaires
export const getCommentLikes = (): Set<string> => {
  try {
    const saved = localStorage.getItem(COMMENT_LIKES_KEY);
    if (!saved) return new Set();
    return new Set(JSON.parse(saved));
  } catch {
    return new Set();
  }
};

export const toggleCommentLike = (commentId: string): boolean => {
  try {
    const likes = getCommentLikes();
    const isLiked = likes.has(commentId);
    
    if (isLiked) {
      likes.delete(commentId);
    } else {
      likes.add(commentId);
    }
    
    localStorage.setItem(COMMENT_LIKES_KEY, JSON.stringify([...likes]));
    return !isLiked; // Retourne le nouvel état
  } catch {
    return false;
  }
};

export const isCommentLiked = (commentId: string): boolean => {
  return getCommentLikes().has(commentId);
};

