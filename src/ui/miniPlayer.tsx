import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { usePlayer } from '@/lib/playerContext';
import { formatDuration } from '@/lib/jamendoApi';

export function MiniPlayer() {
  const { 
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration, 
    pause, 
    resume, 
    next, 
    previous,
    seek 
  } = usePlayer();

  // Ne pas afficher si pas de piste en cours
  if (!currentTrack) {
    return null;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-(--background-brown) rounded-xl border-2 border-black shadow-lg z-40">
      {/* Barre de progression */}
      <div className="relative h-1 bg-gray-700 rounded-t-xl overflow-hidden">
        <div 
          className="absolute left-0 top-0 h-full bg-(--yellow) transition-all"
          style={{ width: `${progress}%` }}
        />
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="flex items-center gap-3 p-3">
        {/* Cover */}
        <div className="relative w-12 h-12 flex-shrink-0">
          <Image
            src={currentTrack.album_image || currentTrack.image || '/albumCoverExample.png'}
            alt={currentTrack.name}
            fill
            sizes="48px"
            className="rounded-md object-cover"
          />
        </div>

        {/* Infos */}
        <div className="flex-grow min-w-0">
          <p className="font-medium text-(--text-color) truncate text-sm">
            {currentTrack.name}
          </p>
                    <p className="text-xs text-gray-400 truncate">
            {currentTrack.artist_id ? (
              <Link 
                href={`/profile/${currentTrack.artist_id}`}
                className="hover:underline hover:text-(--text-color) transition-colors"
              >
                {currentTrack.artist_name}
              </Link>
            ) : currentTrack.artist_name}
          </p>
        </div>

        {/* Temps */}
        <span className="text-xs text-gray-400 flex-shrink-0">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </span>

        {/* Contrôles */}
        <div className="flex items-center gap-2">
          <button 
            onClick={previous}
            className="p-1 text-(--text-color) hover:text-(--yellow) transition-colors"
          >
            <SkipBack size={20} fill="currentColor" />
          </button>
          
          <button 
            onClick={handlePlayPause}
            className="p-2 bg-(--yellow) rounded-full text-(--background-brown) hover:opacity-90 transition-opacity"
          >
            {isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" />
            )}
          </button>
          
          <button 
            onClick={next}
            className="p-1 text-(--text-color) hover:text-(--yellow) transition-colors"
          >
            <SkipForward size={20} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}
