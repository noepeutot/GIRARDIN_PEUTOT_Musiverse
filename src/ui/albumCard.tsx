import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Pause } from 'lucide-react';
import { JamendoAlbum } from '@/lib/types';

interface AlbumCardProps {
  album: JamendoAlbum;
  onPlay?: () => void;
  onPause?: () => void;
  isCurrentlyPlaying?: boolean;
  isPlaying?: boolean;
  variant?: 'light' | 'dark';
}

export function AlbumCard({ 
  album, 
  onPlay, 
  onPause,
  isCurrentlyPlaying = false,
  isPlaying = false,
  variant = 'dark'
}: AlbumCardProps) {
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isCurrentlyPlaying && isPlaying) {
      onPause?.();
    } else {
      onPlay?.();
    }
  };

  return (
    <Link 
      href={`/music/album/${album.id}`}
      className="flex-shrink-0 w-36 group"
    >
      <div className="relative w-36 h-36 rounded-lg overflow-hidden mb-2 shadow-md">
        <Image
          src={album.image || '/albumCoverExample.png'}
          alt={album.name}
          fill
          sizes="144px"
          className="object-cover group-hover:scale-105 transition-transform"
        />
        
        {/* Bouton play/pause */}
        {onPlay && (
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
      <h3 className={`text-sm font-medium truncate ${
        variant === 'light' ? 'text-gray-900' : 'text-(--text-color)'
      }`}>{album.name}</h3>
      <p className={`text-xs truncate ${
        variant === 'light' ? 'text-gray-500' : 'text-gray-400'
      }`}>{album.artist_name}</p>
    </Link>
  );
}
