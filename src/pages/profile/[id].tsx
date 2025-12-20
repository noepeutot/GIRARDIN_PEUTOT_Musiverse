import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { ChevronLeft, Play, Music2, MessageCircle, ListMusic, User } from 'lucide-react';
import { NavBar } from '@/ui/navBar';
import { Post } from '@/ui/post';
import { PostType } from '@/pages/home';
import { AlbumCard } from '@/ui/albumCard';
import { JamendoTrack, JamendoArtist, JamendoAlbum } from '@/lib/types';
import { getArtistById, getArtistTracksById, getArtistAlbums, formatDuration } from '@/lib/jamendoApi';
import { usePlayer } from '@/lib/playerContext';

export default function ArtistProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [artist, setArtist] = useState<JamendoArtist | null>(null);
  const [tracks, setTracks] = useState<JamendoTrack[]>([]);
  const [albums, setAlbums] = useState<JamendoAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'music' | 'albums'>('feed');
  
  const { playTrack, currentTrack, isPlaying, pause, resume } = usePlayer();

  // Statistiques simulées mais constantes basées sur l'ID de l'artiste
  const { followers, following } = useMemo(() => {
    if (!id) return { followers: 0, following: 0 };
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
          const [artistData, artistTracks, artistAlbums] = await Promise.all([
            getArtistById(id),
            getArtistTracksById(id, 30),
            getArtistAlbums(id, 20).catch(() => [])
          ]);
          setArtist(artistData);
          setTracks(artistTracks);
          setAlbums(artistAlbums);
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
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
      return;
    }
    playTrack(track, tracks);
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      if (currentTrack?.id === tracks[0].id) {
        if (isPlaying) {
          pause();
        } else {
          resume();
        }
        return;
      }
      playTrack(tracks[0], tracks);
    }
  };

  // Générer des posts simulés pour l'artiste
  const artistPosts = useMemo((): PostType[] => {
    if (!artist) return [];
    const seed = parseInt(artist.id) || 12345;
    
    const postContents = [
      "🎵 Nouvelle musique en préparation ! Restez connectés pour des surprises à venir...",
      "Merci à tous pour votre soutien incroyable ! Votre énergie me motive chaque jour. ❤️",
      "Session studio terminée ! Hâte de vous partager ce nouveau projet. 🎧✨",
    ];
    
    return postContents.map((content, i) => ({
      username: artist.name,
      datePosted: new Date(Date.now() - (i + 1) * 2 * 24 * 60 * 60 * 1000),
      content,
      numberComment: 1000 + ((seed * (i + 1) * 3) % 9000),
      numberLike: 5000 + ((seed * (i + 1) * 7) % 45000),
      numberView: 50000 + ((seed * (i + 1) * 11) % 950000),
      numberReshare: 500 + ((seed * (i + 1) * 5) % 4500),
      artistImage: artist.image,
    }));
  }, [artist]);

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--brown)"></div>
        </div>
        <NavBar />
      </main>
    );
  }

  if (!artist) {
    return (
      <main className={`flex flex-col min-h-screen ${bottomPadding} bg-white`}>
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <p className="text-gray-500">Artiste non trouvé</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-(--brown) text-(--text-color) rounded-lg"
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
      <header className="sticky top-0 z-30 px-4 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-800" />
          </button>
          <h1 className="font-bold text-lg text-gray-900 truncate">{artist.name}</h1>
        </div>
      </header>

      {/* Profile Header */}
      <div className="px-4 py-6 flex flex-col items-center">
        {/* Avatar */}
        <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 border-3 border-(--yellow) shadow-lg">
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
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
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
        <button className="px-8 py-2 bg-(--brown) text-(--text-color) font-semibold rounded-full hover:opacity-90 transition-opacity">
          Suivre
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium transition-colors ${
            activeTab === 'feed' 
              ? 'text-(--brown) border-b-2 border-(--brown)' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageCircle size={18} />
          Feed
        </button>
        <button
          onClick={() => setActiveTab('music')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium transition-colors ${
            activeTab === 'music' 
              ? 'text-(--brown) border-b-2 border-(--brown)' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Music2 size={18} />
          Musiques
        </button>
        <button
          onClick={() => setActiveTab('albums')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium transition-colors ${
            activeTab === 'albums' 
              ? 'text-(--brown) border-b-2 border-(--brown)' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ListMusic size={18} />
          Albums
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow px-4 py-4">
        {activeTab === 'feed' && (
          /* Feed Tab */
          <div className="flex flex-col gap-y-3">
            {artistPosts.map((post, index) => (
              <Post key={index} post={post} hideSubscribe />
            ))}
          </div>
        )}

        {activeTab === 'music' && (
          <div>
            {/* Play All Button */}
            {tracks.length > 0 && (
              <button
                onClick={handlePlayAll}
                className="w-full mb-4 py-3 flex items-center justify-center gap-2 bg-(--brown) text-(--text-color) font-semibold rounded-full hover:opacity-90 transition-opacity"
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
                          <span className="w-0.5 h-3 bg-(--brown) rounded-full animate-pulse" />
                          <span className="w-0.5 h-4 bg-(--brown) rounded-full animate-pulse delay-75" />
                          <span className="w-0.5 h-2 bg-(--brown) rounded-full animate-pulse delay-150" />
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
                      <p className={`text-sm font-medium truncate ${isCurrentTrack ? 'text-(--brown)' : 'text-gray-900'}`}>
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
        )}

        {activeTab === 'albums' && (
          <div>
            {albums.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {albums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ListMusic size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pas d'albums</h3>
                <p className="text-gray-500 max-w-xs">
                  Cet artiste n'a pas encore publié d'album.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <NavBar />
    </main>
  );
}
