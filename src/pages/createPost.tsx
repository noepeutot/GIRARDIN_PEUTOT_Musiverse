import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { X, Music, ListMusic, Image as ImageIcon, ChevronUp, Heart, Play, Pause, Search, GalleryVerticalEnd, CalendarDays, ArrowRight, Plus, MapPin, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { usePlaylist, FAVORITES_PLAYLIST_ID } from '@/lib/playlistContext';
import { usePlayer } from '@/lib/playerContext';
import { addUserPost } from '@/lib/feedUtils';
import { searchTracks, formatDuration, getTrendingTracks, getPopularTracks } from '@/lib/jamendoApi';
import { JamendoTrack } from '@/lib/types';
import { PlaylistCoverGrid } from '@/ui/playlistCard';
import { SAMPLE_PUBLIC_PLAYLISTS, PublicPlaylist, SAMPLE_EVENTS, MusicEvent, formatEventDate, getCategoryLabel } from '@/lib/sampleEvents';

type MusicTab = 'foryou' | 'trending' | 'favorites';
type PlaylistTab = 'mine' | 'popular';

export default function CreatePost() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { playlists, isTrackFavorite, toggleFavorite } = usePlaylist();
  const { playTrack, pause, resume, isPlaying, currentTrack, history } = usePlayer();
  
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pièces jointes
  const [attachedTracks, setAttachedTracks] = useState<JamendoTrack[]>([]);
  const [attachedPlaylist, setAttachedPlaylist] = useState<{ id: string; name: string; coverImage: string; tracks?: JamendoTrack[] } | null>(null);
  const [showAttachedPlaylistTracks, setShowAttachedPlaylistTracks] = useState(false);
  const [attachedEvent, setAttachedEvent] = useState<MusicEvent | null>(null);
  
  // Track en prévisualisation (mini player avant ajout)
  const [previewTrack, setPreviewTrack] = useState<JamendoTrack | null>(null);
  
  // Mode du panneau d'outils
  const [toolsMode, setToolsMode] = useState<'hidden' | 'music' | 'playlist' | 'expanded' | 'event' | 'poll'>('hidden');
  const [musicTab, setMusicTab] = useState<MusicTab>('foryou');
  const [playlistTab, setPlaylistTab] = useState<PlaylistTab>('mine');
  
  // Playlist en prévisualisation (avant ajout)
  const [selectedPlaylistPreview, setSelectedPlaylistPreview] = useState<any | null>(null);
  const [showPlaylistTracks, setShowPlaylistTracks] = useState(false);
  const [isLoadingPopularPlaylist, setIsLoadingPopularPlaylist] = useState(false);
  
  // États pour le sondage
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [showPollInPost, setShowPollInPost] = useState(false);
  
  // Données musique
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [trendingTracks, setTrendingTracks] = useState<JamendoTrack[]>([]);
  const [searchResults, setSearchResults] = useState<JamendoTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les tracks tendances au montage
  useEffect(() => {
    const loadTrending = async () => {
      try {
        const tracks = await getTrendingTracks(15);
        setTrendingTracks(tracks);
      } catch (error) {
        console.error('Erreur chargement tendances:', error);
      }
    };
    loadTrending();
  }, []);

  // Arrêter la musique en cours au montage de la page
  useEffect(() => {
    pause();
  }, [pause]);

  // Rediriger si non authentifié
  if (!isAuthenticated || !user) {
    if (typeof window !== 'undefined') {
      router.replace('/');
    }
    return null;
  }

  // Validation du post - au moins du contenu OU une pièce jointe
  const hasContent = content.trim().length > 0;
  const hasAttachment = attachedTracks.length > 0 || attachedPlaylist !== null || attachedEvent !== null || showPollInPost;
  const canSubmit = hasContent || hasAttachment;

  // Soumission du post
  const handleSubmit = () => {
    if (!canSubmit || isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Préparer les données
    const tracksData = attachedTracks.length > 0 
      ? attachedTracks.map(t => ({ id: t.id, name: t.name, artist: t.artist_name, artist_id: t.artist_id, image: t.image, audio: t.audio }))
      : null;
    
    const playlistData = attachedPlaylist 
      ? { 
          id: attachedPlaylist.id, 
          name: attachedPlaylist.name, 
          coverImage: attachedPlaylist.coverImage,
          tracks: attachedPlaylist.tracks?.map(t => ({
            id: t.id,
            name: t.name,
            artist_name: t.artist_name,
            image: t.image,
            album_image: t.album_image,
            duration: t.duration,
            audio: t.audio,
            artist_id: t.artist_id
          }))
        }
      : null;
    
    const eventData = attachedEvent 
      ? { 
          id: attachedEvent.id, 
          name: attachedEvent.name, 
          artist: attachedEvent.artist, 
          artist_id: attachedEvent.artist_id,
          venue: attachedEvent.venue, 
          city: attachedEvent.city, 
          date: attachedEvent.date, 
          price: attachedEvent.price, 
          category: attachedEvent.category 
        }
      : null;
    
    const pollData = showPollInPost && pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2
      ? { question: pollQuestion, options: pollOptions.filter(o => o.trim()) }
      : null;

    // Appeler addUserPost
    addUserPost(
      user.username,
      user.image || '/avatar1.jpg',
      content,
      tracksData,
      playlistData,
      eventData,
      pollData
    );
    
    // Rediriger vers le feed
    router.push('/');
  };

  // Liste des favoris (extraite des playlists)
  const favoriteTracks = playlists.find(p => p.id === FAVORITES_PLAYLIST_ID)?.tracks || [];

  // Tracks à afficher selon l'onglet
  const getDisplayedTracks = (): JamendoTrack[] => {
    if (musicSearchQuery.trim().length >= 2) {
      return searchResults;
    }
    switch (musicTab) {
      case 'foryou':
        return history.slice(0, 10);
      case 'trending':
        return trendingTracks;
      case 'favorites':
        return favoriteTracks;
      default:
        return [];
    }
  };

  const handleMusicSearch = async (query: string) => {
    setMusicSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchTracks(query, 15);
        setSearchResults(results);
      } catch (error) {
        console.error('Erreur recherche:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Clic sur un son = lancer la lecture + afficher mini player
  const handlePreviewTrack = (track: JamendoTrack) => {
    setPreviewTrack(track);
    playTrack(track);
  };

  // Clic sur la flèche = confirmer l'ajout au post
  const handleConfirmTrack = () => {
    if (previewTrack) {
      pause(); // Arrêter la musique
      // Vérifier si la track n'est pas déjà ajoutée
      if (!attachedTracks.some(t => t.id === previewTrack.id)) {
        setAttachedTracks(prev => [...prev, previewTrack]);
      }
      setAttachedPlaylist(null); // Une seule pièce jointe playlist à la fois
      setPreviewTrack(null);
      setToolsMode('hidden');
      setMusicSearchQuery('');
      setSearchResults([]);
    }
  };

  // Toggle play/pause sur le mini player
  const handleTogglePlay = () => {
    if (isPlaying && currentTrack?.id === previewTrack?.id) {
      pause();
    } else if (previewTrack) {
      playTrack(previewTrack);
    }
  };

  const handleSelectPlaylist = (playlist: { id: string; name: string; coverImage: string; tracks?: JamendoTrack[] }) => {
    setAttachedPlaylist(playlist);
    setAttachedTracks([]); // Vider les tracks si on ajoute une playlist
    setSelectedPlaylistPreview(null); // Reset preview
    setShowPlaylistTracks(false);
    setShowAttachedPlaylistTracks(false);
    setToolsMode('hidden');
  };

  const handlePreviewPlaylist = async (playlist: any) => {
    // Si c'est une playlist user avec tracks, on les a déjà
    if ('tracks' in playlist) {
      setSelectedPlaylistPreview(playlist);
      setShowPlaylistTracks(false);
      return;
    }
    
    // Sinon, c'est une playlist populaire, on charge les tracks
    setSelectedPlaylistPreview({ ...playlist, tracks: [] }); // Afficher immédiatement avec loading
    setIsLoadingPopularPlaylist(true);
    setShowPlaylistTracks(false);
    
    try {
      const seed = playlist.id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const allTracks = await getPopularTracks(50);
      
      // Mélanger les tracks de manière déterministe basée sur l'ID
      const shuffled = [...allTracks].sort((a, b) => {
        const hashA = (parseInt(a.id) * seed) % 100;
        const hashB = (parseInt(b.id) * seed) % 100;
        return hashA - hashB;
      });
      
      const count = playlist.trackCount || 20;
      const loadedTracks = shuffled.slice(0, Math.min(count, shuffled.length));
      
      setSelectedPlaylistPreview({ ...playlist, tracks: loadedTracks });
    } catch (error) {
      console.error('Erreur chargement tracks playlist:', error);
    } finally {
      setIsLoadingPopularPlaylist(false);
    }
  };

  const handleConfirmPlaylist = () => {
    if (selectedPlaylistPreview) {
      handleSelectPlaylist({
        id: selectedPlaylistPreview.id,
        name: selectedPlaylistPreview.name,
        coverImage: selectedPlaylistPreview.coverImage || '/albumCoverExample.png',
        tracks: 'tracks' in selectedPlaylistPreview ? selectedPlaylistPreview.tracks : undefined,
      });
    }
  };

  // Play la playlist (première track ou toutes)
  const playPlaylistPreview = () => {
    if (selectedPlaylistPreview && 'tracks' in selectedPlaylistPreview && selectedPlaylistPreview.tracks.length > 0) {
      playTrack(selectedPlaylistPreview.tracks[0], selectedPlaylistPreview.tracks);
    }
  };

  const removeTrack = (trackId: string) => {
    // Si la track supprimée est en cours de lecture, l'arrêter
    if (currentTrack?.id === trackId) {
      pause();
    }
    setAttachedTracks(prev => prev.filter(t => t.id !== trackId));
  };

  const removeAttachment = () => {
    // Arrêter la musique si une track attachée ou de la playlist est en lecture
    if (attachedTracks.some(t => t.id === currentTrack?.id) ||
        (attachedPlaylist?.tracks && attachedPlaylist.tracks.some(t => t.id === currentTrack?.id))) {
      pause();
    }
    setAttachedTracks([]);
    setAttachedPlaylist(null);
    setAttachedEvent(null);
    setShowAttachedPlaylistTracks(false);
  };

  // Fermer le panel musique proprement
  const closeMusicPanel = () => {
    pause(); // Arrêter la musique
    setPreviewTrack(null); // Reset preview
    setToolsMode('hidden');
    setMusicSearchQuery('');
    setSearchResults([]);
  };

  const displayedTracks = getDisplayedTracks();

  // Playlists à afficher selon l'onglet
  const getDisplayedPlaylists = () => {
    switch (playlistTab) {
      case 'mine':
        return playlists;
      case 'popular':
        return SAMPLE_PUBLIC_PLAYLISTS;
      default:
        return [];
    }
  };

  const displayedPlaylists = getDisplayedPlaylists();

  return (
    <main className="h-screen flex flex-col bg-gray-50/95">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50/95 sticky top-0 z-10 rounded-b-2xl">
        <button 
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={24} className="text-gray-700" />
        </button>
        
        <h1 className="font-bold text-lg text-gray-900">Créer un post</h1>
        
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`px-4 py-1.5 rounded-full font-semibold transition-all ${
            canSubmit
              ? 'bg-(--brown) text-(--text-color) hover:opacity-90'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? '...' : 'Poster'}
        </button>
      </header>

      {/* Contenu principal */}
      <div className="flex-grow overflow-y-auto bg-(--background-white)" onClick={() => { if (toolsMode === 'music') closeMusicPanel(); else setToolsMode('hidden'); }}>
        <div className="p-4">
          {/* Profil utilisateur */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image
                src={user.image || '/photoProfil.png'}
                alt={user.displayName}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <p className="font-semibold text-gray-900">{user.displayName}</p>
          </div>

          {/* Zone de texte */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Quoi de neuf ?"
            className="w-full min-h-[100px] text-gray-900 placeholder-gray-400 resize-none focus:outline-none text-base"
            autoFocus
          />

          {/* Pièces jointes : Tracks - Style harmonisé avec navbar */}
          {attachedTracks.map((track) => (
            <div key={track.id} className="mt-3 bg-[#3d3525]/90 backdrop-blur-xl rounded-2xl p-3 flex items-center gap-3 border border-white/10 shadow-lg">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
                <Image
                  src={track.album_image || track.image || '/albumCoverExample.png'}
                  alt={track.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="flex-grow min-w-0">
                <p className="font-medium text-(--text-color) truncate text-sm">{track.name}</p>
                <p className="text-xs text-gray-400 truncate">{track.artist_name}</p>
              </div>
              {/* Bouton Play/Pause */}
              <button 
                onClick={() => {
                  if (isPlaying && currentTrack?.id === track.id) {
                    pause();
                  } else {
                    playTrack(track);
                  }
                }}
                className="p-2.5 bg-(--text-color) rounded-full text-(--background-brown) hover:scale-105 transition-transform flex-shrink-0"
              >
                {isPlaying && currentTrack?.id === track.id ? (
                  <Pause size={16} fill="currentColor" />
                ) : (
                  <Play size={16} fill="currentColor" />
                )}
              </button>
              {/* Bouton Supprimer */}
              <button 
                onClick={() => removeTrack(track.id)}
                className="w-7 h-7 rounded-full bg-gray-600/80 hover:bg-gray-500 flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <X size={14} className="text-white" strokeWidth={2.5} />
              </button>
            </div>
          ))}

          {/* Pièce jointe : Playlist - Style exact du design */}
          {attachedPlaylist && (
            <div className="mt-3 bg-[#3d3525]/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg overflow-hidden">
              {/* Header avec infos playlist + boutons */}
              <div className="p-4 flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-lg bg-black/20">
                  {attachedPlaylist.tracks && attachedPlaylist.tracks.length > 0 ? (
                    <PlaylistCoverGrid 
                      tracks={attachedPlaylist.tracks} 
                      size={56} 
                      isFavorites={attachedPlaylist.id === FAVORITES_PLAYLIST_ID}
                    />
                  ) : (
                    <Image
                      src={attachedPlaylist.coverImage}
                      alt={attachedPlaylist.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-bold text-(--text-color) truncate">{attachedPlaylist.name}</p>
                  <p className="text-sm text-gray-400 truncate">
                    {attachedPlaylist.tracks ? `${attachedPlaylist.tracks.length} musiques` : 'Playlist'}
                  </p>
                </div>
                {/* Bouton Play/Pause - Grand et cream */}
                {attachedPlaylist.tracks && attachedPlaylist.tracks.length > 0 && (
                  <button 
                    onClick={() => {
                      if (isPlaying && attachedPlaylist.tracks!.some((t) => t.id === currentTrack?.id)) {
                        pause();
                      } else {
                        playTrack(attachedPlaylist.tracks![0], attachedPlaylist.tracks!);
                      }
                    }}
                    className="w-10 h-10 bg-(--text-color) rounded-full text-(--background-brown) hover:scale-105 transition-transform flex-shrink-0 flex items-center justify-center"
                  >
                    {isPlaying && attachedPlaylist.tracks.some((t) => t.id === currentTrack?.id) ? (
                      <Pause size={20} fill="currentColor" />
                    ) : (
                      <Play size={20} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>
                )}
                {/* Bouton Supprimer - Cream avec X dark */}
                <button 
                  onClick={removeAttachment}
                  className="w-8 h-8 rounded-full bg-(--text-color) hover:bg-(--text-color)/90 flex items-center justify-center flex-shrink-0 transition-colors"
                >
                  <X size={16} className="text-(--background-brown)" strokeWidth={2.5} />
                </button>
              </div>

              {/* Toggle "Voir les musiques" - Bouton pill avec marges */}
              {attachedPlaylist.tracks && attachedPlaylist.tracks.length > 0 && (
                <div className="px-4 pb-4">
                  <button
                    onClick={() => setShowAttachedPlaylistTracks(!showAttachedPlaylistTracks)}
                    className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-(--text-color) text-sm font-medium flex items-center justify-center gap-1.5 transition-colors rounded-full"
                  >
                    {showAttachedPlaylistTracks ? 'Cacher les musiques' : 'Voir les musiques'} 
                    <ChevronUp size={16} className={`transition-transform ${showAttachedPlaylistTracks ? '' : 'rotate-180'}`} />
                  </button>
                </div>
              )}

              {/* Liste des musiques - Style TrackCard avec interaction */}
              {showAttachedPlaylistTracks && attachedPlaylist.tracks && (
                <div className="max-h-[220px] overflow-y-auto bg-[#3d3525]/80 backdrop-blur-xl px-2 pb-3">
                  {attachedPlaylist.tracks.map((track, index) => {
                    const isCurrentTrackActive = currentTrack?.id === track.id;
                    const isCurrentlyPlaying = isCurrentTrackActive && isPlaying;
                    
                    return (
                      <div 
                        key={track.id} 
                        onClick={() => {
                          if (isCurrentlyPlaying) {
                            pause();
                          } else {
                            playTrack(track, attachedPlaylist.tracks!);
                          }
                        }}
                        className={`flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group ${
                          isCurrentTrackActive ? 'bg-white/5' : ''
                        }`}
                      >
                        {/* Index ou bouton play */}
                        <div className="w-6 flex justify-center flex-shrink-0">
                          <span className={`text-sm group-hover:hidden ${isCurrentTrackActive ? 'text-(--yellow)' : 'text-gray-400'}`}>
                            {index + 1}
                          </span>
                          <button className="hidden group-hover:block text-(--text-color)">
                            {isCurrentlyPlaying ? (
                              <Pause size={16} fill="currentColor" />
                            ) : (
                              <Play size={16} fill="currentColor" />
                            )}
                          </button>
                        </div>

                        {/* Cover de l'album */}
                        <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden">
                          <Image
                            src={track.album_image || track.image || '/albumCoverExample.png'}
                            alt={track.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>

                        {/* Infos de la piste */}
                        <div className="flex-grow min-w-0">
                          <p className={`font-medium text-sm truncate ${isCurrentTrackActive ? 'text-(--yellow)' : 'text-(--text-color)'}`}>
                            {track.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {track.artist_name}
                          </p>
                        </div>

                        {/* Durée */}
                        <span className="text-sm text-gray-400 flex-shrink-0">
                          {formatDuration(track.duration)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Pièce jointe : Événement */}
          {attachedEvent && (
            <div className="mt-3 bg-[#3d3525]/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg overflow-hidden">
              <div className="p-3 flex items-stretch gap-3">
                {/* Image de l'événement - pleine hauteur */}
                <div className="relative w-20 self-stretch rounded-xl overflow-hidden flex-shrink-0 shadow-lg bg-black/20">
                  <Image
                    src={'/event.png'}
                    alt={attachedEvent.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                
                {/* Infos événement */}
                <div className="flex-grow min-w-0 flex flex-col justify-center">
                  <p className="font-bold text-(--text-color) truncate">{attachedEvent.name}</p>
                  <p className="text-sm text-gray-400 truncate">{attachedEvent.artist}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <span className="bg-white/10 px-2 py-0.5 rounded">{getCategoryLabel(attachedEvent.category)}</span>
                    <span>{formatEventDate(attachedEvent.date)}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                    <MapPin size={12} />
                    <span className="truncate">{attachedEvent.venue}, {attachedEvent.city}</span>
                  </div>
                </div>
                
                {/* Prix + Bouton Supprimer */}
                <div className="flex flex-col items-end justify-between flex-shrink-0">
                  <span className="text-sm font-semibold text-(--yellow)">{attachedEvent.price}</span>
                  <button 
                    onClick={() => setAttachedEvent(null)}
                    className="w-8 h-8 rounded-full bg-(--text-color) hover:bg-(--text-color)/90 flex items-center justify-center transition-colors"
                  >
                    <X size={16} className="text-(--background-brown)" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pièce jointe : Sondage */}
          {showPollInPost && (
            <div className="mt-3 bg-[#3d3525]/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg overflow-hidden p-4">
              {/* Header avec question et X */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-grow min-w-0 overflow-hidden">
                  <p className="text-xs text-gray-400 mb-1">📊 Sondage</p>
                  <p className="font-bold text-(--text-color) break-all">{pollQuestion}</p>
                </div>
                <button 
                  onClick={() => {
                    setShowPollInPost(false);
                    setPollQuestion('');
                    setPollOptions(['', '']);
                  }}
                  className="w-8 h-8 rounded-full bg-(--text-color) hover:bg-(--text-color)/90 flex items-center justify-center flex-shrink-0 transition-colors ml-3"
                >
                  <X size={16} className="text-(--background-brown)" strokeWidth={2.5} />
                </button>
              </div>
              
              {/* Options */}
              <div className="space-y-2">
                {pollOptions.filter(o => o.trim()).map((option, index) => (
                  <div 
                    key={index}
                    className="bg-white/10 rounded-xl px-4 py-2.5 text-(--text-color) text-sm"
                  >
                    {option}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panneau sélection musique - Style bottom sheet comme comments modal */}
      {toolsMode === 'music' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 transition-opacity duration-300"
            onClick={closeMusicPanel}
          />
          
          {/* Bottom Sheet */}
          <div 
            className="relative w-full max-w-[var(--app-max-width)] h-[70vh] bg-white rounded-t-3xl flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            
            {/* Header avec bouton X */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200">
              <div />
              <h3 className="font-bold text-base text-gray-900">Ajouter un son</h3>
              <button 
                onClick={closeMusicPanel}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            {/* Barre de recherche */}
            <div className="px-4 py-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={musicSearchQuery}
                  onChange={(e) => handleMusicSearch(e.target.value)}
                  placeholder="Recherchez un son"
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>

          {/* Onglets */}
          {musicSearchQuery.length < 2 && (
            <div className="flex gap-2 px-4 pb-3 justify-center">
              <button
                onClick={() => setMusicTab('foryou')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  musicTab === 'foryou' 
                    ? 'bg-(--brown) text-(--text-color)' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                Pour Toi
              </button>
              <button
                onClick={() => setMusicTab('trending')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  musicTab === 'trending' 
                    ? 'bg-(--brown) text-(--text-color)' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                Tendances
              </button>
              <button
                onClick={() => setMusicTab('favorites')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  musicTab === 'favorites' 
                    ? 'bg-(--brown) text-(--text-color)' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                Favoris
              </button>
            </div>
          )}

          {/* Liste des tracks */}
          <div className="flex-grow overflow-y-auto px-4 pb-4">
            {isSearching ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-(--brown)"></div>
              </div>
            ) : displayedTracks.length > 0 ? (
              <div className="space-y-1">
                {displayedTracks.map((track) => (
                                    <div
                    key={track.id}
                    onClick={() => handlePreviewTrack(track)}
                    className="w-full flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={track.album_image || track.image || '/albumCoverExample.png'}
                        alt={track.name}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-semibold text-gray-900 truncate text-sm">{track.name}</p>
                      <p className="text-xs text-gray-500 truncate">{track.artist_name} • {formatDuration(track.duration)}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(track);
                      }}
                      className="p-1 flex-shrink-0 hover:scale-110 transition-transform"
                    >
                      <Heart 
                        size={20} 
                        className={isTrackFavorite(track.id) ? 'text-red-500 fill-red-500' : 'text-gray-400'}
                      />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8 text-sm">
                {musicTab === 'foryou' && history.length === 0 ? 'Écoute des morceaux pour les voir ici' :
                 musicTab === 'favorites' && favoriteTracks.length === 0 ? 'Aucun favori' :
                 musicSearchQuery.length >= 2 ? 'Aucun résultat' : 'Chargement...'}
              </p>
            )}
          </div>

          {/* Mini player prévisualisation - Style harmonisé avec navbar */}
          {previewTrack && (
            <div className="absolute bottom-0 left-0 right-0 bg-[#3d3525]/95 backdrop-blur-xl p-3 flex items-center gap-3 rounded-2xl shadow-2xl mx-2 mb-2 border border-white/10">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
                <Image
                  src={previewTrack.album_image || previewTrack.image || '/albumCoverExample.png'}
                  alt={previewTrack.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="flex-grow min-w-0">
                <p className="font-medium text-(--text-color) truncate text-sm">{previewTrack.name}</p>
                <p className="text-xs text-gray-400 truncate">{previewTrack.artist_name}</p>
              </div>
              {/* Bouton Play/Pause */}
              <button 
                onClick={handleTogglePlay}
                className="p-2.5 bg-(--text-color) rounded-full text-(--background-brown) hover:scale-105 transition-transform flex-shrink-0"
              >
                {isPlaying && currentTrack?.id === previewTrack.id ? (
                  <Pause size={16} fill="currentColor" />
                ) : (
                  <Play size={16} fill="currentColor" />
                )}
              </button>
              {/* Bouton Ajouter au post */}
              <button 
                onClick={handleConfirmTrack}
                className="w-9 h-9 rounded-full border-2 border-(--text-color) text-(--text-color) hover:bg-(--text-color)/10 flex items-center justify-center flex-shrink-0 transition-colors"
                title="Ajouter au post"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Panneau sélection playlist - Style bottom sheet */}
      {toolsMode === 'playlist' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 transition-opacity duration-300"
            onClick={() => { setToolsMode('hidden'); setSelectedPlaylistPreview(null); }}
          />
          
          {/* Bottom Sheet */}
          <div 
            className="relative w-full max-w-[var(--app-max-width)] h-[70vh] bg-white rounded-t-3xl flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            
            {/* Vue conditionnelle : grille ou détail */}
            {!selectedPlaylistPreview ? (
              <>
                {/* Header avec bouton X */}
                <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200">
                  <div />
                  <h3 className="font-bold text-base text-gray-900">Ajouter une playlist</h3>
                  <button 
                    onClick={() => setToolsMode('hidden')}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
                
                {/* Onglets */}
                <div className="flex gap-2 px-4 py-3 justify-center">
                  <button
                    onClick={() => setPlaylistTab('mine')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      playlistTab === 'mine' 
                        ? 'bg-(--brown) text-(--text-color)' 
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    Mes Playlists
                  </button>
                  <button
                    onClick={() => setPlaylistTab('popular')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      playlistTab === 'popular' 
                        ? 'bg-(--brown) text-(--text-color)' 
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    Populaires
                  </button>
                </div>
                
                {/* Grille des playlists */}
                <div className="flex-grow overflow-y-auto px-4 pb-4">
                  {displayedPlaylists.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {displayedPlaylists.map((playlist) => (
                        <button
                          key={playlist.id}
                          onClick={() => handlePreviewPlaylist(playlist)}
                          className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden mb-2 bg-gray-100">
                            {playlistTab === 'mine' && 'tracks' in playlist ? (
                              <PlaylistCoverGrid
                                tracks={playlist.tracks}
                                size={80}
                                isFavorites={playlist.id === FAVORITES_PLAYLIST_ID}
                              />
                            ) : (
                              <Image
                                src={playlist.coverImage || '/albumCoverExample.png'}
                                alt={playlist.name}
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <span className="text-xs text-center text-gray-700 truncate w-full">{playlist.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-8 text-sm">
                      {playlistTab === 'mine' ? 'Aucune playlist' : 'Chargement...'}
                    </p>
                  )}
                </div>
              </>
            ) : (
              /* Vue détaillée de la playlist sélectionnée */
              <div className="flex-grow flex flex-col overflow-hidden">
                {/* Header blanc avec retour et bouton ajouter */}
                <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200">
                  <button 
                    onClick={() => setSelectedPlaylistPreview(null)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <ChevronUp size={20} className="text-gray-500 -rotate-90" />
                  </button>
                  <h3 className="font-bold text-base text-gray-900 truncate max-w-[180px]">{selectedPlaylistPreview.name}</h3>
                  <button
                    onClick={handleConfirmPlaylist}
                    className="flex items-center gap-1 px-3 py-1.5 bg-(--yellow) text-(--background-brown) rounded-full font-semibold hover:opacity-90 transition-opacity text-sm"
                  >
                    <Plus size={14} />
                    Ajouter
                  </button>
                </div>

                {/* Section cover et infos - White theme */}
                <div className="px-4 py-4 border-b border-gray-200">
                  <div className="flex gap-4 items-center">
                    {/* Cover */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-lg flex-shrink-0 bg-gray-100">
                      {playlistTab === 'mine' && 'tracks' in selectedPlaylistPreview ? (
                        <PlaylistCoverGrid 
                          tracks={selectedPlaylistPreview.tracks} 
                          size={64} 
                          isFavorites={selectedPlaylistPreview.id === FAVORITES_PLAYLIST_ID}
                        />
                      ) : (
                        <Image
                          src={selectedPlaylistPreview.coverImage || '/albumCoverExample.png'}
                          alt={selectedPlaylistPreview.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    
                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">
                        Playlist • {'tracks' in selectedPlaylistPreview 
                          ? `${selectedPlaylistPreview.tracks.length} titres` 
                          : `${selectedPlaylistPreview.trackCount} titres`}
                      </p>
                      <p className="font-semibold text-gray-900 truncate">{selectedPlaylistPreview.name}</p>
                    </div>
                  </div>
                </div>

                {/* Liste des tracks - White theme */}
                <div className="flex-grow overflow-y-auto bg-white">
                  {'tracks' in selectedPlaylistPreview ? (
                    selectedPlaylistPreview.tracks.length > 0 ? (
                      <div className="space-y-1 px-2 py-2">
                        {selectedPlaylistPreview.tracks.map((track: JamendoTrack, index: number) => {
                          const isCurrentTrackPlaying = currentTrack?.id === track.id;
                          
                          return (
                            <button 
                              key={track.id}
                              onClick={() => {
                                if (isCurrentTrackPlaying && isPlaying) {
                                  pause();
                                } else {
                                  playTrack(track, selectedPlaylistPreview.tracks);
                                }
                              }}
                              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                                isCurrentTrackPlaying 
                                  ? 'bg-(--yellow)/20' 
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              {/* Numéro ou indicateur de lecture */}
                              <div className="w-5 text-center flex-shrink-0">
                                {isCurrentTrackPlaying && isPlaying ? (
                                  <div className="flex items-center justify-center gap-0.5">
                                    <span className="w-0.5 h-3 bg-(--brown) animate-pulse"></span>
                                    <span className="w-0.5 h-4 bg-(--brown) animate-pulse delay-75"></span>
                                    <span className="w-0.5 h-2 bg-(--brown) animate-pulse delay-150"></span>
                                  </div>
                                ) : (
                                  <span className={`text-sm ${isCurrentTrackPlaying ? 'text-(--brown)' : 'text-gray-500'}`}>
                                    {index + 1}
                                  </span>
                                )}
                              </div>
                              
                              {/* Cover */}
                              <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                                <Image
                                  src={track.album_image || track.image || '/albumCoverExample.png'}
                                  alt={track.name}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              </div>
                              
                              {/* Infos track */}
                              <div className="flex-grow min-w-0 text-left">
                                <p className={`font-medium text-sm truncate ${isCurrentTrackPlaying ? 'text-(--brown)' : 'text-gray-900'}`}>
                                  {track.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {track.artist_name} • {formatDuration(track.duration)}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400">Cette playlist est vide</p>
                      </div>
                    )
                  ) : isLoadingPopularPlaylist ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin w-8 h-8 border-3 border-gray-300 border-t-(--brown) rounded-full"></div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">Chargement...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Panneau sélection événement */}
      {toolsMode === 'event' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 transition-opacity duration-300"
            onClick={() => setToolsMode('hidden')}
          />
          
          {/* Bottom Sheet */}
          <div 
            className="relative w-full max-w-[var(--app-max-width)] h-[70vh] bg-white rounded-t-3xl flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            
            {/* Header avec titre et X */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200">
              <div />
              <h3 className="font-bold text-base text-gray-900">Lier un événement</h3>
              <button 
                onClick={() => setToolsMode('hidden')}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Liste des événements */}
            <div className="flex-grow overflow-y-auto px-4 py-4">
              <div className="space-y-3">
                {SAMPLE_EVENTS.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => {
                      setAttachedEvent(event);
                      setAttachedTracks([]);
                      setAttachedPlaylist(null);
                      setToolsMode('hidden');
                    }}
                    className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left border border-gray-100"
                  >
                    <div className="relative w-20 self-stretch rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={'/event.png'}
                        alt={event.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{event.name}</p>
                      <p className="text-sm text-gray-600 truncate">{event.artist}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span className="bg-gray-100 px-2 py-0.5 rounded">{getCategoryLabel(event.category)}</span>
                        <span>{formatEventDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <MapPin size={12} />
                        <span className="truncate">{event.venue}, {event.city}</span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 text-right">
                      <span className="text-sm font-semibold text-(--brown)">{event.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panneau création sondage */}
      {toolsMode === 'poll' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 transition-opacity duration-300"
            onClick={() => setToolsMode('hidden')}
          />
          
          {/* Bottom Sheet */}
          <div 
            className="relative w-full max-w-[var(--app-max-width)] max-h-[80vh] bg-white rounded-t-3xl flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            
            {/* Header avec titre et boutons */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200">
              <button 
                onClick={() => setToolsMode('hidden')}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
              <h3 className="font-bold text-base text-gray-900">Créer un sondage</h3>
              <button 
                onClick={() => {
                  if (pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2) {
                    setShowPollInPost(true);
                    setAttachedTracks([]);
                    setAttachedPlaylist(null);
                    setAttachedEvent(null);
                    setToolsMode('hidden');
                  }
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2
                    ? 'bg-(--brown) text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
              >
                Ajouter
              </button>
            </div>

            {/* Contenu */}
            <div className="flex-grow overflow-y-auto p-4 space-y-6">
              {/* Question */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-900">Votre question</label>
                  <span className="text-xs text-gray-400">{pollQuestion.length}/300</span>
                </div>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => e.target.value.length <= 300 && setPollQuestion(e.target.value)}
                  placeholder="Quelle question veux-tu poser ?"
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-(--brown)/30"
                />
              </div>
              
              {/* Réponses */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Réponses</label>
                <div className="space-y-3">
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...pollOptions];
                          newOptions[index] = e.target.value;
                          setPollOptions(newOptions);
                        }}
                        placeholder="Entrez une réponse"
                        className="flex-grow px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-(--brown)/30"
                      />
                      <button
                        onClick={() => {
                          if (pollOptions.length > 2) {
                            const newOptions = pollOptions.filter((_, i) => i !== index);
                            setPollOptions(newOptions);
                          }
                        }}
                        className={`p-2.5 rounded-xl transition-colors ${pollOptions.length > 2 ? 'text-(--brown) hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
                        disabled={pollOptions.length <= 2}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Bouton ajouter réponse */}
                {pollOptions.length < 4 && (
                  <button
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    className="mt-4 w-full py-3 border border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    + Ajouter une autre réponse
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barre d'outils - Style navbar en bas */}
      {(toolsMode === 'hidden' || toolsMode === 'expanded') && (
        <div className="border-t border-gray-200 bg-white rounded-t-2xl">
          {/* Panel expanded avec grille d'options */}
          {toolsMode === 'expanded' && (
            <div className="px-4 py-4 border-b border-gray-100">
              <p className="text-center text-gray-700 font-medium mb-4">Ajouter à votre post</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setToolsMode('music')}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <Music size={24} className="text-(--brown)" />
                  <span className="text-gray-700 text-sm">Ajouter un son</span>
                  <Plus size={16} className="text-gray-400 ml-auto" />
                </button>
                <button 
                  onClick={() => setToolsMode('playlist')}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <ListMusic size={24} className="text-(--brown)" />
                  <span className="text-gray-700 text-sm">Ajouter une playlist</span>
                  <Plus size={16} className="text-gray-400 ml-auto" />
                </button>
                <button 
                  onClick={() => setToolsMode('poll')}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <Plus size={24} className="text-(--brown)" />
                  <span className="text-gray-700 text-sm">Créer un sondage</span>
                  <Plus size={16} className="text-gray-400 ml-auto" />
                </button>
                <button 
                  onClick={() => setToolsMode('event')}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <CalendarDays size={24} className="text-(--brown)" />
                  <span className="text-gray-700 text-sm">Lier un événement</span>
                  <Plus size={16} className="text-gray-400 ml-auto" />
                </button>
              </div>
            </div>
          )}
          
          {/* Ligne d'icônes avec ChevronUp */}
          <div className="py-3 px-6 flex items-center justify-between">
            {/* Icônes rapides - Masquées quand expanded */}
            {toolsMode !== 'expanded' ? (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setToolsMode('music'); }}
                  className={`p-2 rounded-lg transition-colors ${attachedTracks.length > 0 ? 'text-(--brown)' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Music size={26} />
                </button>
                
                <button
                  onClick={(e) => { e.stopPropagation(); setToolsMode('playlist'); }}
                  className={`p-2 rounded-lg transition-colors ${attachedPlaylist ? 'text-(--brown)' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <ListMusic size={26} />
                </button>
                
                <button
                  onClick={(e) => { e.stopPropagation(); setToolsMode('poll'); }}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Plus size={26} />
                </button>
                
                <button
                  onClick={(e) => { e.stopPropagation(); setToolsMode('event'); }}
                  className={`p-2 rounded-lg transition-colors ${attachedEvent ? 'text-(--brown)' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <CalendarDays size={26} />
                </button>
              </>
            ) : (
              <div className="flex-grow" />
            )}
            
            {/* Bouton expand - toujours visible */}
            <button 
              onClick={(e) => { e.stopPropagation(); setToolsMode(toolsMode === 'expanded' ? 'hidden' : 'expanded'); }}
              className={`p-2 rounded-lg transition-colors ${toolsMode === 'expanded' ? 'bg-gray-100' : ''} text-gray-600 hover:bg-gray-100`}
            >
              <ChevronUp size={26} className={`transition-transform ${toolsMode === 'expanded' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
