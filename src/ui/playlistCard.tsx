import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Pause, Music2, Heart, Lock } from 'lucide-react';
import { Playlist, FAVORITES_PLAYLIST_ID } from '@/lib/playlistContext';
import { JamendoTrack } from '@/lib/types';

// Composant pour afficher la pochette des favoris (cœur rouge)
const FavoritesCover = ({ size = 144 }: { size?: number }) => {
  return (
    <div 
      className="w-full h-full bg-gradient-to-br from-[#3d3525] to-[#2a2518] flex items-center justify-center"
    >
      <Heart size={size / 2.5} className="text-red-500" fill="currentColor" />
    </div>
  );
};

// Composant pour afficher la grille de covers d'une playlist
const PlaylistCoverGrid = ({ 
  tracks, 
  size = 144, 
  priority = false,
  isFavorites = false 
}: { 
  tracks: JamendoTrack[]; 
  size?: number; 
  priority?: boolean;
  isFavorites?: boolean;
}) => {
  // Si c'est la playlist favoris, toujours afficher le cœur
  if (isFavorites) {
    return <FavoritesCover size={size} />;
  }

  const coverImages = tracks
    .slice(0, 4)
    .map(t => t.album_image || t.image)
    .filter(Boolean) as string[];
  
  const count = coverImages.length;

  if (count === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#2a2518]">
        <Music2 size={size / 3} className="text-gray-500" />
      </div>
    );
  }

  if (count === 1) {
    return (
      <Image
        src={coverImages[0]}
        alt="Playlist cover"
        fill
        sizes={`${size}px`}
        className="object-cover"
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
      />
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 w-full h-full">
        {coverImages.map((src, i) => (
          <div key={i} className="relative">
            <Image
              src={src}
              alt={`Cover ${i + 1}`}
              fill
              sizes={`${size / 2}px`}
              className="object-cover"
              priority={priority && i === 0}
              loading={priority && i === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
        <div className="relative">
          <Image
            src={coverImages[0]}
            alt="Cover 1"
            fill
            sizes={`${size / 2}px`}
            className="object-cover"
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
          />
        </div>
        <div className="relative">
          <Image
            src={coverImages[1]}
            alt="Cover 2"
            fill
            sizes={`${size / 2}px`}
            className="object-cover"
            loading="lazy"
          />
        </div>
        <div className="relative col-span-2">
          <Image
            src={coverImages[2]}
            alt="Cover 3"
            fill
            sizes={`${size}px`}
            className="object-cover"
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  // 4 images
  return (
    <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
      {coverImages.map((src, i) => (
        <div key={i} className="relative">
          <Image
            src={src}
            alt={`Cover ${i + 1}`}
            fill
            sizes={`${size / 2}px`}
            className="object-cover"
            priority={priority && i === 0}
            loading={priority && i === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}
    </div>
  );
};

interface PlaylistCardProps {
  playlist: Playlist;
  onPlay?: () => void;
  onPause?: () => void;
  priority?: boolean;
  isCurrentlyPlaying?: boolean;
  isPlaying?: boolean;
  variant?: 'light' | 'dark';
}

export const PlaylistCard = ({ 
  playlist, 
  onPlay, 
  onPause,
  priority = false,
  isCurrentlyPlaying = false,
  isPlaying = false,
  variant = 'dark'
}: PlaylistCardProps) => {
  const trackCount = playlist.tracks.length;
  const isFavorites = playlist.id === FAVORITES_PLAYLIST_ID;
  const isPrivate = playlist.isPublic === false && !isFavorites;
  
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isCurrentlyPlaying && isPlaying) {
      // Si on écoute actuellement cette playlist et qu'elle joue, on met pause
      onPause?.();
    } else {
      // Sinon on lance la lecture
      onPlay?.();
    }
  };
  
  return (
    <Link 
      href={`/music/playlist/${playlist.id}`}
      className="flex-shrink-0 w-36 group"
    >
      <div className="relative w-36 h-36 rounded-lg overflow-hidden mb-2 bg-[#2a2518]">
        <PlaylistCoverGrid 
          tracks={playlist.tracks} 
          size={144} 
          priority={priority} 
          isFavorites={isFavorites}
        />
        
        {/* Bouton play/pause */}
        {trackCount > 0 && (
          <div className="absolute bottom-2 right-2">
            <button
              onClick={handleButtonClick}
              className="w-10 h-10 bg-(--yellow) rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-lg"
            >
              {isCurrentlyPlaying && isPlaying ? (
                <Pause size={20} fill="currentColor" className="text-black" />
              ) : (
                <Play size={20} fill="currentColor" className="text-black ml-0.5" />
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Nom avec cadenas si privée */}
      <h3 className={`text-sm font-medium truncate flex items-center gap-1 ${
        variant === 'light' ? 'text-gray-900' : 'text-(--text-color)'
      }`}>
        {isPrivate && <Lock size={12} className="text-gray-400 flex-shrink-0" />}
        {playlist.name}
      </h3>
      <p className={`text-xs ${
        variant === 'light' ? 'text-gray-500' : 'text-gray-400'
      }`}>{trackCount} titre{trackCount !== 1 ? 's' : ''}</p>
    </Link>
  );
};

// Export du composant de grille pour réutilisation
export { PlaylistCoverGrid, FavoritesCover };
