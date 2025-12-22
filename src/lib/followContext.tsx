'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { SAMPLE_USERNAMES } from './sampleData';

export interface FollowedUser {
  id: string;
  name: string;
  image?: string;
  isArtist?: boolean;
}

interface FollowContextType {
  // Abonnements (personnes que l'utilisateur suit)
  following: FollowedUser[];
  // Abonnés (personnes qui suivent l'utilisateur) - simulés
  followers: FollowedUser[];
  
  // Actions
  followUser: (user: FollowedUser) => void;
  unfollowUser: (userId: string) => void;
  isFollowing: (userId: string) => boolean;
  
  // Compteurs
  followingCount: number;
  followersCount: number;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

const STORAGE_KEY = 'musiverse_following';

// Générer des abonnés simulés de manière déterministe
function generateSimulatedFollowers(): FollowedUser[] {
  // Sélectionner 80-150 utilisateurs aléatoires comme "followers"
  const numFollowers = 80 + Math.floor(Math.random() * 70);
  const shuffled = [...SAMPLE_USERNAMES].sort(() => 0.5 - Math.random());
  
  return shuffled.slice(0, numFollowers).map((name, index) => ({
    id: `follower_${index}`,
    name,
    image: undefined,
    isArtist: false,
  }));
}

export function FollowProvider({ children }: { children: ReactNode }) {
  const [following, setFollowing] = useState<FollowedUser[]>([]);
  const [followers, setFollowers] = useState<FollowedUser[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger depuis localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFollowing(JSON.parse(stored));
      }
      // Générer les followers simulés une seule fois
      setFollowers(generateSimulatedFollowers());
    } catch (error) {
      console.error('Erreur lors du chargement des abonnements:', error);
    }
    setIsLoaded(true);
  }, []);

  // Sauvegarder dans localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(following));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des abonnements:', error);
      }
    }
  }, [following, isLoaded]);

  const followUser = useCallback((user: FollowedUser) => {
    setFollowing(prev => {
      if (prev.some(u => u.id === user.id)) return prev;
      return [...prev, user];
    });
  }, []);

  const unfollowUser = useCallback((userId: string) => {
    setFollowing(prev => prev.filter(u => u.id !== userId));
  }, []);

  const isFollowing = useCallback((userId: string) => {
    return following.some(u => u.id === userId);
  }, [following]);

  const value: FollowContextType = {
    following,
    followers,
    followUser,
    unfollowUser,
    isFollowing,
    followingCount: following.length,
    followersCount: followers.length,
  };

  return (
    <FollowContext.Provider value={value}>
      {children}
    </FollowContext.Provider>
  );
}

export function useFollow() {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error('useFollow must be used within a FollowProvider');
  }
  return context;
}
