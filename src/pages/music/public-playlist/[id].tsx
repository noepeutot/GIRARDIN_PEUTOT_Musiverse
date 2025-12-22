import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Play, Shuffle, Heart, Clock, Pause, Plus } from 'lucide-react';
import { NavBar } from '@/ui/navBar';
import { PageHeader } from '@/ui/PageHeader';
import { AddToPlaylistModal } from '@/ui/addToPlaylistModal';
import { CreatePlaylistModal } from '@/ui/createPlaylistModal';
import { usePlayer } from '@/lib/playerContext';
import { usePlaylist } from '@/lib/playlistContext';
import { getPopularTracks, formatDuration } from '@/lib/jamendoApi';
import { JamendoTrack } from '@/lib/types';
import { useBodyTheme } from '@/lib/useBodyTheme';
import { SAMPLE_PUBLIC_PLAYLISTS } from '@/lib/sampleEvents';

export default function PublicPlaylistPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const { playTrack, currentTrack, isPlaying, pause, toggleShuffle } = usePlayer();
  const { createPlaylist } = usePlaylist();
  const [tracks, setTracks] = useState<JamendoTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<JamendoTrack | null>(null);

  const handleAddToPlaylist = (track: JamendoTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTrack(track);
    setShowAddToPlaylist(true);
  };
  
  useBodyTheme('dark');
  
  // Trouver la playlist publique
  const playlist = SAMPLE_PUBLIC_PLAYLISTS.find(p => p.id === id);

  // Charger des tracks aléatoires pour cette playlist
  useEffect(() => {
    const loadTracks = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Générer un offset basé sur l'ID pour avoir des tracks différentes par playlist
        const seed = id.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const allTracks = await getPopularTracks(50);
        
        // Mélanger les tracks de manière déterministe basée sur l'ID
        const shuffled = [...allTracks].sort((a, b) => {
          const hashA = (parseInt(a.id) * seed) % 100;
          const hashB = (parseInt(b.id) * seed) % 100;
          return hashA - hashB;
        });
        
        // Prendre un nombre de tracks correspondant au trackCount de la playlist
        const count = playlist?.trackCount || 20;
        setTracks(shuffled.slice(0, Math.min(count, shuffled.length)));
      } catch (error) {
        console.error('Erreur chargement tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTracks();
  }, [id, playlist?.trackCount]);

  if (!playlist) {
    return (
      <main className="flex flex-col min-h-screen pb-24">
        <PageHeader title="Playlist" showBack variant="dark" />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Playlist non trouvée</p>
        </div>
        <NavBar />
      </main>
    );
  }

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks, `public_${playlist.id}`);
    }
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled, `public_${playlist.id}`);
    }
  };

  const handlePlayTrack = (track: JamendoTrack) => {
    playTrack(track, tracks, `public_${playlist.id}`);
  };

  const isCurrentlyPlaying = currentTrack && tracks.some(t => t.id === currentTrack.id);
  const bottomPadding = currentTrack ? 'pb-44' : 'pb-32';

  // Calculer la durée totale
  const totalDuration = tracks.reduce((acc, t) => acc + t.duration, 0);
  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}min`;
    return `${mins} min`;
  };

  return (
    <main className={`flex flex-col min-h-screen ${bottomPadding}`}>
      <PageHeader title="Playlist" showBack variant="dark" />
      
      {/* Header Playlist */}
      <div className="px-4 pt-4 pb-6">
        <div className="flex gap-4 mb-6">
          {/* Cover à gauche */}
          <div className="relative w-32 h-32 rounded-xl overflow-hidden shadow-2xl flex-shrink-0">
            <Image
              src={playlist.coverImage}
              alt={playlist.name}
              fill
              sizes="128px"
              className="object-cover"
            />
          </div>
          
          {/* Infos à droite */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">
                Playlist • {tracks.length} {tracks.length > 1 ? 'titres' : 'titre'} • {playlist.createdAt.split('-')[0]}
              </p>
              <h1 className="font-bold text-xl text-(--text-color) mb-1 truncate">
                {playlist.name}
              </h1>
              <p className="text-sm text-(--yellow) truncate">
                {playlist.creatorName}
              </p>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={isCurrentlyPlaying && isPlaying ? () => pause() : handlePlayAll}
            disabled={tracks.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-(--yellow) text-(--background-brown) rounded-full font-medium disabled:opacity-50"
          >
            {isCurrentlyPlaying && isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
            {isCurrentlyPlaying && isPlaying ? 'Pause' : 'Lecture'}
          </button>
          <button
            onClick={handleShuffle}
            disabled={tracks.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#2a2518] text-(--text-color) rounded-full font-medium disabled:opacity-50"
          >
            <Shuffle size={20} />
          </button>
        </div>
      </div>

      {/* Liste des tracks */}
      <div className="flex-grow px-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--yellow)"></div>
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-gray-400">Aucun titre dans cette playlist</p>
          </div>
        ) : (
          <div className="space-y-1">
            {tracks.map((track, index) => {
              const isCurrentTrack = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isCurrentTrack 
                      ? 'bg-(--yellow)/20' 
                      : 'hover:bg-white/5'
                  }`}
                >
                  {/* Numéro ou indicateur de lecture */}
                  <div className="w-6 text-center flex-shrink-0">
                    {isCurrentTrack && isPlaying ? (
                      <div className="flex items-center justify-center gap-0.5">
                        <span className="w-0.5 h-3 bg-(--yellow) animate-pulse"></span>
                        <span className="w-0.5 h-4 bg-(--yellow) animate-pulse delay-75"></span>
                        <span className="w-0.5 h-2 bg-(--yellow) animate-pulse delay-150"></span>
                      </div>
                    ) : (
                      <span className={`text-sm ${isCurrentTrack ? 'text-(--yellow)' : 'text-gray-500'}`}>
                        {index + 1}
                      </span>
                    )}
                  </div>
                  
                  {/* Cover - cliquable */}
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
                  
                  {/* Infos - cliquable */}
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

                  {/* Bouton Ajouter à playlist */}
                  <button
                    onClick={(e) => handleAddToPlaylist(track, e)}
                    className="w-7 h-7 rounded-full border-2 border-gray-500 text-gray-500 hover:border-(--yellow) hover:text-(--yellow) flex items-center justify-center transition-colors flex-shrink-0"
                    title="Ajouter à une playlist"
                  >
                    <Plus size={14} />
                  </button>
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
        onCreateNew={() => setShowCreatePlaylist(true)}
      />
      <CreatePlaylistModal
        isOpen={showCreatePlaylist}
        onClose={() => setShowCreatePlaylist(false)}
        onCreate={(name, description) => createPlaylist(name, description)}
      />
    </main>
  );
}
