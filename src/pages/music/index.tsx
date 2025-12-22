import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Plus, MoreVertical, User, Calendar, MapPin, Check, CheckCircle } from 'lucide-react';
import { NavBar } from '@/ui/navBar';
import { TrackCard } from '@/ui/trackCard';
import { AlbumCard } from '@/ui/albumCard';
import { PlaylistCard } from '@/ui/playlistCard';
import { CreatePlaylistModal } from '@/ui/createPlaylistModal';
import { AddToPlaylistModal } from '@/ui/addToPlaylistModal';
import { PageHeader } from '@/ui/PageHeader';
import { JamendoTrack, JamendoAlbum, JamendoArtist } from '@/lib/types';
import { getPopularTracks, getPopularAlbums, getTracksByArtist, getTrendingTracks, getPopularArtists, MUSIC_TAGS, formatDuration } from '@/lib/jamendoApi';
import { usePlayer } from '@/lib/playerContext';
import { usePlaylist, FAVORITES_PLAYLIST_ID } from '@/lib/playlistContext';
import { useBodyTheme } from '@/lib/useBodyTheme';
import { SAMPLE_EVENTS, SAMPLE_PUBLIC_PLAYLISTS, formatEventDate, getCategoryLabel } from '@/lib/sampleEvents';

// Cache localStorage pour les recommandations
const RECOMMENDATIONS_CACHE_KEY = 'musiverse_recommendations';
const RECOMMENDATIONS_HASH_KEY = 'musiverse_recommendations_hash';

function generateLikesHash(tracks: JamendoTrack[]): string {
  return tracks.map(t => t.id).sort().join(',');
}

