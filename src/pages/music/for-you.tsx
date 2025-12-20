import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { ChevronLeft, MoreVertical } from 'lucide-react';
import { NavBar } from '@/ui/navBar';
import { AddToPlaylistModal } from '@/ui/addToPlaylistModal';
import { CreatePlaylistModal } from '@/ui/createPlaylistModal';
import { JamendoTrack } from '@/lib/types';
import { getPopularTracks, getTracksByArtist, formatDuration } from '@/lib/jamendoApi';
import { usePlayer } from '@/lib/playerContext';
import { usePlaylist, FAVORITES_PLAYLIST_ID } from '@/lib/playlistContext';

// Clé localStorage pour le cache des recommandations
const RECOMMENDATIONS_CACHE_KEY = 'musiverse_recommendations';
const RECOMMENDATIONS_HASH_KEY = 'musiverse_recommendations_hash';

// Générer un hash des likes pour détecter les changements
function generateLikesHash(tracks: JamendoTrack[]): string {
  return tracks.map(t => t.id).sort().join(',');
}

// Récupérer les recommandations du cache
function getCachedRecommendations(): JamendoTrack[] | null {
  try {
    const cached = localStorage.getItem(RECOMMENDATIONS_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

// Sauvegarder les recommandations en cache
function setCachedRecommendations(tracks: JamendoTrack[], hash: string): void {
  try {
    localStorage.setItem(RECOMMENDATIONS_CACHE_KEY, JSON.stringify(tracks));
    localStorage.setItem(RECOMMENDATIONS_HASH_KEY, hash);
  } catch (e) {
    console.error('Erreur sauvegarde cache recommandations:', e);
  }
}

// Récupérer le hash sauvegardé
function getCachedHash(): string | null {
  try {
    return localStorage.getItem(RECOMMENDATIONS_HASH_KEY);
  } catch {
    return null;
  }
}

export default function ForYouPage() {
  const router = useRouter();
  const [recommendedTracks, setRecommendedTracks] = useState<JamendoTrack[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<JamendoTrack | null>(null);

  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { playlists, createPlaylist } = usePlaylist();

  // Récupérer les titres likés
  const likedTracks = useMemo(() => {
    const favorites = playlists.find(p => p.id === FAVORITES_PLAYLIST_ID);
    return favorites?.tracks || [];
  }, [playlists]);

  // Obtenir les artistes uniques des titres likés
  const likedArtists = useMemo(() => {
    const artists = likedTracks.map(t => t.artist_name);
    return [...new Set(artists)];
  }, [likedTracks]);

  // Hash des likes pour détecter les changements
  const currentHash = useMemo(() => generateLikesHash(likedTracks), [likedTracks]);

  const loadRecommendations = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    
    // Vérifier le cache
    const cachedHash = getCachedHash();
    const cached = getCachedRecommendations();
    
    // Utiliser le cache si disponible et que les likes n'ont pas changé
    if (!forceRefresh && cached && cached.length > 0 && cachedHash === currentHash) {
      setRecommendedTracks(cached);
      setLoading(false);
      return;
    }

    try {
      let tracks: JamendoTrack[] = [];

      if (likedArtists.length > 0) {
        // Chercher des tracks des artistes likés (max 5 artistes pour plus de variété)
        const artistsToFetch = likedArtists.slice(0, 5);
        const artistTracksPromises = artistsToFetch.map(artist => 
          getTracksByArtist(artist, 6).catch(() => [])
        );
        
        const artistTracksResults = await Promise.all(artistTracksPromises);
        const allTracks = artistTracksResults.flat();
        
        // Exclure les tracks déjà likées
        const likedIds = new Set(likedTracks.map(t => t.id));
        const filteredTracks = allTracks.filter(t => !likedIds.has(t.id));
        
        // Limiter à 3 tracks max par artiste
        const artistCount = new Map<string, number>();
        const limitedTracks = filteredTracks.filter(t => {
          const count = artistCount.get(t.artist_name) || 0;
          if (count < 3) {
            artistCount.set(t.artist_name, count + 1);
            return true;
          }
          return false;
        });
        
        // Mélanger de manière déterministe pour cohérence
        const seed = currentHash.split(',').length;
        tracks = limitedTracks.sort((a, b) => {
          const aVal = (a.id.charCodeAt(0) + seed) % 10;
          const bVal = (b.id.charCodeAt(0) + seed) % 10;
          return aVal - bVal;
        }).slice(0, 20);
      }
      
      // Si pas assez de recommendations, compléter avec des tracks populaires
      if (tracks.length < 20) {
        const popularTracks = await getPopularTracks(20 - tracks.length);
        const existingIds = new Set([...tracks.map(t => t.id), ...likedTracks.map(t => t.id)]);
        const filteredPopular = popularTracks.filter(t => !existingIds.has(t.id));
        tracks = [...tracks, ...filteredPopular];
      }

      // Sauvegarder en cache
      setCachedRecommendations(tracks, currentHash);
      setRecommendedTracks(tracks);
    } catch (error) {
      console.error('Erreur lors du chargement des recommandations:', error);
      // Fallback sur les tracks populaires
      const popular = await getPopularTracks(20);
      setCachedRecommendations(popular, currentHash);
      setRecommendedTracks(popular);
    } finally {
      setLoading(false);
    }
  }, [likedArtists, likedTracks, currentHash]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handlePlayTrack = (track: JamendoTrack) => {
    playTrack(track, recommendedTracks);
  };

  const handleAddToPlaylist = (track: JamendoTrack) => {
    setSelectedTrack(track);
    setShowAddToPlaylist(true);
  };

  const bottomPadding = currentTrack ? 'pb-36' : 'pb-24';

  return (
    <main className={`flex flex-col min-h-screen ${bottomPadding} bg-gradient-to-b from-[#2a2518] via-[#1a1610] to-[#0d0b08]`}>
      {/* Header */}
      <header className="sticky top-0 z-30 px-4 py-4 bg-[#2a2518]/80 backdrop-blur-lg">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft size={24} className="text-(--text-color)" />
          </button>
          <h1 className="font-bold text-xl text-(--text-color)">Pour Toi</h1>
        </div>
      </header>

      <div className="flex-grow px-4">
        {/* Info sur les recommandations */}
        {likedArtists.length > 0 && (
          <p className="text-sm text-gray-400 mb-4">
            Basé sur tes artistes préférés : {likedArtists.slice(0, 3).join(', ')}{likedArtists.length > 3 ? '...' : ''}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--yellow)"></div>
          </div>
        ) : recommendedTracks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-2">Aucune recommandation disponible</p>
            <p className="text-sm text-gray-500">Like des titres pour obtenir des recommandations personnalisées !</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recommendedTracks.map((track, index) => {
              const isCurrentTrack = currentTrack?.id === track.id;
              
              return (
                <div 
                  key={track.id}
                  className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  {/* Numéro ou indicateur */}
                  <div className="w-8 text-center">
                    {isCurrentTrack && isPlaying ? (
                      <div className="flex items-center justify-center gap-0.5">
                        <span className="w-0.5 h-3 bg-(--yellow) rounded-full animate-pulse" />
                        <span className="w-0.5 h-4 bg-(--yellow) rounded-full animate-pulse delay-75" />
                        <span className="w-0.5 h-2 bg-(--yellow) rounded-full animate-pulse delay-150" />
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">{(index + 1).toString().padStart(2, '0')}</span>
                    )}
                  </div>

                  {/* Cover */}
                  <div 
                    className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                    onClick={() => handlePlayTrack(track)}
                  >
                    <Image
                      src={track.album_image || track.image || '/albumCoverExample.png'}
                      alt={track.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>

                  {/* Infos */}
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handlePlayTrack(track)}
                  >
                    <p className={`text-sm font-medium truncate ${isCurrentTrack ? 'text-(--yellow)' : 'text-(--text-color)'}`}>
                      {track.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {track.artist_name} • {formatDuration(track.duration)}
                    </p>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleAddToPlaylist(track)}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-full transition-all"
                  >
                    <MoreVertical size={16} className="text-gray-400" />
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

// Exporter les fonctions utilitaires pour les réutiliser sur /music
export { getCachedRecommendations, setCachedRecommendations, getCachedHash, generateLikesHash };
