import React from 'react';
import { X, Plus, Check, Music2, Heart } from 'lucide-react';
import Image from 'next/image';
import { usePlaylist, Playlist, FAVORITES_PLAYLIST_ID } from '@/lib/playlistContext';
import { JamendoTrack } from '@/lib/types';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: JamendoTrack | null;
  onCreateNew: () => void;
}

export const AddToPlaylistModal = ({ isOpen, onClose, track, onCreateNew }: AddToPlaylistModalProps) => {
  const { playlists, addTrackToPlaylist, removeTrackFromPlaylist, isTrackInPlaylist } = usePlaylist();

  const handleTogglePlaylist = (playlistId: string) => {
    if (!track) return;
    
    const isAdded = isTrackInPlaylist(playlistId, track.id);
    if (isAdded) {
      removeTrackFromPlaylist(playlistId, track.id);
    } else {
      addTrackToPlaylist(playlistId, track);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !track) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/70 flex items-end sm:items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#1a1610] rounded-t-2xl sm:rounded-2xl w-full max-w-sm max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-(--text-color)">Ajouter à une playlist</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Track info */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
            <Image
              src={track.album_image || track.image || '/albumCoverExample.png'}
              alt={track.name}
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-(--text-color) truncate">{track.name}</p>
            <p className="text-xs text-gray-400 truncate">{track.artist_name}</p>
          </div>
        </div>

        {/* Liste des playlists */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Bouton créer nouvelle */}
          <button
            onClick={() => {
              onClose();
              onCreateNew();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-12 h-12 rounded bg-[#2a2518] flex items-center justify-center">
              <Plus size={24} className="text-(--yellow)" />
            </div>
            <span className="text-sm font-medium text-(--text-color)">Créer une playlist</span>
          </button>

          {/* Playlists existantes */}
          {playlists.map((playlist) => {
            const isAdded = isTrackInPlaylist(playlist.id, track.id);
            const isFavorites = playlist.id === FAVORITES_PLAYLIST_ID;
            
            return (
              <button
                key={playlist.id}
                onClick={() => handleTogglePlaylist(playlist.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
              >
                {/* Pochette spéciale pour les favoris */}
                {isFavorites ? (
                  <div className="w-12 h-12 rounded bg-gradient-to-br from-[#3d3525] to-[#2a2518] flex items-center justify-center flex-shrink-0">
                    <Heart size={24} className="text-red-500" fill="currentColor" />
                  </div>
                ) : (
                  <div className="relative w-12 h-12 rounded overflow-hidden bg-[#2a2518] flex-shrink-0">
                    {playlist.coverImage ? (
                      <Image
                        src={playlist.coverImage}
                        alt={playlist.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music2 size={20} className="text-gray-500" />
                      </div>
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-(--text-color) truncate">{playlist.name}</p>
                  <p className="text-xs text-gray-400">{playlist.tracks.length} titres</p>
                </div>
                {/* Indicateur ajouté/non ajouté */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                  isAdded 
                    ? 'bg-(--yellow) text-(--background-brown)' 
                    : 'border-2 border-gray-500 text-gray-500'
                }`}>
                  {isAdded ? <Check size={14} strokeWidth={3} /> : <Plus size={14} />}
                </div>
              </button>
            );
          })}

          {playlists.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">
              Aucune playlist. Crée ta première !
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
