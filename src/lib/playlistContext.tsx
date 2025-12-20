import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { JamendoTrack } from '@/lib/types';

// Types
export interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: JamendoTrack[];
  createdAt: number;
  coverImage?: string;
  isPublic?: boolean;
}

interface PlaylistContextType {
  playlists: Playlist[];
  favoritesPlaylist: Playlist | undefined;
  createPlaylist: (name: string, description?: string, isPublic?: boolean) => Playlist;
  deletePlaylist: (id: string) => void;
  updatePlaylist: (id: string, updates: Partial<Omit<Playlist, 'id' | 'createdAt'>>) => void;
  addTrackToPlaylist: (playlistId: string, track: JamendoTrack) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  getPlaylist: (id: string) => Playlist | undefined;
  isTrackInPlaylist: (playlistId: string, trackId: string) => boolean;
  isTrackInAnyPlaylist: (trackId: string) => boolean;
  toggleFavorite: (track: JamendoTrack) => void;
  isTrackFavorite: (trackId: string) => boolean;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

// Clé localStorage
const PLAYLISTS_STORAGE_KEY = 'musiverse_playlists';

// ID spécial pour la playlist favoris
export const FAVORITES_PLAYLIST_ID = 'favorites_liked_songs';

export function usePlaylist() {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
}

interface PlaylistProviderProps {
  children: ReactNode;
}

// Générer un ID unique
const generateId = () => {
  return `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export function PlaylistProvider({ children }: PlaylistProviderProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger les playlists depuis localStorage au démarrage
  useEffect(() => {
    try {
      const savedPlaylists = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
      let loadedPlaylists: Playlist[] = savedPlaylists ? JSON.parse(savedPlaylists) : [];
      
      // S'assurer que la playlist favoris existe toujours
      const hasFavorites = loadedPlaylists.some(p => p.id === FAVORITES_PLAYLIST_ID);
      if (!hasFavorites) {
        const favoritesPlaylist: Playlist = {
          id: FAVORITES_PLAYLIST_ID,
          name: 'Titres likés',
          description: 'Tes titres favoris',
          tracks: [],
          createdAt: 0, // Toujours en premier
        };
        loadedPlaylists = [favoritesPlaylist, ...loadedPlaylists];
      }
      
      setPlaylists(loadedPlaylists);
    } catch (error) {
      console.error('Erreur chargement playlists:', error);
    }
    setIsLoaded(true);
  }, []);

  // Sauvegarder les playlists dans localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
      } catch (error) {
        console.error('Erreur sauvegarde playlists:', error);
      }
    }
  }, [playlists, isLoaded]);

  // Créer une nouvelle playlist
  const createPlaylist = useCallback((name: string, description: string = '', isPublic: boolean = false): Playlist => {
    const newPlaylist: Playlist = {
      id: generateId(),
      name,
      description,
      tracks: [],
      createdAt: Date.now(),
      isPublic,
    };
    
    setPlaylists(prev => [...prev, newPlaylist]);
    return newPlaylist;
  }, []);

  // Supprimer une playlist (sauf favoris)
  const deletePlaylist = useCallback((id: string) => {
    if (id === FAVORITES_PLAYLIST_ID) return; // Ne pas supprimer les favoris
    setPlaylists(prev => prev.filter(p => p.id !== id));
  }, []);

  // Mettre à jour une playlist
  const updatePlaylist = useCallback((id: string, updates: Partial<Omit<Playlist, 'id' | 'createdAt'>>) => {
    setPlaylists(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ));
  }, []);

  // Ajouter une piste à une playlist
  const addTrackToPlaylist = useCallback((playlistId: string, track: JamendoTrack) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id !== playlistId) return p;
      
      // Éviter les doublons
      if (p.tracks.some(t => t.id === track.id)) return p;
      
      // Ajouter la piste et définir la cover si c'est la première
      const newTracks = [...p.tracks, track];
      const coverImage = p.coverImage || track.album_image || track.image;
      
      return { ...p, tracks: newTracks, coverImage };
    }));
  }, []);

  // Retirer une piste d'une playlist
  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id !== playlistId) return p;
      
      const newTracks = p.tracks.filter(t => t.id !== trackId);
      
      // Mettre à jour la cover si nécessaire
      const coverImage = newTracks.length > 0 
        ? (newTracks[0].album_image || newTracks[0].image)
        : undefined;
      
      return { ...p, tracks: newTracks, coverImage };
    }));
  }, []);

  // Récupérer une playlist par ID
  const getPlaylist = useCallback((id: string): Playlist | undefined => {
    return playlists.find(p => p.id === id);
  }, [playlists]);

  // Vérifier si une piste est dans une playlist
  const isTrackInPlaylist = useCallback((playlistId: string, trackId: string): boolean => {
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist ? playlist.tracks.some(t => t.id === trackId) : false;
  }, [playlists]);

  // Vérifier si une piste est dans n'importe quelle playlist (y compris favoris)
  const isTrackInAnyPlaylist = useCallback((trackId: string): boolean => {
    return playlists.some(p => p.tracks.some(t => t.id === trackId));
  }, [playlists]);

  // Toggle favoris
  const toggleFavorite = useCallback((track: JamendoTrack) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id !== FAVORITES_PLAYLIST_ID) return p;
      
      const isAlreadyFavorite = p.tracks.some(t => t.id === track.id);
      if (isAlreadyFavorite) {
        return { ...p, tracks: p.tracks.filter(t => t.id !== track.id) };
      } else {
        return { ...p, tracks: [track, ...p.tracks] };
      }
    }));
  }, []);

  // Vérifier si une piste est dans les favoris
  const isTrackFavorite = useCallback((trackId: string): boolean => {
    const favorites = playlists.find(p => p.id === FAVORITES_PLAYLIST_ID);
    return favorites ? favorites.tracks.some(t => t.id === trackId) : false;
  }, [playlists]);

  // Récupérer la playlist favoris
  const favoritesPlaylist = playlists.find(p => p.id === FAVORITES_PLAYLIST_ID);

  return (
    <PlaylistContext.Provider
      value={{
        playlists,
        favoritesPlaylist,
        createPlaylist,
        deletePlaylist,
        updatePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        getPlaylist,
        isTrackInPlaylist,
        isTrackInAnyPlaylist,
        toggleFavorite,
        isTrackFavorite,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
}
