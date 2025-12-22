import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Play, Shuffle, Plus, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { NavBar } from '@/ui/navBar';
import { PageHeader } from '@/ui/PageHeader';
import { JamendoTrack } from '@/lib/types';
import { getAlbumTracks, formatDuration } from '@/lib/jamendoApi';
import { usePlayer } from '@/lib/playerContext';
import { AddToPlaylistModal } from '@/ui/addToPlaylistModal';
import { CreatePlaylistModal } from '@/ui/createPlaylistModal';
import { usePlaylist } from '@/lib/playlistContext';
import { useBodyTheme } from '@/lib/useBodyTheme';

export default function AlbumPage() {
  const router = useRouter();
  const { id } = router.query;
  const [tracks, setTracks] = useState<JamendoTrack[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<JamendoTrack | null>(null);
  
  const { playTrack, currentTrack, isPlaying, pause, toggleShuffle, isShuffled, tracklist } = usePlayer();
  const { createPlaylist } = usePlaylist();

  // Appliquer le thème dark sur body pour le gradient étendu
  useBodyTheme('dark');

  const albumInfo = tracks[0];

  useEffect(() => {
    async function loadAlbum() {
      if (id && typeof id === 'string') {
        try {
          const albumTracks = await getAlbumTracks(id);
          setTracks(albumTracks);
        } catch (error) {
          console.error('Erreur lors du chargement de l\'album:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    loadAlbum();
  }, [id]);

  // Jouer tout l'album
  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  // Jouer avec shuffle
  const handleShuffle = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
      setTimeout(() => toggleShuffle(), 100);
    }
  };

  // Jouer une track spécifique
  const handlePlayTrack = (track: JamendoTrack) => {
    playTrack(track, tracks);
  };

  const handleAddToPlaylist = (track: JamendoTrack) => {
    setSelectedTrack(track);
    setShowAddToPlaylist(true);
  };

  const bottomPadding = currentTrack ? 'pb-44' : 'pb-32';

  return (
    <main className={`flex flex-col min-h-screen ${bottomPadding}`}>
      <PageHeader title="Album" showBack variant="dark" />

      <div className="flex-grow">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--yellow)"></div>
          </div>
        ) : tracks.length > 0 ? (
          <>
            {/* Cover et infos - Layout horizontal */}
            <div className="px-4 pt-4 pb-6">
              <div className="flex gap-4 mb-6">
                {/* Cover à gauche */}
                <div className="relative w-32 h-32 rounded-xl overflow-hidden shadow-2xl flex-shrink-0">
                  <Image
                    src={albumInfo?.album_image || '/albumCoverExample.png'}
                    alt={albumInfo?.album_name || 'Album'}
                    fill
                    sizes="128px"
                    className="object-cover"
                    priority
                  />
                </div>
                
                {/* Infos à droite */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      Album • {tracks.length} {tracks.length > 1 ? 'titres' : 'titre'} • {albumInfo?.releasedate?.split('-')[0] || ''}
                    </p>
                    <h1 className="font-bold text-xl text-(--text-color) mb-1 truncate">
                      {albumInfo?.album_name}
                    </h1>
                    <Link 
                      href="#" 
                      className="text-sm text-(--yellow) hover:underline truncate block"
                    >
                      {albumInfo?.artist_name}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Gros boutons Play et Shuffle */}
              <div className="flex gap-3">
                <button
                  onClick={handlePlayAll}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-(--yellow) text-(--background-brown) rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg"
                >
                  <Play size={20} fill="currentColor" />
                  Lecture
                </button>
                <button 
                  onClick={handleShuffle}
                  className={`flex items-center justify-center px-6 py-3 rounded-full font-semibold transition-colors ${
                    isShuffled && tracklist.length > 1 ? 'bg-(--yellow) text-(--background-brown)' : 'bg-[#2a2518] text-(--text-color) hover:bg-[#3d3525]'
                  }`}
                >
                  <Shuffle size={20} />
                </button>
              </div>
            </div>

            {/* Liste des pistes */}
            <div className="px-4">
              <div className="space-y-1">
                {tracks.map((track, index) => {
                  const isCurrentTrackPlaying = currentTrack?.id === track.id;

                  return (
                    <div 
                      key={track.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors group ${
                        isCurrentTrackPlaying 
                          ? 'bg-(--yellow)/20' 
                          : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Numéro ou indicateur de lecture */}
                      <div className="w-6 text-center flex-shrink-0">
                        {isCurrentTrackPlaying && isPlaying ? (
                          <div className="flex items-center justify-center gap-0.5">
                            <span className="w-0.5 h-3 bg-(--yellow) animate-pulse"></span>
                            <span className="w-0.5 h-4 bg-(--yellow) animate-pulse delay-75"></span>
                            <span className="w-0.5 h-2 bg-(--yellow) animate-pulse delay-150"></span>
                          </div>
                        ) : (
                          <span className={`text-sm ${isCurrentTrackPlaying ? 'text-(--yellow)' : 'text-gray-500'}`}>
                            {index + 1}
                          </span>
                        )}
                      </div>
                      
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
                      
                      {/* Infos track - cliquable pour jouer */}
                      <button 
                        className="flex-grow min-w-0 text-left"
                        onClick={() => handlePlayTrack(track)}
                      >
                        <p className={`font-medium truncate ${isCurrentTrackPlaying ? 'text-(--yellow)' : 'text-(--text-color)'}`}>
                          {track.name}
                        </p>
                        <p className="text-sm text-gray-400 truncate">
                          {track.artist_name} • {formatDuration(track.duration)}
                        </p>
                      </button>
                      
                      {/* Bouton ajouter à playlist */}
                      <button 
                        onClick={() => handleAddToPlaylist(track)}
                        className="w-7 h-7 rounded-full border-2 border-gray-500 text-gray-500 hover:border-(--yellow) hover:text-(--yellow) flex items-center justify-center transition-colors flex-shrink-0"
                        title="Ajouter à une playlist"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400">Album non trouvé</p>
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
        onCreate={(name, desc, isPublic) => createPlaylist(name, desc, isPublic)}
      />
    </main>
  );
}
