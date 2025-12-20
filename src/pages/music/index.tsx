import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Plus, MoreVertical, User } from 'lucide-react';
import { NavBar } from '@/ui/navBar';
import { TrackCard } from '@/ui/trackCard';
import { AlbumCard } from '@/ui/albumCard';
import { PlaylistCard } from '@/ui/playlistCard';
import { CreatePlaylistModal } from '@/ui/createPlaylistModal';
import { AddToPlaylistModal } from '@/ui/addToPlaylistModal';
import { JamendoTrack, JamendoAlbum, JamendoArtist } from '@/lib/types';
import { getPopularTracks, getPopularAlbums, getTracksByArtist, getTrendingTracks, getPopularArtists, MUSIC_TAGS } from '@/lib/jamendoApi';
import { usePlayer } from '@/lib/playerContext';
import { usePlaylist, FAVORITES_PLAYLIST_ID } from '@/lib/playlistContext';

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
  const [popularTracks, setPopularTracks] = useState<JamendoTrack[]>([]);
  const [popularAlbums, setPopularAlbums] = useState<JamendoAlbum[]>([]);
  const [popularArtists, setPopularArtists] = useState<JamendoArtist[]>([]);
  const [forYouTracks, setForYouTracks] = useState<JamendoTrack[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<JamendoTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('all');
  
  // Modals
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<JamendoTrack | null>(null);

  const { playTrack, currentTrack, history, isPlaying, pause, tracklist, currentSourceId } = usePlayer();
  const { playlists, createPlaylist } = usePlaylist();

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
    
    // Utiliser le cache si les likes n'ont pas changé
    if (cached && cached.length > 0 && cachedHash === currentHash) {
      setForYouTracks(cached);
      return;
    }

    try {
      let tracks: JamendoTrack[] = [];
      if (likedArtists.length > 0) {
        const artistsToFetch = likedArtists.slice(0, 5); // Plus d'artistes pour plus de variété
        const results = await Promise.all(
          artistsToFetch.map(a => getTracksByArtist(a, 6).catch(() => []))
        );
        const likedIds = new Set(likedTracks.map(t => t.id));
        const allTracks = results.flat().filter(t => !likedIds.has(t.id));
        
        // Limiter à 3 tracks max par artiste
        const artistCount = new Map<string, number>();
        const limitedTracks = allTracks.filter(t => {
          const count = artistCount.get(t.artist_name) || 0;
          if (count < 3) {
            artistCount.set(t.artist_name, count + 1);
            return true;
          }
          return false;
        });
        
        // Mélanger de manière déterministe (basé sur currentHash pour cohérence)
        const seed = currentHash.split(',').length;
        tracks = limitedTracks.sort((a, b) => {
          const aVal = (a.id.charCodeAt(0) + seed) % 10;
          const bVal = (b.id.charCodeAt(0) + seed) % 10;
          return aVal - bVal;
        }).slice(0, 15);
      }
      if (tracks.length < 15) {
        const popular = await getPopularTracks(15 - tracks.length);
        const existingIds = new Set([...tracks.map(t => t.id), ...likedTracks.map(t => t.id)]);
        tracks = [...tracks, ...popular.filter(t => !existingIds.has(t.id))];
      }
      setCachedRecommendations(tracks, currentHash);
      setForYouTracks(tracks);
    } catch {
      const popular = await getPopularTracks(15);
      setForYouTracks(popular);
    }
  }, [likedArtists, likedTracks, currentHash]);

  useEffect(() => {
    async function loadData() {
      try {
        const [albums, trending, artists] = await Promise.all([
          getPopularAlbums(10),
          getTrendingTracks(12),
          getPopularArtists(8)
        ]);
        setPopularAlbums(albums);
        setTrendingTracks(trending);
        setPopularArtists(artists);
        await loadForYou();
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [loadForYou]);

  // Jouer depuis "Pour Toi"
  const handlePlayFromForYou = (track: JamendoTrack) => {
    playTrack(track, forYouTracks);
  };

  // Ouvrir le modal pour ajouter à une playlist
  const handleAddToPlaylist = (track: JamendoTrack) => {
    setSelectedTrack(track);
    setShowAddToPlaylist(true);
  };

  // Créer une nouvelle playlist
  const handleCreatePlaylist = (name: string, description: string) => {
    createPlaylist(name, description);
  };

  // Jouer une playlist entière ou mettre en pause si déjà en cours
  const handlePlayPlaylist = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist && playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks, playlistId);
    }
  };

  // Vérifier si une playlist est actuellement en cours de lecture
  const isPlaylistPlaying = (playlistId: string) => {
    return currentSourceId === playlistId;
  };

  const bottomPadding = currentTrack ? 'pb-36' : 'pb-24';

  return (
    <main className={`flex flex-col min-h-screen ${bottomPadding} bg-gradient-to-b from-[#2a2518] via-[#1a1610] to-[#0d0b08]`}>
      {/* Header */}
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-(--background-brown) flex items-center justify-center overflow-hidden">
              <Image 
                src="/albumCoverExample.png" 
                alt="Avatar" 
                width={40} 
                height={40}
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Bonjour,</p>
              <p className="text-(--text-color) font-semibold">Utilisateur</p>
            </div>
          </div>
          <Link 
            href="/notifications"
            className="w-10 h-10 rounded-full bg-[#2a2518] flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="#FEF9E4"/>
            </svg>
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-(--text-color)">
            Bienvenue sur <span className="text-(--yellow)">Musiverse</span>
          </h1>
          <p className="text-gray-400 mt-1">Ton monde musical</p>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {['all', 'Music', 'Podcast', 'Radio'].map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTag === tag 
                  ? 'bg-(--yellow) text-(--background-brown)' 
                  : 'bg-[#2a2518] text-(--text-color) hover:bg-[#3d3525]'
              }`}
            >
              {tag === 'all' ? 'Tous' : tag}
            </button>
          ))}
        </div>
      </header>

      {/* Contenu */}
      <div className="flex-grow px-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--yellow)"></div>
          </div>
        ) : (
          <>
            {/* Section Écoutés Récemment (Tracks individuelles) */}
            {history.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg text-(--text-color)">Écoutés récemment</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {history.slice(0, 8).map((track, index) => (
                    <button
                      key={`${track.id}-${index}`}
                      onClick={() => playTrack(track)}
                      className="flex-shrink-0 w-28 group text-left"
                    >
                      <div className="relative w-28 h-28 rounded-lg overflow-hidden mb-2">
                        <Image
                          src={track.album_image || track.image || '/albumCoverExample.png'}
                          alt={track.name}
                          fill
                          sizes="112px"
                          className="object-cover"
                          priority={index < 2}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <Play size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" />
                        </div>
                      </div>
                      <p className="text-xs text-(--text-color) truncate">{track.name}</p>
                      <p className="text-xs text-gray-400 truncate">{track.artist_name}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Section Tes Playlists */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-(--text-color)">Tes Playlists</h2>
                <button
                  onClick={() => setShowCreatePlaylist(true)}
                  className="flex items-center gap-1 text-sm text-(--yellow) hover:opacity-80"
                >
                  <Plus size={16} />
                  Créer
                </button>
              </div>
              {playlists.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {/* Trier : favoris en premier, puis par date de création décroissante */}
                  {[...playlists]
                    .sort((a, b) => {
                      // Favoris toujours en premier
                      if (a.id === 'favorites_liked_songs') return -1;
                      if (b.id === 'favorites_liked_songs') return 1;
                      // Puis par date de création décroissante (plus récent en premier)
                      return b.createdAt - a.createdAt;
                    })
                    .map((playlist, index) => (
                    <PlaylistCard
                      key={playlist.id}
                      playlist={playlist}
                      onPlay={() => handlePlayPlaylist(playlist.id)}
                      onPause={() => pause()}
                      isCurrentlyPlaying={isPlaylistPlaying(playlist.id)}
                      isPlaying={isPlaying}
                      priority={index === 0}
                    />
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => setShowCreatePlaylist(true)}
                  className="w-full py-8 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center gap-2 hover:border-(--yellow) transition-colors"
                >
                  <Plus size={32} className="text-gray-400" />
                  <p className="text-gray-400">Crée ta première playlist</p>
                </button>
              )}
            </section>

            {/* Section Pour Toi */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-(--text-color)">Pour Toi</h2>
                <Link href="/music/for-you" className="text-sm text-gray-400 hover:text-(--yellow)">
                  Voir tout
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {forYouTracks.slice(0, 6).map((track, index) => (
                  <div key={track.id} className="relative group">
                    <button
                      onClick={() => handlePlayFromForYou(track)}
                      className="w-full flex items-center gap-3 bg-[#2a2518] rounded-lg overflow-hidden hover:bg-[#3d3525] transition-colors"
                    >
                      <div className="relative w-14 h-14 flex-shrink-0">
                        <Image
                          src={track.album_image || track.image || '/albumCoverExample.png'}
                          alt={track.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                          priority={index < 4}
                        />
                      </div>
                      <p className="text-sm font-medium text-(--text-color) truncate pr-8">
                        {track.name}
                      </p>
                    </button>
                    {/* Bouton menu */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToPlaylist(track);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                    >
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Section Tendances */}
            {trendingTracks.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg text-(--text-color)">Tendances</h2>
                  <button
                    onClick={() => playTrack(trendingTracks[0], trendingTracks)}
                    className="flex items-center gap-1 text-sm text-(--yellow) hover:opacity-80"
                  >
                    <Play size={14} fill="currentColor" />
                    Tout écouter
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {trendingTracks.slice(0, 8).map((track, index) => (
                    <button
                      key={track.id}
                      onClick={() => playTrack(track, trendingTracks)}
                      className="flex-shrink-0 w-28 group text-left"
                    >
                      <div className="relative w-28 h-28 rounded-lg overflow-hidden mb-2">
                        <Image
                          src={track.album_image || track.image || '/albumCoverExample.png'}
                          alt={track.name}
                          fill
                          sizes="112px"
                          className="object-cover"
                          priority={index < 2}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <Play size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" />
                        </div>
                      </div>
                      <p className="text-xs text-(--text-color) truncate">{track.name}</p>
                      <p className="text-xs text-gray-400 truncate">{track.artist_name}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Section Artistes Populaires */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-(--text-color)">Artistes Populaires</h2>
                <Link href="/profile" className="text-sm text-gray-400 hover:text-(--yellow)">
                  Voir tout
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                {popularArtists.slice(0, 6).map((artist) => (
                  <Link 
                    key={artist.id} 
                    href={`/profile/${artist.id}`}
                    className="flex flex-col items-center gap-2 flex-shrink-0"
                  >
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-700 hover:border-(--yellow) transition-colors">
                      {artist.image ? (
                        <Image
                          src={artist.image}
                          alt={artist.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                          <User size={32} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-(--text-color) text-center w-20 truncate">
                      {artist.name}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            {/* Section Albums */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-(--text-color)">Albums Populaires</h2>
                <Link href="/music/search" className="text-sm text-gray-400 hover:text-(--yellow)">
                  Voir tout
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {popularAlbums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </section>

            {/* Section Genres */}
            <section className="pb-4">
              <h2 className="font-bold text-lg text-(--text-color) mb-4">Explorer par genre</h2>
              <div className="flex gap-2 flex-wrap">
                {MUSIC_TAGS.slice(0, 8).map((tag) => (
                  <Link
                    key={tag}
                    href={`/music/search?tag=${tag}`}
                    className="px-4 py-2 rounded-full bg-[#2a2518] text-(--text-color) text-sm capitalize hover:bg-[#3d3525] transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
      
      {/* Navigation */}
      <NavBar />

      {/* Modals */}
      <CreatePlaylistModal
        isOpen={showCreatePlaylist}
        onClose={() => setShowCreatePlaylist(false)}
        onCreate={handleCreatePlaylist}
      />
      
      <AddToPlaylistModal
        isOpen={showAddToPlaylist}
        onClose={() => setShowAddToPlaylist(false)}
        track={selectedTrack}
        onCreateNew={() => setShowCreatePlaylist(true)}
      />
    </main>
  );
}
