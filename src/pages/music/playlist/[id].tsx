import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft, Play, Shuffle, Trash2, Pencil, Search, Lock } from 'lucide-react';
import { NavBar } from '@/ui/navBar';
import { AddToPlaylistModal } from '@/ui/addToPlaylistModal';
import { CreatePlaylistModal } from '@/ui/createPlaylistModal';
import { ConfirmModal } from '@/ui/confirmModal';
import { PlaylistCoverGrid } from '@/ui/playlistCard';
import { EditPlaylistModal } from '@/ui/editPlaylistModal';
import { usePlayer } from '@/lib/playerContext';
import { usePlaylist, FAVORITES_PLAYLIST_ID } from '@/lib/playlistContext';
import { formatDuration } from '@/lib/jamendoApi';
import { JamendoTrack } from '@/lib/types';

export default function PlaylistPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const { playTrack, currentTrack, isPlaying, pause, toggleShuffle, isShuffled, tracklist } = usePlayer();
  const { getPlaylist, removeTrackFromPlaylist, deletePlaylist, createPlaylist, updatePlaylist } = usePlaylist();
  
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showEditPlaylist, setShowEditPlaylist] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<JamendoTrack | null>(null);
  
  // Confirmations
  const [showDeletePlaylistConfirm, setShowDeletePlaylistConfirm] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<string | null>(null);
  
  const playlist = id ? getPlaylist(id as string) : undefined;

  if (!playlist) {
    return (
      <main className="flex flex-col min-h-screen pb-24 bg-gradient-to-b from-[#2a2518] via-[#1a1610] to-[#0d0b08]">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Playlist non trouvée</p>
        </div>
        <NavBar />
      </main>
    );
  }

  // Jouer toute la playlist
  const handlePlayAll = () => {
    if (playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  // Jouer avec shuffle
  const handleShuffle = () => {
    if (playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks);
      setTimeout(() => toggleShuffle(), 100);
    }
  };

  // Jouer une track spécifique
  const handlePlayTrack = (track: JamendoTrack) => {
    playTrack(track, playlist.tracks);
  };

  const handleRemoveTrack = (trackId: string) => {
    removeTrackFromPlaylist(playlist.id, trackId);
    setTrackToDelete(null);
  };

  const handleDeletePlaylist = () => {
    deletePlaylist(playlist.id);
    router.push('/music');
  };

  const handleEditSave = (name: string, description: string, isPublic: boolean) => {
    updatePlaylist(playlist.id, { name, description, isPublic });
  };

  // Formater la date de création
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const bottomPadding = currentTrack ? 'pb-36' : 'pb-24';
  const isFavorites = playlist.id === FAVORITES_PLAYLIST_ID;

  return (
    <main className={`flex flex-col min-h-screen ${bottomPadding} bg-gradient-to-b from-[#2a2518] via-[#1a1610] to-[#0d0b08]`}>
      {/* Header - transparent pour gradient uniforme */}
      <header className="sticky top-0 z-30 px-4 py-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft size={24} className="text-(--text-color)" />
          </button>
          {/* Ne pas afficher le bouton supprimer pour les favoris */}
          {!isFavorites && (
            <button 
              onClick={() => setShowDeletePlaylistConfirm(true)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <Trash2 size={20} className="text-gray-400" />
            </button>
          )}
        </div>
      </header>

      <div className="flex-grow">
        {/* Cover et infos - Layout horizontal */}
        <div className="px-4 pt-4 pb-6">
          <div className="flex gap-4 mb-6">
            {/* Cover à gauche */}
            <div className="relative w-32 h-32 rounded-xl overflow-hidden shadow-2xl flex-shrink-0 bg-[#2a2518]">
              <PlaylistCoverGrid 
                tracks={playlist.tracks} 
                size={128} 
                priority 
                isFavorites={isFavorites}
              />
            </div>
            
            {/* Infos à droite */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">
                  Playlist • {playlist.tracks.length} {playlist.tracks.length > 1 ? 'titres' : 'titre'}{!isFavorites && ` • ${formatDate(playlist.createdAt)}`}
                </p>
                <h1 className="font-bold text-xl text-(--text-color) mb-1 truncate flex items-center gap-1.5">
                  {playlist.isPublic === false && !isFavorites && (
                    <Lock size={14} className="text-gray-400 flex-shrink-0" />
                  )}
                  {playlist.name}
                </h1>
                <p className="text-sm text-gray-400 truncate mb-2">
                  {playlist.description || 'Ma playlist'}
                </p>
              </div>
              
              {/* Bouton Éditer (sauf favoris) */}
              {!isFavorites && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowEditPlaylist(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3d3525] hover:bg-[#4a4030] rounded-full transition-colors"
                  >
                    <Pencil size={14} className="text-gray-300" />
                    <span className="text-sm text-gray-300">Éditer</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Gros boutons Play et Shuffle */}
          <div className="flex gap-3">
            <button
              onClick={handlePlayAll}
              disabled={playlist.tracks.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-(--text-color) text-(--background-brown) rounded-full font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg"
            >
              <Play size={20} fill="currentColor" />
              Play
            </button>
            <button 
              onClick={handleShuffle}
              disabled={playlist.tracks.length === 0}
              className={`flex-1 flex items-center justify-center gap-2 py-3 border-2 rounded-full font-semibold transition-colors disabled:opacity-50 ${
                isShuffled && tracklist.length > 1 ? 'border-(--yellow) text-(--yellow)' : 'border-gray-500 text-(--text-color) hover:bg-white/5'
              }`}
            >
              <Shuffle size={20} />
              Shuffle
            </button>
          </div>
        </div>

        {/* Liste des pistes */}
        <div className="px-4">
          {/* Bouton ajouter un son */}
          <button
            onClick={() => router.push(`/music/search?addTo=${playlist.id}`)}
            className="w-full flex items-center gap-3 py-3 px-2 mb-2 rounded-lg border-2 border-dashed border-gray-600 hover:border-(--yellow) hover:bg-[#2a2518]/50 transition-all group"
          >
            <div className="w-8 flex items-center justify-center">
              <Search size={18} className="text-gray-400 group-hover:text-(--yellow)" />
            </div>
            <span className="text-gray-400 group-hover:text-(--yellow)">Ajouter un son...</span>
          </button>

          {playlist.tracks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Cette playlist est vide</p>
              <p className="text-gray-500 text-sm mt-1">Utilise le bouton ci-dessus pour chercher des titres</p>
            </div>
          ) : (
            playlist.tracks.map((track, index) => {
              const isCurrentTrackPlaying = currentTrack?.id === track.id;

              return (
                <div 
                  key={track.id} 
                  className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  {/* Numéro ou indicateur de lecture */}
                  <div className="w-8 text-center">
                    {isCurrentTrackPlaying && isPlaying ? (
                      <div className="flex items-center justify-center gap-0.5">
                        <span className="w-0.5 h-3 bg-(--yellow) rounded-full animate-pulse" />
                        <span className="w-0.5 h-4 bg-(--yellow) rounded-full animate-pulse delay-75" />
                        <span className="w-0.5 h-2 bg-(--yellow) rounded-full animate-pulse delay-150" />
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">{(index + 1).toString().padStart(2, '0')}</span>
                    )}
                  </div>
                  
                  {/* Infos track - cliquable pour jouer */}
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handlePlayTrack(track)}
                  >
                    <p className={`text-sm font-medium truncate ${isCurrentTrackPlaying ? 'text-(--yellow)' : 'text-(--text-color)'}`}>
                      {track.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {track.artist_name} • {formatDuration(track.duration)}
                    </p>
                  </div>
                  
                  {/* Bouton supprimer */}
                  <button 
                    onClick={() => setTrackToDelete(track.id)}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-full transition-all"
                  >
                    <Trash2 size={16} className="text-gray-400" />
                  </button>
                </div>
              );
            })
          )}
        </div>
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

      <EditPlaylistModal
        isOpen={showEditPlaylist}
        onClose={() => setShowEditPlaylist(false)}
        playlist={playlist}
        onSave={handleEditSave}
      />

      {/* Confirmation suppression playlist */}
      <ConfirmModal
        isOpen={showDeletePlaylistConfirm}
        onClose={() => setShowDeletePlaylistConfirm(false)}
        onConfirm={handleDeletePlaylist}
        title="Supprimer la playlist ?"
        message={`"${playlist.name}" sera définitivement supprimée.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isDanger
      />

      {/* Confirmation suppression track */}
      <ConfirmModal
        isOpen={trackToDelete !== null}
        onClose={() => setTrackToDelete(null)}
        onConfirm={() => trackToDelete && handleRemoveTrack(trackToDelete)}
        title="Retirer ce titre ?"
        message="Le titre sera retiré de cette playlist."
        confirmText="Retirer"
        cancelText="Annuler"
      />
    </main>
  );
}
