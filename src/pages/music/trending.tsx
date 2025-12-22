import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus, Check } from 'lucide-react';
import { NavBar } from '@/ui/navBar';
import { PageHeader } from '@/ui/PageHeader';
import { AddToPlaylistModal } from '@/ui/addToPlaylistModal';
import { CreatePlaylistModal } from '@/ui/createPlaylistModal';
import { JamendoTrack } from '@/lib/types';
import { getPopularTracks, formatDuration } from '@/lib/jamendoApi';
import { usePlayer } from '@/lib/playerContext';
import { usePlaylist } from '@/lib/playlistContext';
import { useBodyTheme } from '@/lib/useBodyTheme';

export default function TrendingPage() {
  const [tracks, setTracks] = useState<JamendoTrack[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<JamendoTrack | null>(null);

  const { playTrack, currentTrack } = usePlayer();
  const { playlists, createPlaylist } = usePlaylist();

  // Vérifier si un track est dans n'importe quelle playlist
  const isTrackInAnyPlaylist = (trackId: string) => {
    return playlists.some(p => p.tracks.some(t => t.id === trackId));
  };

  useBodyTheme('dark');

  useEffect(() => {
    const loadTracks = async () => {
      setLoading(true);
      try {
        const popular = await getPopularTracks(30);
        setTracks(popular);
      } catch (error) {
        console.error('Erreur chargement tendances:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTracks();
  }, []);

  const handlePlayTrack = (track: JamendoTrack) => {
    playTrack(track, tracks);
  };

  const handleAddToPlaylist = (track: JamendoTrack) => {
    setSelectedTrack(track);
    setShowAddToPlaylist(true);
  };

  const bottomPadding = currentTrack ? 'pb-36' : 'pb-24';

  return (
    <main className={`flex flex-col min-h-screen ${bottomPadding}`}>
      <PageHeader title="Tendances du moment" showBack variant="dark" />

      <div className="flex-grow px-4 pt-4">
        <p className="text-sm text-gray-400 mb-4">
          Les titres les plus populaires en ce moment
        </p>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--yellow)"></div>
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Aucune tendance disponible</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map((track) => {
              const isCurrentTrack = currentTrack?.id === track.id;
              
              return (
                <div 
                  key={track.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isCurrentTrack ? 'bg-(--yellow)/20' : 'hover:bg-white/5'
                  }`}
                >
                  {/* Cover */}
                  <button
                    onClick={() => handlePlayTrack(track)}
                    className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0"
                  >
                    <Image
                      src={track.album_image || track.image || '/albumCoverExample.png'}
                      alt={track.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </button>
                  
                  {/* Infos */}
                  <button 
                    onClick={() => handlePlayTrack(track)}
                    className="flex-grow min-w-0 text-left"
                  >
                    <p className={`font-medium truncate ${isCurrentTrack ? 'text-(--yellow)' : 'text-(--text-color)'}`}>
                      {track.name}
                    </p>
                    <p className="text-sm text-gray-400 truncate">
                      {track.artist_name} • {formatDuration(track.duration)}
                    </p>
                  </button>
                  
                  {/* Bouton ajouter */}
                  {isTrackInAnyPlaylist(track.id) ? (
                    <div className="w-7 h-7 rounded-full bg-(--yellow) flex items-center justify-center flex-shrink-0" title="Déjà dans une playlist">
                      <Check size={14} className="text-(--background-brown)" />
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleAddToPlaylist(track)}
                      className="w-7 h-7 rounded-full border-2 border-gray-500 text-gray-500 hover:border-(--yellow) hover:text-(--yellow) flex items-center justify-center transition-colors flex-shrink-0"
                      title="Ajouter à une playlist"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <NavBar />

      {/* Modals */}
      <AddToPlaylistModal
        isOpen={showAddToPlaylist}
        onClose={() => setShowAddToPlaylist(false)}
        track={selectedTrack}
        onCreateNew={() => {
          setShowAddToPlaylist(false);
          setShowCreatePlaylist(true);
        }}
      />
      <CreatePlaylistModal
        isOpen={showCreatePlaylist}
        onClose={() => setShowCreatePlaylist(false)}
        onCreate={(name: string, description: string) => {
          createPlaylist(name, description);
          setShowCreatePlaylist(false);
          if (selectedTrack) {
            setShowAddToPlaylist(true);
          }
        }}
      />
    </main>
  );
}