function getCachedRecommendations(): JamendoTrack[] | null {
  try {
    const cached = localStorage.getItem(RECOMMENDATIONS_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch { return null; }
}

function setCachedRecommendations(tracks: JamendoTrack[], hash: string): void {
  try {
    localStorage.setItem(RECOMMENDATIONS_CACHE_KEY, JSON.stringify(tracks));
    localStorage.setItem(RECOMMENDATIONS_HASH_KEY, hash);
  } catch { /* ignore */ }
}

function getCachedHash(): string | null {
  return localStorage.getItem(RECOMMENDATIONS_HASH_KEY);
}

export default function MusicPage() {
  const router = useRouter();
  const [popularTracks, setPopularTracks] = useState<JamendoTrack[]>([]);
  const [popularAlbums, setPopularAlbums] = useState<JamendoAlbum[]>([]);
  const [popularArtists, setPopularArtists] = useState<JamendoArtist[]>([]);
  const [forYouTracks, setForYouTracks] = useState<JamendoTrack[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<JamendoTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'music' | 'playlists' | 'artists' | 'events'>('all');
  
  // Modals
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<JamendoTrack | null>(null);

  const { playTrack, currentTrack, history, isPlaying, pause, tracklist, currentSourceId } = usePlayer();
  const { playlists, createPlaylist } = usePlaylist();
  
  // Appliquer le thème dark sur body pour le gradient étendu
  useBodyTheme('dark');

  // Lire le tab depuis l'URL au chargement
  useEffect(() => {
    const tabFromUrl = router.query.tab;
    if (tabFromUrl === 'music' || tabFromUrl === 'playlists' || tabFromUrl === 'artists' || tabFromUrl === 'events' || tabFromUrl === 'all') {
      setActiveTab(tabFromUrl);
    }
  }, [router.query.tab]);

  // Fonction pour changer de tab et mettre à jour l'URL
  const handleTabChange = (tab: 'all' | 'music' | 'playlists' | 'artists' | 'events') => {
    setActiveTab(tab);
    router.replace({
      pathname: router.pathname,
      query: tab === 'all' ? {} : { tab }
    }, undefined, { shallow: true });
  };

  // Récupérer les titres likés
  const likedTracks = useMemo(() => {
    const favorites = playlists.find(p => p.id === FAVORITES_PLAYLIST_ID);
    return favorites?.tracks || [];
  }, [playlists]);

  const likedArtists = useMemo(() => {
    return [...new Set(likedTracks.map(t => t.artist_name))];
  }, [likedTracks]);

  const currentHash = useMemo(() => generateLikesHash(likedTracks), [likedTracks]);

  // Charger les recommandations
  const loadForYou = useCallback(async () => {
    const cachedHash = getCachedHash();
    const cached = getCachedRecommendations();
    
    if (cached && cached.length > 0 && cachedHash === currentHash) {
      setForYouTracks(cached);
      return;
    }

    try {
      let tracks: JamendoTrack[] = [];
      if (likedArtists.length > 0) {
        const artistsToFetch = likedArtists.slice(0, 5);
        const results = await Promise.all(
          artistsToFetch.map(a => getTracksByArtist(a, 6).catch(() => []))
        );
        const likedIds = new Set(likedTracks.map(t => t.id));
        const allTracks = results.flat().filter(t => !likedIds.has(t.id));
        
        const artistCount = new Map<string, number>();
        const limitedTracks = allTracks.filter(t => {
          const count = artistCount.get(t.artist_name) || 0;
          if (count < 3) {
            artistCount.set(t.artist_name, count + 1);
            return true;
          }
          return false;
        });
        
        // Même tri que for-you.tsx pour cohérence
        const seed = currentHash.split(',').length;
        tracks = limitedTracks.sort((a, b) => {
          const aVal = (a.id.charCodeAt(0) + seed) % 10;
          const bVal = (b.id.charCodeAt(0) + seed) % 10;
          return aVal - bVal;
        }).slice(0, 8);
      }
      
      if (tracks.length < 4) {
        const popular = await getPopularTracks(8 - tracks.length);
        const existingIds = new Set([...tracks.map(t => t.id), ...likedTracks.map(t => t.id)]);
        const newPopular = popular.filter(t => !existingIds.has(t.id));
        tracks = [...tracks, ...newPopular];
      }
      
      setForYouTracks(tracks);
      if (tracks.length > 0) {
        setCachedRecommendations(tracks, currentHash);
      }
    } catch (error) {
      console.error('Erreur chargement recommandations:', error);
    }
  }, [likedArtists, likedTracks, currentHash]);

  // Charger les données au montage
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tracksData, albumsData, artistsData, trendingData] = await Promise.all([
        getPopularTracks(10),
        getPopularAlbums(8),
        getPopularArtists(12),
        getPopularTracks(8), // Même source que trending.tsx
      ]);
      setPopularTracks(tracksData);
      setPopularAlbums(albumsData);
      setPopularArtists(artistsData);
      setTrendingTracks(trendingData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadForYou(); }, [loadForYou]);

  // Handlers
  const handlePlayFromForYou = (track: JamendoTrack) => {
    playTrack(track, forYouTracks, 'for-you');
  };

  const handleAddToPlaylist = (track: JamendoTrack) => {
    setSelectedTrack(track);
    setShowAddToPlaylist(true);
  };

  const handleCreatePlaylist = (name: string, description: string) => {
    createPlaylist(name, description);
  };

  const handlePlayPlaylist = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist && playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks, playlistId);
    }
  };

  const isPlaylistPlaying = (playlistId: string) => {
    return currentSourceId === playlistId;
  };

  // Vérifier si un track est dans n'importe quelle playlist
  const isTrackInAnyPlaylist = useCallback((trackId: string) => {
    return playlists.some(p => p.tracks.some(t => t.id === trackId));
  }, [playlists]);

  const bottomPadding = currentTrack ? 'pb-36' : 'pb-24';

  return (
    <main className={`flex flex-col min-h-screen ${bottomPadding}`}>
      <PageHeader title="Musique" showNotifications variant="dark" />
      
      {/* Onglets */}
      <div className="px-4 pb-4 pt-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all' as const, label: 'Tous' },
            { id: 'music' as const, label: 'Musique' },
            { id: 'playlists' as const, label: 'Playlists' },
            { id: 'artists' as const, label: 'Artistes' },
            { id: 'events' as const, label: 'Évènements' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-(--yellow) text-(--background-brown)' 
                  : 'bg-[#2a2518] text-(--text-color) hover:bg-[#3d3525]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-grow px-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--yellow)"></div>
          </div>
        ) : (
          <>
            {/* ========== ONGLET TOUS ========== */}
            {activeTab === 'all' && (
              <>
                {/* Section Écoutés Récemment - 4 tracks centrés */}
                {history.length > 0 && (
                  <section>
                    <h2 className="font-bold text-lg text-(--text-color) mb-4">Écoutés récemment</h2>
                    <div className="flex justify-center gap-3 flex-wrap pb-2">
                      {history.slice(0, 4).map((track, index) => (
                        <div
                          key={`${track.id}-${index}`}
                          className="w-28 group text-left"
                        >
                          <div className="relative w-28 h-28 rounded-lg overflow-hidden mb-2">
                            <button
                              onClick={() => playTrack(track)}
                              className="w-full h-full"
                            >
                              <Image
                                src={track.album_image || track.image || '/albumCoverExample.png'}
                                alt={track.name}
                                fill
                                sizes="112px"
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <Play size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" />
                              </div>
                            </button>
                            <button
                              onClick={() => handleAddToPlaylist(track)}
                              className={`absolute top-1 right-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 z-10 ${
                                isTrackInAnyPlaylist(track.id)
                                  ? 'border-(--yellow) text-(--yellow) bg-black/30'
                                  : 'border-white/70 text-white/70 hover:border-white hover:text-white bg-black/30'
                              }`}
                              title={isTrackInAnyPlaylist(track.id) ? 'Déjà dans une playlist' : 'Ajouter à une playlist'}
                            >
                              {isTrackInAnyPlaylist(track.id) ? <Check size={12} /> : <Plus size={12} />}
                            </button>
                          </div>
                          <p className="text-xs text-(--text-color) truncate">{track.name}</p>
                          <p className="text-xs text-gray-400 truncate">{track.artist_name}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Section Tes Playlists */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg text-(--text-color)">Tes Playlists</h2>
                    <button onClick={() => handleTabChange('playlists')} className="text-sm text-gray-400 hover:text-(--yellow)">Voir tout</button>
                  </div>
                  {playlists.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                      {[...playlists].sort((a, b) => {
                        if (a.id === 'favorites_liked_songs') return -1;
                        if (b.id === 'favorites_liked_songs') return 1;
                        return b.createdAt - a.createdAt;
                      }).slice(0, 4).map((playlist) => (
                        <PlaylistCard key={playlist.id} playlist={playlist} onPlay={() => handlePlayPlaylist(playlist.id)} onPause={pause} isCurrentlyPlaying={isPlaylistPlaying(playlist.id)} isPlaying={isPlaying} />
                      ))}
                    </div>
                  ) : (
                    <button onClick={() => setShowCreatePlaylist(true)} className="w-full py-8 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center gap-2 hover:border-(--yellow) transition-colors">
                      <Plus size={32} className="text-gray-400" /><p className="text-gray-400">Crée ta première playlist</p>
                    </button>
                  )}
                </section>

                {/* Section Pour Toi */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg text-(--text-color)">Pour Toi</h2>
                    <button onClick={() => handleTabChange('music')} className="text-sm text-gray-400 hover:text-(--yellow)">Voir tout</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {forYouTracks.slice(0, 4).map((track) => (
                      <div key={track.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <button onClick={() => playTrack(track)} className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                          <Image src={track.album_image || track.image || '/albumCoverExample.png'} alt={track.name} fill sizes="40px" className="object-cover" />
                        </button>
                        <button onClick={() => playTrack(track)} className="flex-grow min-w-0 text-left">
                          <p className={`text-sm font-medium truncate ${currentTrack?.id === track.id ? 'text-(--yellow)' : 'text-(--text-color)'}`}>{track.name}</p>
                          <p className="text-xs text-gray-400 truncate">{track.artist_name} • {formatDuration(track.duration)}</p>
                        </button>
                        {isTrackInAnyPlaylist(track.id) ? (
                          <div className="w-6 h-6 rounded-full bg-(--yellow) flex items-center justify-center flex-shrink-0" title="Déjà dans une playlist">
                            <Check size={14} className="text-(--background-brown)" />
                          </div>
                        ) : (
                          <button onClick={() => handleAddToPlaylist(track)} className="w-6 h-6 rounded-full border-2 border-gray-500 text-gray-500 hover:border-(--yellow) hover:text-(--yellow) flex items-center justify-center transition-colors flex-shrink-0" title="Ajouter à une playlist">
                            <Plus size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Section Tendances */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg text-(--text-color)">Tendances</h2>
                    <button onClick={() => handleTabChange('music')} className="text-sm text-gray-400 hover:text-(--yellow)">Voir tout</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {trendingTracks.slice(0, 4).map((track) => (
                      <div key={track.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <button onClick={() => playTrack(track)} className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                          <Image src={track.album_image || track.image || '/albumCoverExample.png'} alt={track.name} fill sizes="40px" className="object-cover" />
                        </button>
                        <button onClick={() => playTrack(track)} className="flex-grow min-w-0 text-left">
                          <p className={`text-sm font-medium truncate ${currentTrack?.id === track.id ? 'text-(--yellow)' : 'text-(--text-color)'}`}>{track.name}</p>
                          <p className="text-xs text-gray-400 truncate">{track.artist_name} • {formatDuration(track.duration)}</p>
                        </button>
                        {isTrackInAnyPlaylist(track.id) ? (
                          <div className="w-6 h-6 rounded-full bg-(--yellow) flex items-center justify-center flex-shrink-0" title="Déjà dans une playlist">
                            <Check size={14} className="text-(--background-brown)" />
                          </div>
                        ) : (
                          <button onClick={() => handleAddToPlaylist(track)} className="w-6 h-6 rounded-full border-2 border-gray-500 text-gray-500 hover:border-(--yellow) hover:text-(--yellow) flex items-center justify-center transition-colors flex-shrink-0" title="Ajouter à une playlist">
                            <Plus size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Section Artistes */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg text-(--text-color)">Artistes du moment</h2>
                    <button onClick={() => handleTabChange('artists')} className="text-sm text-gray-400 hover:text-(--yellow)">Voir tout</button>
                  </div>
                  <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                    {popularArtists.filter(a => a.image).slice(0, 6).map((artist) => (
                      <Link key={artist.id} href={`/profile/${artist.id}`} className="flex-shrink-0 flex flex-col items-center gap-2">
                        <div className="relative w-20 h-20 rounded-full overflow-hidden">
                          <Image src={artist.image!} alt={artist.name} fill sizes="80px" className="object-cover" />
                        </div>
                        <p className="text-xs text-(--text-color) text-center w-20 truncate">{artist.name}</p>
                      </Link>
                    ))}
                  </div>
                </section>

                {/* Section Albums */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg text-(--text-color)">Albums Populaires</h2>
                    <button onClick={() => handleTabChange('music')} className="text-sm text-gray-400 hover:text-(--yellow)">Voir tout</button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                    {popularAlbums.map((album) => (<AlbumCard key={album.id} album={album} />))}
                  </div>
                </section>

                {/* Section Playlists Populaires */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg text-(--text-color)">Playlists Populaires</h2>
                    <button onClick={() => handleTabChange('playlists')} className="text-sm text-gray-400 hover:text-(--yellow)">Voir tout</button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                    {SAMPLE_PUBLIC_PLAYLISTS.slice(0, 4).map((playlist) => (
                      <Link 
                        key={playlist.id} 
                        href={`/music/public-playlist/${playlist.id}`}
                        className="w-36 flex-shrink-0 group"
                      >
                        <div className="relative w-36 h-36 rounded-lg overflow-hidden mb-2 bg-[#2a2518]">
                          <Image src={playlist.coverImage} alt={playlist.name} fill sizes="144px" className="object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <p className="font-medium text-(--text-color) truncate text-sm">{playlist.name}</p>
                        <p className="text-xs text-gray-400 truncate">par {playlist.creatorName}</p>
                      </Link>
                    ))}
                  </div>
                </section>

                {/* Section Genres */}
                <section>
                  <h2 className="font-bold text-lg text-(--text-color) mb-4">Explorer par genre</h2>
                  <div className="flex gap-2 flex-wrap">
                    {MUSIC_TAGS.slice(0, 8).map((tag) => (
                      <Link key={tag} href={`/music/search?tag=${tag}`} className="px-4 py-2 rounded-full bg-[#2a2518] text-(--text-color) text-sm capitalize hover:bg-[#3d3525] transition-colors">{tag}</Link>
                    ))}
                  </div>
                </section>

                {/* Section Événements */}
                <section className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg text-(--text-color)">Événements à venir</h2>
                    <button onClick={() => handleTabChange('events')} className="text-sm text-gray-400 hover:text-(--yellow)">Voir tout</button>
                  </div>
                  <div className="space-y-4">
                    {SAMPLE_EVENTS.slice(0, 3).map((event) => (
                      <div key={event.id} className="bg-[#2a2518] rounded-xl overflow-hidden flex gap-4">
                        <div className="relative w-24 flex-shrink-0">
                          <Image src="/event.png" alt={event.name} fill sizes="96px" className="object-cover" />
                          <div className="absolute top-1 left-1 px-2 py-0.5 bg-black/70 rounded text-[10px] text-(--yellow)">{getCategoryLabel(event.category)}</div>
                        </div>
                        <div className="flex-grow py-3 pr-3">
                          <h3 className="font-semibold text-(--text-color) truncate">{event.name}</h3>
                          <p className="text-sm text-gray-400 truncate">{event.artist}</p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                            <Calendar size={12} />{formatEventDate(event.date)} • {event.time}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <MapPin size={12} />{event.venue}, {event.city}
                          </div>
                        </div>
                        <div className="flex items-center pr-4">
                          <span className="text-sm font-medium text-(--yellow)">{event.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {activeTab === 'music' && (
              <>
                {/* Section Écoutés Récemment - 4 tracks centrés */}
                {history.length > 0 && (
                  <section>
                    <h2 className="font-bold text-lg text-(--text-color) mb-4">Écoutés récemment</h2>
                    <div className="flex justify-center gap-3 flex-wrap pb-2">
                      {history.slice(0, 4).map((track, index) => (
                        <div
                          key={`${track.id}-${index}`}
                          className="w-28 group text-left"
                        >
                          <div className="relative w-28 h-28 rounded-lg overflow-hidden mb-2">
                            <button
                              onClick={() => playTrack(track)}
                              className="w-full h-full"
                            >
                              <Image
                                src={track.album_image || track.image || '/albumCoverExample.png'}
                                alt={track.name}
                                fill
                                sizes="112px"
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <Play size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" />
                              </div>
                            </button>
                            <button
                              onClick={() => handleAddToPlaylist(track)}
                              className={`absolute top-1 right-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 z-10 ${
                                isTrackInAnyPlaylist(track.id)
                                  ? 'border-(--yellow) text-(--yellow) bg-black/30'
                                  : 'border-white/70 text-white/70 hover:border-white hover:text-white bg-black/30'
                              }`}
                              title={isTrackInAnyPlaylist(track.id) ? 'Déjà dans une playlist' : 'Ajouter à une playlist'}
                            >
                              {isTrackInAnyPlaylist(track.id) ? <Check size={12} /> : <Plus size={12} />}
                            </button>
                          </div>
                          <p className="text-xs text-(--text-color) truncate">{track.name}</p>
                          <p className="text-xs text-gray-400 truncate">{track.artist_name}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Section Pour Toi - 3x2 grid */}
                {forYouTracks.length > 0 && (
                  <section>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="font-bold text-lg text-(--text-color)">Pour Toi</h2>
                      <Link href="/music/for-you" className="text-sm text-gray-400 hover:text-(--yellow)">Voir tout</Link>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {forYouTracks.slice(0, 6).map((track) => (
                        <div key={track.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                          <button onClick={() => playTrack(track)} className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                            <Image src={track.album_image || track.image || '/albumCoverExample.png'} alt={track.name} fill sizes="40px" className="object-cover" />
                          </button>
                          <button onClick={() => playTrack(track)} className="flex-grow min-w-0 text-left">
                            <p className={`text-sm font-medium truncate ${currentTrack?.id === track.id ? 'text-(--yellow)' : 'text-(--text-color)'}`}>{track.name}</p>
                            <p className="text-xs text-gray-400 truncate">{track.artist_name} • {formatDuration(track.duration)}</p>
                          </button>
                          {isTrackInAnyPlaylist(track.id) ? (
                            <div className="w-6 h-6 rounded-full bg-(--yellow) flex items-center justify-center flex-shrink-0" title="Déjà dans une playlist">
                              <Check size={14} className="text-(--background-brown)" />
                            </div>
                          ) : (
                            <button onClick={() => handleAddToPlaylist(track)} className="w-6 h-6 rounded-full border-2 border-gray-500 text-gray-500 hover:border-(--yellow) hover:text-(--yellow) flex items-center justify-center transition-colors flex-shrink-0" title="Ajouter à une playlist">
                              <Plus size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Section Tendances - grid 2 colonnes */}
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-lg text-(--text-color)">Tendances du moment</h2>
                    <Link href="/music/trending" className="text-sm text-gray-400 hover:text-(--yellow)">Voir tout</Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {trendingTracks.slice(0, 6).map((track) => (
                      <div key={track.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <button onClick={() => playTrack(track)} className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                          <Image src={track.album_image || track.image || '/albumCoverExample.png'} alt={track.name} fill sizes="40px" className="object-cover" />
                        </button>
                        <button onClick={() => playTrack(track)} className="flex-grow min-w-0 text-left">
                          <p className={`text-sm font-medium truncate ${currentTrack?.id === track.id ? 'text-(--yellow)' : 'text-(--text-color)'}`}>{track.name}</p>
                          <p className="text-xs text-gray-400 truncate">{track.artist_name} • {formatDuration(track.duration)}</p>
                        </button>
                        {isTrackInAnyPlaylist(track.id) ? (
                          <div className="w-6 h-6 rounded-full bg-(--yellow) flex items-center justify-center flex-shrink-0" title="Déjà dans une playlist">
                            <Check size={14} className="text-(--background-brown)" />
                          </div>
                        ) : (
                          <button onClick={() => handleAddToPlaylist(track)} className="w-6 h-6 rounded-full border-2 border-gray-500 text-gray-500 hover:border-(--yellow) hover:text-(--yellow) flex items-center justify-center transition-colors flex-shrink-0" title="Ajouter à une playlist">
                            <Plus size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Section Albums - 3 albums avec wrap */}
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-lg text-(--text-color)">Albums Populaires</h2>
                    <Link href="/music/albums" className="text-sm text-gray-400 hover:text-(--yellow)">Voir tout</Link>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 pb-2">
                    {popularAlbums.slice(0, 3).map((album) => (<AlbumCard key={album.id} album={album} />))}
                  </div>
                </section>

                {/* Section Genres */}
                <section className="pb-4">
                  <h2 className="font-bold text-lg text-(--text-color) mb-4">Explorer par genre</h2>
                  <div className="flex gap-2 flex-wrap">
                    {MUSIC_TAGS.map((tag) => (
                      <Link key={tag} href={`/music/search?tag=${tag}`} className="px-4 py-2 rounded-full bg-[#2a2518] text-(--text-color) text-sm capitalize hover:bg-[#3d3525] transition-colors">{tag}</Link>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* ========== ONGLET PLAYLISTS ========== */}
            {activeTab === 'playlists' && (
              <>
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg text-(--text-color)">Tes Playlists</h2>
                    <button onClick={() => setShowCreatePlaylist(true)} className="flex items-center gap-1 text-sm text-(--yellow) hover:opacity-80">
                      <Plus size={16} />Créer
                    </button>
                  </div>
                  {playlists.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-4">
                      {[...playlists].sort((a, b) => {
                        if (a.id === 'favorites_liked_songs') return -1;
                        if (b.id === 'favorites_liked_songs') return 1;
                        return b.createdAt - a.createdAt;
                      }).map((playlist) => (
                        <PlaylistCard key={playlist.id} playlist={playlist} onPlay={() => handlePlayPlaylist(playlist.id)} onPause={pause} isCurrentlyPlaying={isPlaylistPlaying(playlist.id)} isPlaying={isPlaying} />
                      ))}
                    </div>
                  ) : (
                    <button onClick={() => setShowCreatePlaylist(true)} className="w-full py-8 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center gap-2 hover:border-(--yellow) transition-colors">
                      <Plus size={32} className="text-gray-400" /><p className="text-gray-400">Crée ta première playlist</p>
                    </button>
                  )}
                </section>
                <section>
                  <h2 className="font-bold text-lg text-(--text-color) mb-4">Playlists Populaires</h2>
                  <div className="flex flex-wrap justify-center gap-4">
                    {SAMPLE_PUBLIC_PLAYLISTS.map((playlist) => (
                      <Link 
                        key={playlist.id} 
                        href={`/music/public-playlist/${playlist.id}`}
                        className="w-36 flex-shrink-0 group"
                      >
                        <div className="relative w-36 h-36 rounded-lg overflow-hidden mb-2 bg-[#2a2518]">
                          <Image src={playlist.coverImage} alt={playlist.name} fill sizes="144px" className="object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <p className="font-medium text-(--text-color) truncate text-sm">{playlist.name}</p>
                        <p className="text-xs text-gray-400 truncate">par {playlist.creatorName}</p>
                        <p className="text-xs text-gray-500">{playlist.trackCount} titres</p>
                      </Link>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* ========== ONGLET ARTISTES ========== */}
            {activeTab === 'artists' && (
              <section className="pb-4">
                <h2 className="font-bold text-lg text-(--text-color) mb-4">Artistes Populaires</h2>
                <div className="grid grid-cols-3 gap-4">
                  {popularArtists.filter(a => a.image).map((artist) => (
                    <Link key={artist.id} href={`/profile/${artist.id}`} className="flex flex-col items-center gap-2">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden">
                        <Image src={artist.image!} alt={artist.name} fill sizes="96px" className="object-cover" />
                      </div>
                      <p className="text-sm text-(--text-color) text-center truncate w-full">{artist.name}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ========== ONGLET ÉVÉNEMENTS ========== */}
            {activeTab === 'events' && (
              <section className="pb-4">
                <h2 className="font-bold text-lg text-(--text-color) mb-4">Événements à venir</h2>
                <div className="space-y-4">
                  {SAMPLE_EVENTS.map((event) => (
                    <div key={event.id} className="bg-[#2a2518] rounded-xl overflow-hidden flex gap-4">
                      <div className="relative w-24 flex-shrink-0">
                        <Image src="/event.png" alt={event.name} fill sizes="96px" className="object-cover" />
                        <div className="absolute top-1 left-1 px-2 py-0.5 bg-black/70 rounded text-[10px] text-(--yellow)">{getCategoryLabel(event.category)}</div>
                      </div>
                      <div className="flex-grow py-3 pr-3">
                        <h3 className="font-semibold text-(--text-color) truncate">{event.name}</h3>
                        <p className="text-sm text-gray-400 truncate">{event.artist}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <Calendar size={12} />{formatEventDate(event.date)} • {event.time}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <MapPin size={12} />{event.venue}, {event.city}
                        </div>
                      </div>
                      <div className="flex items-center pr-4">
                        <span className="text-sm font-medium text-(--yellow)">{event.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
      
      <NavBar />

      <CreatePlaylistModal isOpen={showCreatePlaylist} onClose={() => setShowCreatePlaylist(false)} onCreate={handleCreatePlaylist} />
      <AddToPlaylistModal isOpen={showAddToPlaylist} onClose={() => setShowAddToPlaylist(false)} track={selectedTrack} onCreateNew={() => setShowCreatePlaylist(true)} />
    </main>
  );
}
