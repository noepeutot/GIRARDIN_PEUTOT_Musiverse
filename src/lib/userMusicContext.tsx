'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { JamendoTrack } from './types';
import { useAuth } from './authContext';

// Structure d'un son utilisateur
export interface UserTrack extends Omit<JamendoTrack, 'license_ccurl' | 'position' | 'releasedate' | 'audiodownload' | 'prourl' | 'shorturl' | 'shareurl'> {
  createdAt: number;
  uploadedBy: string;
  isUserTrack: true;
}

interface UserMusicContextType {
  userTracks: UserTrack[];
  addUserTrack: (track: Omit<UserTrack, 'id' | 'createdAt' | 'uploadedBy' | 'isUserTrack'>) => UserTrack;
  removeUserTrack: (trackId: string) => void;
  getUserTracksByUserId: (userId: string) => UserTrack[];
}

const UserMusicContext = createContext<UserMusicContextType | undefined>(undefined);

export function UserMusicProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userTracks, setUserTracks] = useState<UserTrack[]>([]);

  const addUserTrack = (trackData: Omit<UserTrack, 'id' | 'createdAt' | 'uploadedBy' | 'isUserTrack'>): UserTrack => {
    const newTrack: UserTrack = {
      ...trackData,
      id: `user_track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      uploadedBy: user?.id || 'anonymous',
      isUserTrack: true,
    };
    
    setUserTracks(prev => [newTrack, ...prev]);
    
    return newTrack;
  };

  const removeUserTrack = (trackId: string) => {
    setUserTracks(prev => prev.filter(t => t.id !== trackId));
  };

  const getUserTracksByUserId = (userId: string): UserTrack[] => {
    return userTracks.filter(t => t.uploadedBy === userId);
  };

  return (
    <UserMusicContext.Provider value={{
      userTracks,
      addUserTrack,
      removeUserTrack,
      getUserTracksByUserId,
    }}>
      {children}
    </UserMusicContext.Provider>
  );
}

export function useUserMusic() {
  const context = useContext(UserMusicContext);
  if (!context) {
    throw new Error('useUserMusic must be used within UserMusicProvider');
  }
  return context;
}
