import React from 'react';
import Image from 'next/image';
import { Play, Pause, Plus } from 'lucide-react';
import { JamendoTrack } from '@/lib/types';
import { usePlayer } from '@/lib/playerContext';
import { formatDuration } from '@/lib/jamendoApi';

interface TrackCardProps {
  track: JamendoTrack;
  showAlbum?: boolean;
  index?: number;
  onAddToPlaylist?: () => void;
}

export function TrackCard({ track, showAlbum = true, index, onAddToPlaylist }: TrackCardProps) {
  const { playTrack, pause, currentTrack, isPlaying } = usePlayer();
  
  const isCurrentTrack = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const handlePlayPause = () => {
    if (isCurrentlyPlaying) {
      pause();
    } else {
      playTrack(track);
    }
  };

  return (
    <div 
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#443d2a] transition-colors cursor-pointer group"
      onClick={handlePlayPause}
    >
      {/* Index ou bouton play */}
      <div className="w-8 flex justify-center">
        {index !== undefined ? (
          <span className="text-sm text-gray-400 group-hover:hidden">
            {index + 1}
          </span>
        ) : null}
        <button 
          className={`${index !== undefined ? 'hidden group-hover:block' : ''} text-(--text-color)`}
          onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}
        >
          {isCurrentlyPlaying ? (
            <Pause size={18} fill="currentColor" />
          ) : (
            <Play size={18} fill="currentColor" />
          )}
        </button>
      </div>

      {/* Cover de l'album */}
      {showAlbum && (
        <div className="relative w-12 h-12 flex-shrink-0">
          <Image
            src={track.album_image || track.image || '/albumCoverExample.png'}
            alt={track.album_name}
            fill
            sizes="48px"
            className="rounded object-cover"
          />
        </div>
      )}

      {/* Infos de la piste */}
      <div className="flex-grow min-w-0">
        <p className={`font-medium truncate ${isCurrentTrack ? 'text-(--yellow)' : 'text-(--text-color)'}`}>
          {track.name}
        </p>
        <p className="text-sm text-gray-400 truncate">
          {track.artist_name}
          {showAlbum && track.album_name && ` • ${track.album_name}`}
        </p>
      </div>

      {/* Durée */}
      <span className="text-sm text-gray-400 flex-shrink-0">
        {formatDuration(track.duration)}
      </span>

      {/* Bouton ajouter */}
      {onAddToPlaylist && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToPlaylist();
          }}
          className="w-7 h-7 rounded-full border-2 border-gray-500 text-gray-500 hover:border-(--yellow) hover:text-(--yellow) flex items-center justify-center transition-colors flex-shrink-0"
          title="Ajouter à une playlist"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  );
}
