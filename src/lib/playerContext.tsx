import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { JamendoTrack } from '@/lib/types';

// Types simplifiés
export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerContextType {
  // Track actuelle
  currentTrack: JamendoTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  
  // Tracklist
  tracklist: JamendoTrack[];
  currentIndex: number;
  
  // Historique
  history: JamendoTrack[];
  
  // Modes
  repeatMode: RepeatMode;
  isShuffled: boolean;
  
  // Actions de lecture
  playTrack: (track: JamendoTrack, playlistTracks?: JamendoTrack[], sourceId?: string) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  next: () => void;
  previous: () => void;
  
  // Shuffle et repeat
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  
  // Peut-on utiliser next/previous (désactivé en repeat one ou single track)
  canNavigate: boolean;
  
  // ID de la source en cours (playlist ID, album ID, etc.)
  currentSourceId: string | null;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}

interface PlayerProviderProps {
  children: ReactNode;
}

// Clé localStorage pour l'historique
const HISTORY_STORAGE_KEY = 'musiverse_history';
const MAX_HISTORY_SIZE = 50;

export function PlayerProvider({ children }: PlayerProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // États principaux
  const [currentTrack, setCurrentTrack] = useState<JamendoTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Tracklist : liste ordonnée des tracks à jouer
  const [tracklist, setTracklist] = useState<JamendoTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Ordre original (avant shuffle) et ordre shufflé
  const [originalOrder, setOriginalOrder] = useState<number[]>([]);
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);
  const [shufflePosition, setShufflePosition] = useState(0);
  
  // Historique
  const [history, setHistory] = useState<JamendoTrack[]>([]);
  
  // Modes
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffled, setIsShuffled] = useState(false);
  
  // ID de la source en cours (playlist, album, etc.)
  const [currentSourceId, setCurrentSourceId] = useState<string | null>(null);

  // Refs pour les event listeners
  const tracklistRef = useRef(tracklist);
  const currentIndexRef = useRef(currentIndex);
  const repeatModeRef = useRef(repeatMode);
  const isShuffledRef = useRef(isShuffled);
  const shuffledOrderRef = useRef(shuffledOrder);
  const shufflePositionRef = useRef(shufflePosition);

  // Sync refs
  useEffect(() => { tracklistRef.current = tracklist; }, [tracklist]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { isShuffledRef.current = isShuffled; }, [isShuffled]);
  useEffect(() => { shuffledOrderRef.current = shuffledOrder; }, [shuffledOrder]);
  useEffect(() => { shufflePositionRef.current = shufflePosition; }, [shufflePosition]);

  // Charger l'historique depuis localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        // Filtrer les tracks utilisateur (qui ne sont plus valides après reload)
        // Les tracks utilisateur ont un ID commençant par 'user_track_'
        const cleanHistory = parsed.filter((t: JamendoTrack) => !t.id.startsWith('user_track_'));
        setHistory(cleanHistory);
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  }, []);

  // Sauvegarder l'historique
  useEffect(() => {
    if (history.length > 0) {
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
      } catch (error) {
        console.error('Erreur sauvegarde historique:', error);
      }
    }
  }, [history]);

  // Ajouter à l'historique
  const addToHistory = useCallback((track: JamendoTrack) => {
    setHistory(prev => {
      if (prev.length > 0 && prev[0].id === track.id) return prev;
      const newHistory = [track, ...prev.filter(t => t.id !== track.id)];
      return newHistory.slice(0, MAX_HISTORY_SIZE);
    });
  }, []);

  // Fisher-Yates shuffle sur les indexes restants
  const shuffleRemaining = useCallback((fromIndex: number, totalLength: number): number[] => {
    const remaining: number[] = [];
    for (let i = fromIndex; i < totalLength; i++) {
      remaining.push(i);
    }
    // Fisher-Yates
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
    return remaining;
  }, []);

  // Fonction appelée quand une track se termine
  const goToNext = useCallback(() => {
    const list = tracklistRef.current;
    const idx = currentIndexRef.current;
    const repeat = repeatModeRef.current;
    const shuffled = isShuffledRef.current;
    const shuffleOrder = shuffledOrderRef.current;
    const shufflePos = shufflePositionRef.current;

    // Repeat One : rejouer la même
    if (repeat === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      return;
    }

    // Calculer le prochain index
    let nextIndex: number;
    
    if (shuffled && shuffleOrder.length > 0) {
      // Mode shuffle : suivre l'ordre shufflé
      const nextShufflePos = shufflePos + 1;
      if (nextShufflePos < shuffleOrder.length) {
        nextIndex = shuffleOrder[nextShufflePos];
        setShufflePosition(nextShufflePos);
      } else if (repeat === 'all') {
        // Fin du shuffle, re-shuffle et recommencer
        const newShuffled = shuffleRemaining(0, list.length);
        setShuffledOrder(newShuffled);
        setShufflePosition(0);
        nextIndex = newShuffled[0];
      } else {
        // Fin de lecture
        setIsPlaying(false);
        return;
      }
    } else {
      // Mode normal : index suivant
      nextIndex = idx + 1;
      if (nextIndex >= list.length) {
        if (repeat === 'all') {
          nextIndex = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }
    }

    setCurrentIndex(nextIndex);
    setIsPlaying(true);
  }, [shuffleRemaining]);

  // Initialiser l'audio element
  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('ended', goToNext);

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [goToNext]);

  // Gérer le changement de track (ne recharge que si la track change vraiment)
  useEffect(() => {
    if (tracklist.length > 0 && currentIndex < tracklist.length) {
      const track = tracklist[currentIndex];
      
      // Ne mettre à jour que si c'est une nouvelle track
      if (!currentTrack || currentTrack.id !== track.id) {
        setCurrentTrack(track);
        addToHistory(track);

        if (audioRef.current && isPlaying) {
          const audio = audioRef.current;
          audio.src = track.audio;
          audio.load();
          const playWhenReady = () => {
            audio.play().catch(() => {});
            audio.removeEventListener('canplay', playWhenReady);
          };
          audio.addEventListener('canplay', playWhenReady);
        }
      }
    }
  }, [currentIndex, tracklist, addToHistory, isPlaying, currentTrack]);

  // Jouer une track (avec ou sans playlist)
  const playTrack = useCallback((track: JamendoTrack, playlistTracks?: JamendoTrack[], sourceId?: string) => {
    if (!audioRef.current) return;

    // Stocker l'ID de la source (playlist, album, etc.)
    setCurrentSourceId(sourceId || null);

    let newTracklist: JamendoTrack[];
    let startIndex = 0;

    if (playlistTracks && playlistTracks.length > 0) {
      // Trouver l'index de la track dans la playlist
      const trackIndex = playlistTracks.findIndex(t => t.id === track.id);
      if (trackIndex >= 0) {
        // Garder TOUTE la playlist pour permettre next/previous/shuffle
        newTracklist = playlistTracks;
        startIndex = trackIndex;
      } else {
        // Track pas trouvée, jouer juste cette track
        newTracklist = [track];
      }
    } else {
      // Lecture single
      newTracklist = [track];
    }

    // Reset shuffle
    setIsShuffled(false);
    setShuffledOrder([]);
    setShufflePosition(0);
    setOriginalOrder(newTracklist.map((_, i) => i));

    // Mettre à jour la tracklist
    setTracklist(newTracklist);
    setCurrentIndex(startIndex);
    setCurrentTrack(track);
    addToHistory(track); // Mettre à jour l'historique immédiatement

    // Lancer la lecture
    const audio = audioRef.current;
    audio.src = track.audio;
    audio.load();
    const playWhenReady = () => {
      audio.play().catch(() => {});
      audio.removeEventListener('canplay', playWhenReady);
    };
    audio.addEventListener('canplay', playWhenReady);
    setIsPlaying(true);
  }, [addToHistory]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [currentTrack]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    if (tracklist.length <= 1) return; // Pas de shuffle pour une seule track

    if (!isShuffled) {
      // Activer shuffle : mélanger les tracks restantes
      const remaining = shuffleRemaining(currentIndex + 1, tracklist.length);
      setShuffledOrder(remaining);
      setShufflePosition(0);
      setIsShuffled(true);
    } else {
      // Désactiver shuffle
      setShuffledOrder([]);
      setShufflePosition(0);
      setIsShuffled(false);
    }
  }, [isShuffled, currentIndex, tracklist.length, shuffleRemaining]);

  // Next : passer à la track suivante (désactivé en repeat one)
  const next = useCallback(() => {
    if (repeatMode === 'one' || tracklist.length <= 1) return;
    
    let nextIndex: number;
    
    if (isShuffled && shuffledOrder.length > 0) {
      const nextShufflePos = shufflePosition + 1;
      if (nextShufflePos < shuffledOrder.length) {
        nextIndex = shuffledOrder[nextShufflePos];
        setShufflePosition(nextShufflePos);
      } else if (repeatMode === 'all') {
        const newShuffled = shuffleRemaining(0, tracklist.length);
        setShuffledOrder(newShuffled);
        setShufflePosition(0);
        nextIndex = newShuffled[0];
      } else {
        return;
      }
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= tracklist.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          return;
        }
      }
    }
    
    setCurrentIndex(nextIndex);
    setIsPlaying(true);
  }, [repeatMode, tracklist.length, isShuffled, shuffledOrder, shufflePosition, currentIndex, shuffleRemaining]);

  // Previous : revenir à la track précédente (désactivé en repeat one)
  const previous = useCallback(() => {
    if (repeatMode === 'one' || tracklist.length <= 1) return;
    
    // Si on est au début, revenir au début de la track actuelle
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    
    let prevIndex: number;
    
    if (isShuffled && shufflePosition > 0) {
      const prevShufflePos = shufflePosition - 1;
      prevIndex = shuffledOrder[prevShufflePos];
      setShufflePosition(prevShufflePos);
    } else {
      prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        if (repeatMode === 'all') {
          prevIndex = tracklist.length - 1;
        } else {
          if (audioRef.current) audioRef.current.currentTime = 0;
          return;
        }
      }
    }
    
    setCurrentIndex(prevIndex);
    setIsPlaying(true);
  }, [repeatMode, tracklist.length, isShuffled, shuffledOrder, shufflePosition, currentIndex]);

  // Peut-on naviguer ? (désactivé en repeat one ou si une seule track)
  const canNavigate = repeatMode !== 'one' && tracklist.length > 1;

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        tracklist,
        currentIndex,
        history,
        repeatMode,
        isShuffled,
        playTrack,
        pause,
        resume,
        seek,
        next,
        previous,
        toggleShuffle,
        toggleRepeat,
        canNavigate,
        currentSourceId,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
