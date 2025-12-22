import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft, Search as SearchIcon, X, Clock, Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { NavBar } from '@/ui/navBar';
import { PageHeader } from '@/ui/PageHeader';
import { JamendoTrack, JamendoAlbum, JamendoArtist } from '@/lib/types';
import { searchTracks, searchAlbums, searchArtists, getTracksByTag, formatDuration, MUSIC_TAGS } from '@/lib/jamendoApi';
import { SAMPLE_PUBLIC_PLAYLISTS, SAMPLE_EVENTS, getCategoryLabel, formatEventDate } from '@/lib/sampleEvents';
import { usePlayer } from '@/lib/playerContext';
import { usePlaylist } from '@/lib/playlistContext';
import { useBodyTheme } from '@/lib/useBodyTheme';

// Clé localStorage pour l'historique de recherche
const SEARCH_HISTORY_KEY = 'musiverse_search_history';
const MAX_SEARCH_HISTORY = 5;

// Type pour l'historique de recherche
interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export default function SearchPage() {
  const router = useRouter();
  const { tag, q, addTo } = router.query;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<JamendoTrack[]>([]);
  const [albums, setAlbums] = useState<JamendoAlbum[]>([]);
  const [artists, setArtists] = useState<JamendoArtist[]>([]);
  const [playlists, setPlaylists] = useState<typeof SAMPLE_PUBLIC_PLAYLISTS>([]);
  const [events, setEvents] = useState<typeof SAMPLE_EVENTS>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  
  // Refs pour le scroll horizontal
  const albumsScrollRef = useRef<HTMLDivElement>(null);
  const artistsScrollRef = useRef<HTMLDivElement>(null);
  
  const { playTrack, currentTrack } = usePlayer();
  const { addTrackToPlaylist, removeTrackFromPlaylist, getPlaylist } = usePlaylist();
  
  // Appliquer le thème dark sur body pour le gradient étendu
  useBodyTheme('dark');
  
  // Playlist cible (si on vient d'une playlist pour ajouter un son)
  const targetPlaylistId = typeof addTo === 'string' ? addTo : null;
  const targetPlaylist = targetPlaylistId ? getPlaylist(targetPlaylistId) : null;

  // Vérifier si une track est déjà dans la playlist cible
  const isTrackInPlaylist = (trackId: string): boolean => {
    if (!targetPlaylist) return false;
    return targetPlaylist.tracks.some(t => t.id === trackId);
  };

  // Charger l'historique de recherche depuis localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Erreur chargement historique recherche:', error);
    }
  }, []);

  // Gérer le scroll horizontal à la molette pour albums et artistes
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.currentTarget as HTMLDivElement;
      e.preventDefault();
      target.scrollLeft += e.deltaY;
    };

    const albumsContainer = albumsScrollRef.current;
    const artistsContainer = artistsScrollRef.current;

    if (albumsContainer) {
      albumsContainer.addEventListener('wheel', handleWheel, { passive: false });
    }
    if (artistsContainer) {
      artistsContainer.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (albumsContainer) {
        albumsContainer.removeEventListener('wheel', handleWheel);
      }
      if (artistsContainer) {
        artistsContainer.removeEventListener('wheel', handleWheel);
      }
    };
  }, [albums, artists]);

  // Sauvegarder dans l'historique
  const saveToHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.query.toLowerCase() !== query.toLowerCase());
      const newHistory = [{ query, timestamp: Date.now() }, ...filtered].slice(0, MAX_SEARCH_HISTORY);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  // Supprimer de l'historique
  const removeFromHistory = (query: string) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.query !== query);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered));
      return filtered;
    });
  };

  // Charger les résultats si un tag ou une query est dans l'URL
  useEffect(() => {
    if (tag && typeof tag === 'string') {
      loadByTag(tag);
    } else if (q && typeof q === 'string') {
      setSearchQuery(q);
      performSearch(q, false);
    }
  }, [tag, q]);

  const loadByTag = async (tagName: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const tagTracks = await getTracksByTag(tagName, 20);
      setTracks(tagTracks);
      setAlbums([]);
      setArtists([]);
    } catch (error) {
      console.error('Erreur de recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query: string, saveHistory: boolean = true) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    
    if (saveHistory) {
      saveToHistory(query);
    }
    
    try {
      const [trackResults, albumResults, artistResults] = await Promise.all([
        searchTracks(query, 15),
        searchAlbums(query, 10),
        searchArtists(query, 10),
      ]);
      setTracks(trackResults);
      setAlbums(albumResults);
      setArtists(artistResults);
      
      // Filtrer playlists et événements localement
      const lowerQuery = query.toLowerCase();
      const filteredPlaylists = SAMPLE_PUBLIC_PLAYLISTS.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) ||
        p.creatorName.toLowerCase().includes(lowerQuery)
      );
      const filteredEvents = SAMPLE_EVENTS.filter(e =>
        e.name.toLowerCase().includes(lowerQuery) ||
        e.artist.toLowerCase().includes(lowerQuery) ||
        e.venue.toLowerCase().includes(lowerQuery) ||
        e.city.toLowerCase().includes(lowerQuery)
      );
      setPlaylists(filteredPlaylists);
      setEvents(filteredEvents);
    } catch (error) {
      console.error('Erreur de recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mettre à jour l'URL pour persister l'état de recherche
    router.replace({
      pathname: router.pathname,
      query: { ...router.query, q: searchQuery }
    }, undefined, { shallow: true });
    performSearch(searchQuery);
  };

  const handleHistoryClick = (query: string) => {
    setSearchQuery(query);
    router.replace({
      pathname: router.pathname,
      query: { ...router.query, q: query }
    }, undefined, { shallow: true });
    performSearch(query);
  };

  const handleAddToPlaylist = (track: JamendoTrack) => {
    if (targetPlaylistId) {
      addTrackToPlaylist(targetPlaylistId, track);
      // Petit feedback visuel
    }
  };

  const handlePlayTrack = (track: JamendoTrack) => {
    playTrack(track);
  };

  const currentTag = typeof tag === 'string' ? tag : null;
  const bottomPadding = currentTrack ? 'pb-36' : 'pb-24';

  return (
    <main className={`flex flex-col min-h-screen ${bottomPadding}`}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#3d3525]/80 backdrop-blur-xl border-b border-white/10 rounded-b-2xl">
        <div className="flex items-center gap-4 p-4">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={24} className="text-(--text-color)" />
          </button>
          
          {/* Barre de recherche */}
          <form onSubmit={handleSubmit} className="flex-grow">
            <div className="relative">
              <SearchIcon 
                size={18} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={targetPlaylist ? `Ajouter à "${targetPlaylist.name}"...` : "Rechercher un titre, artiste..."}
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#2a2518] text-(--text-color) placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-(--yellow)"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setHasSearched(false); setTracks([]); setAlbums([]); setArtists([]); setPlaylists([]); setEvents([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tag actuel ou playlist cible */}
        {(currentTag || targetPlaylist) && (
          <div className="px-4 pb-3 flex gap-2">
            {currentTag && (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-(--yellow)/20 text-(--yellow) text-sm capitalize">
                {currentTag}
                <Link href="/music/search" className="hover:text-white">
                  <X size={14} />
                </Link>
              </span>
            )}
            {targetPlaylist && (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-400 text-sm">
                <Plus size={14} />
                Ajouter à la playlist {targetPlaylist.name}
              </span>
            )}
          </div>
        )}
      </header>

      {/* Contenu */}
      <div className="flex-grow px-4 py-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--yellow)"></div>
          </div>
        ) : !hasSearched ? (
          /* Avant recherche : Historique + Genres */
          <>
            {/* Historique de recherche */}
            {searchHistory.length > 0 && (
              <section>
                <h2 className="font-bold text-lg text-(--text-color) mb-3">
                  Recherches récentes
                </h2>
                <div className="space-y-1">
                  {searchHistory.map((item, index) => (
                    <div 
                      key={`${item.query}-${index}`}
                      className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#2a2518] transition-colors group"
                    >
                      <Clock size={16} className="text-gray-500 flex-shrink-0" />
                      <button
                        onClick={() => handleHistoryClick(item.query)}
                        className="flex-grow text-left text-(--text-color) hover:text-(--yellow)"
                      >
                        {item.query}
                      </button>
                      <button
                        onClick={() => removeFromHistory(item.query)}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-full transition-all"
                      >
                        <X size={14} className="text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Explorer par genre */}
            <section>
              <h2 className="font-bold text-lg text-(--text-color) mb-3">
                Explorer par genre
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {MUSIC_TAGS.map((tagName) => (
                  <Link
                    key={tagName}
                    href={`/music/search?tag=${tagName}${targetPlaylistId ? `&addTo=${targetPlaylistId}` : ''}`}
                    className="flex items-center justify-center p-5 rounded-xl bg-gradient-to-br from-[#3d3525] to-[#2a2518] text-(--text-color) font-medium capitalize hover:from-[#4a432e] hover:to-[#3d3525] transition-all"
                  >
                    {tagName}
                  </Link>
                ))}
              </div>
            </section>
          </>
        ) : (
          /* Résultats de recherche */
          <>
            {/* Albums */}
            {albums.length > 0 && (
              <section>
                <h2 className="font-bold text-lg text-(--text-color) mb-3">
                  Albums
                </h2>
                <div ref={albumsScrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2" style={{ scrollBehavior: 'smooth' }}>
                  {albums.map((album) => (
                    <Link
                      key={album.id}
                      href={`/music/album/${album.id}${targetPlaylistId ? `?addTo=${targetPlaylistId}` : ''}`}
                      className="flex-shrink-0 w-32 group"
                    >
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden mb-2">
                        <Image
                          src={album.image || '/albumCoverExample.png'}
                          alt={album.name}
                          fill
                          sizes="128px"
                          className="object-cover"
                        />
                      </div>
                      <p className="text-sm text-(--text-color) truncate">{album.name}</p>
                      <p className="text-xs text-gray-400 truncate">{album.artist_name}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Artistes - uniquement ceux avec photo */}
            {artists.filter(a => a.image).length > 0 && (
              <section>
                <h2 className="font-bold text-lg text-(--text-color) mb-3">
                  Artistes
                </h2>
                <div ref={artistsScrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2" style={{ scrollBehavior: 'smooth' }}>
                  {artists.filter(a => a.image).map((artist) => (
                    <Link
                      key={artist.id}
                      href={`/profile/${artist.id}`}
                      className="flex-shrink-0 w-28 group text-center"
                    >
                      <div className="relative w-28 h-28 rounded-full overflow-hidden mb-2 mx-auto">
                        <Image
                          src={artist.image || '/photoProfil.png'}
                          alt={artist.name}
                          fill
                          sizes="112px"
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <p className="text-sm text-(--text-color) truncate">{artist.name}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Playlists */}
            {playlists.length > 0 && (
              <section>
                <h2 className="font-bold text-lg text-(--text-color) mb-3">
                  Playlists
                </h2>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2" style={{ scrollBehavior: 'smooth' }}>
                  {playlists.map((playlist) => (
                    <Link 
                      key={playlist.id} 
                      href={`/music/public-playlist/${playlist.id}`}
                      className="flex-shrink-0 w-32 group"
                    >
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden mb-2 bg-[#2a2518]">
                        <Image src={playlist.coverImage} alt={playlist.name} fill sizes="128px" className="object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <p className="text-sm text-(--text-color) truncate">{playlist.name}</p>
                      <p className="text-xs text-gray-400 truncate">par {playlist.creatorName}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Événements */}
            {events.length > 0 && (
              <section>
                <h2 className="font-bold text-lg text-(--text-color) mb-3">
                  Événements
                </h2>
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="bg-[#2a2518] rounded-xl overflow-hidden flex gap-4">
                      <div className="relative w-24 flex-shrink-0">
                        <Image src="/event.png" alt={event.name} fill sizes="96px" className="object-cover" />
                        <div className="absolute top-1 left-1 px-2 py-0.5 bg-black/70 rounded text-[10px] text-(--yellow)">{getCategoryLabel(event.category)}</div>
                      </div>
                      <div className="flex-grow py-3 pr-3">
                        <h3 className="font-semibold text-(--text-color) truncate">{event.name}</h3>
                        <p className="text-sm text-gray-400 truncate">{event.artist}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          {formatEventDate(event.date)} • {event.time}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          {event.venue}, {event.city}
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

            {/* Pistes */}
            {tracks.length > 0 && (
              <section>
                <h2 className="font-bold text-lg text-(--text-color) mb-3">
                  Titres
                </h2>
                <div className="bg-[#1a1610] rounded-xl overflow-hidden">
                  {tracks.map((track) => {
                    const isAdded = isTrackInPlaylist(track.id);
                    
                    return (
                      <div 
                        key={track.id}
                        onClick={() => handlePlayTrack(track)}
                        className="flex items-center gap-3 py-3 px-3 hover:bg-[#2a2518] transition-colors cursor-pointer"
                      >
                        {/* Cover */}
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={track.album_image || track.image || '/albumCoverExample.png'}
                            alt={track.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>

                        {/* Infos */}
                        <div className="flex-grow min-w-0">
                          <p className="text-(--text-color) font-medium truncate">{track.name}</p>
                          <p className="text-sm text-gray-400 truncate">
                            {track.artist_name} • {formatDuration(track.duration)}
                          </p>
                        </div>

                        {/* Bouton ajouter/retirer (style navBar) */}
                        {targetPlaylistId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isAdded) {
                                removeTrackFromPlaylist(targetPlaylistId, track.id);
                              } else {
                                handleAddToPlaylist(track);
                              }
                            }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                              isAdded 
                                ? 'bg-gray-600 text-gray-300' 
                                : 'bg-(--yellow) text-(--background-brown) hover:opacity-90'
                            }`}
                            title={isAdded ? 'Déjà ajouté' : 'Ajouter à la playlist'}
                          >
                            {isAdded ? <Minus size={16} /> : <Plus size={16} />}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Aucun résultat */}
            {tracks.length === 0 && albums.length === 0 && artists.length === 0 && playlists.length === 0 && events.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <SearchIcon size={48} className="mb-4 opacity-50" />
                <p>Aucun résultat trouvé pour "{searchQuery}"</p>
                <p className="text-sm mt-1">Essaie avec d'autres termes</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <NavBar />
    </main>
  );
}
