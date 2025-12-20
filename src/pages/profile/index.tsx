import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Music2, MessageCircle, ListMusic, LogOut, Settings } from 'lucide-react';
import { NavBar } from '@/ui/navBar';
import { Post } from '@/ui/post';
import { PostType } from '@/pages/home';
import { PlaylistCard } from '@/ui/playlistCard';
import { usePlayer } from '@/lib/playerContext';
import { useAuth } from '@/lib/authContext';
import { usePlaylist } from '@/lib/playlistContext';

export default function UserProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { currentTrack } = usePlayer();
  const { playlists } = usePlaylist();
  
  const [activeTab, setActiveTab] = useState<'feed' | 'music' | 'playlists'>('feed');

  // Rediriger si non connecté
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Générer des posts simulés pour l'utilisateur
  const userPosts = useMemo((): PostType[] => {
    if (!user) return [];
    
    const postContents = [
      "🎵 Je viens de découvrir un artiste incroyable sur Musiverse ! Allez écouter ça !",
      "Ma playlist du moment est en feu 🔥 Qu'est-ce que vous écoutez ?",
      "Nouvelle semaine, nouvelle musique ! Drop vos recommandations 🎧",
    ];
    
    const seed = parseInt(user.id.replace('user_', '')) || 12345;
    
    return postContents.map((content, i) => ({
      username: user.displayName,
      datePosted: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
      content,
      numberComment: 10 + ((seed * (i + 1) * 3) % 90),
      numberLike: 50 + ((seed * (i + 1) * 7) % 450),
      numberView: 500 + ((seed * (i + 1) * 11) % 4500),
      numberReshare: 5 + ((seed * (i + 1) * 5) % 45),
      artistImage: user.image,
    }));
  }, [user]);

  // Playlists publiques de l'utilisateur (exclure favoris)
  const publicPlaylists = useMemo(() => {
    return playlists.filter(p => p.id !== 'favorites');
  }, [playlists]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const bottomPadding = currentTrack ? 'pb-36' : 'pb-24';

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <main className={`flex flex-col min-h-screen ${bottomPadding} bg-white`}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--brown)"></div>
        </div>
        <NavBar />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className={`flex flex-col min-h-screen ${bottomPadding} bg-white`}>
      {/* Header */}
      <header className="sticky top-0 z-30 px-4 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-800" />
            </button>
            <h1 className="font-bold text-lg text-gray-900">Mon Profil</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Se déconnecter"
            >
              <LogOut size={20} className="text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Profile Header */}
      <div className="px-4 py-6 flex flex-col items-center">
        {/* Avatar */}
        <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 border-3 border-(--yellow) shadow-lg">
          <Image
            src={user.image}
            alt={user.displayName}
            fill
            sizes="96px"
            className="object-cover"
            priority
          />
        </div>
        
        {/* Name */}
        <h2 className="text-xl font-bold text-gray-900 mb-1">{user.displayName}</h2>
        <p className="text-sm text-gray-500 mb-4">@{user.username}</p>
        
        {/* Bio */}
        <p className="text-center text-gray-600 mb-4 max-w-xs">{user.bio}</p>
        
        {/* Stats */}
        <div className="flex gap-8 mb-6">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{formatNumber(user.followers)}</p>
            <p className="text-xs text-gray-500">Abonnés</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{formatNumber(user.following)}</p>
            <p className="text-xs text-gray-500">Abonnements</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{publicPlaylists.length}</p>
            <p className="text-xs text-gray-500">Playlists</p>
          </div>
        </div>

        {/* Edit Profile Button */}
        <button className="px-6 py-2 bg-(--brown) text-(--text-color) font-semibold rounded-full hover:opacity-90 transition-opacity flex items-center gap-2">
          <Settings size={16} />
          Modifier le profil
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
          onClick={() => setActiveTab('playlists')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium transition-colors ${
            activeTab === 'playlists' 
              ? 'text-(--brown) border-b-2 border-(--brown)' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ListMusic size={18} />
          Playlists
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow px-4 py-4">
        {activeTab === 'feed' && (
          <div className="flex flex-col gap-y-3">
            {userPosts.map((post, index) => (
              <Post key={index} post={post} hideSubscribe />
            ))}
          </div>
        )}

        {activeTab === 'music' && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Music2 size={64} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pas encore de musique</h3>
            <p className="text-gray-500 max-w-xs">
              Cette section affiche les musiques que tu as produites. 
              Pour l'instant, tu n'as pas encore publié de titre.
            </p>
          </div>
        )}

        {activeTab === 'playlists' && (
          <div>
            {publicPlaylists.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {publicPlaylists.map((playlist) => (
                  <PlaylistCard key={playlist.id} playlist={playlist} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ListMusic size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pas encore de playlists</h3>
                <p className="text-gray-500 max-w-xs">
                  Crée ta première playlist depuis la page Musique !
                </p>
                <Link 
                  href="/music"
                  className="mt-4 px-6 py-2 bg-(--brown) text-(--text-color) font-semibold rounded-full hover:opacity-90 transition-opacity"
                >
                  Créer une playlist
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <NavBar />
    </main>
  );
}
