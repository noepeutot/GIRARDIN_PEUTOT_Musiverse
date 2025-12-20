import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { ChevronLeft, Play, Music2, MessageCircle, Users, User } from 'lucide-react';
import { NavBar } from '@/ui/navBar';
import { JamendoTrack, JamendoArtist } from '@/lib/types';
import { getArtistById, getArtistTracksById, formatDuration } from '@/lib/jamendoApi';
import { usePlayer } from '@/lib/playerContext';

export default function ArtistProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [artist, setArtist] = useState<JamendoArtist | null>(null);
  const [tracks, setTracks] = useState<JamendoTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'music' | 'feed'>('music');
  
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  // Statistiques simulées mais constantes basées sur l'ID de l'artiste
  const { followers, following } = useMemo(() => {
    if (!id) return { followers: 0, following: 0 };
    // Utiliser l'ID pour générer des nombres pseudo-aléatoires mais constants
    const seed = typeof id === 'string' ? id.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
    return {
      followers: (seed * 1234) % 50000 + 1000,
      following: (seed * 567) % 500 + 50
    };
  }, [id]);

  useEffect(() => {
    async function loadArtist() {
      if (id && typeof id === 'string') {
        try {
          const [artistData, artistTracks] = await Promise.all([
            getArtistById(id),
            getArtistTracksById(id, 30)
          ]);
          setArtist(artistData);
          setTracks(artistTracks);
        } catch (error) {
          console.error('Erreur lors du chargement de l\'artiste:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    loadArtist();
  }, [id]);

  const handlePlayTrack = (track: JamendoTrack) => {
    playTrack(track, tracks);
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const bottomPadding = currentTrack ? 'pb-36' : 'pb-24';

  if (loading) {
    return (
      <main className={`flex flex-col min-h-screen ${bottomPadding} bg-white`}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
        <NavBar />
      </main>
    );
  }

  if (!artist) {
    return (
      <main className={`flex flex-col min-h-screen ${bottomPadding} bg-white`}>
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <p className="text-gray-600">Artiste non trouvé</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg"
          >
            Retour
          </button>
        </div>
        <NavBar />
      </main>
    );
  }

  return (
    <main className={`flex flex-col min-h-screen ${bottomPadding} bg-white`}>
      {/* Header */}
      <header className="sticky top-0 z-30 px-4 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-800" />
          </button>
          <h1 className="font-bold text-lg text-gray-800 truncate">{artist.name}</h1>
        </div>
      </header>

      {/* Profile Header */}
      <div className="px-4 py-6 flex flex-col items-center">
        {/* Avatar */}
        <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-amber-500">
          {artist.image ? (
            <Image
              src={artist.image}
              alt={artist.name}
              fill
              sizes="96px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <User size={48} className="text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Name */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">{artist.name}</h2>
        
        {/* Stats */}
        <div className="flex gap-8 mb-6">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{formatNumber(followers)}</p>
            <p className="text-xs text-gray-500">Abonnés</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{formatNumber(following)}</p>
            <p className="text-xs text-gray-500">Abonnements</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{tracks.length}</p>
            <p className="text-xs text-gray-500">Titres</p>
          </div>
        </div>

        {/* Follow Button */}
        <button className="px-8 py-2 bg-amber-500 text-white font-semibold rounded-full hover:bg-amber-600 transition-colors">
          Suivre
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('music')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium transition-colors ${
            activeTab === 'music' 
              ? 'text-amber-600 border-b-2 border-amber-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Music2 size={18} />
          Musique
        </button>
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium transition-colors ${
            activeTab === 'feed' 
              ? 'text-amber-600 border-b-2 border-amber-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageCircle size={18} />
          Feed
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow px-4 py-4">
        {activeTab === 'music' ? (
          <div>
            {/* Play All Button */}
            {tracks.length > 0 && (
              <button
                onClick={handlePlayAll}
                className="w-full mb-4 py-3 flex items-center justify-center gap-2 bg-amber-500 text-white font-semibold rounded-full hover:bg-amber-600 transition-colors"
              >
                <Play size={20} fill="currentColor" />
                Tout écouter
              </button>
            )}

            {/* Tracks List */}
            <div className="space-y-2">
              {tracks.map((track, index) => {
                const isCurrentTrack = currentTrack?.id === track.id;
                
                return (
                  <button
                    key={track.id}
                    onClick={() => handlePlayTrack(track)}
                    className="w-full flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    {/* Numéro ou indicateur */}
                    <div className="w-8 text-center">
                      {isCurrentTrack && isPlaying ? (
                        <div className="flex items-center justify-center gap-0.5">
                          <span className="w-0.5 h-3 bg-amber-500 rounded-full animate-pulse" />
                          <span className="w-0.5 h-4 bg-amber-500 rounded-full animate-pulse delay-75" />
                          <span className="w-0.5 h-2 bg-amber-500 rounded-full animate-pulse delay-150" />
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">{index + 1}</span>
                      )}
                    </div>

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

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isCurrentTrack ? 'text-amber-600' : 'text-gray-900'}`}>
                        {track.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {track.album_name} • {formatDuration(track.duration)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {tracks.length === 0 && (
              <div className="text-center py-12">
                <Music2 size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune musique disponible</p>
              </div>
            )}
          </div>
        ) : (
          /* Feed Tab */
          <div className="space-y-4">
            {/* Posts simulés */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    {artist.image ? (
                      <Image
                        src={artist.image}
                        alt={artist.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <User size={20} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{artist.name}</p>
                    <p className="text-xs text-gray-500">Il y a {i * 2} jours</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-3">
                  {i === 1 && "🎵 Nouvelle musique en préparation ! Restez connectés pour des surprises à venir..."}
                  {i === 2 && "Merci à tous pour votre soutien incroyable ! Votre énergie me motive chaque jour. ❤️"}
                  {i === 3 && "Session studio terminée ! Hâte de vous partager ce nouveau projet. 🎧✨"}
                </p>
                <div className="flex gap-4 text-gray-500 text-sm">
                  <span>❤️ {Math.floor(Math.random() * 500) + 50}</span>
                  <span>💬 {Math.floor(Math.random() * 100) + 10}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NavBar />
    </main>
  );
}
