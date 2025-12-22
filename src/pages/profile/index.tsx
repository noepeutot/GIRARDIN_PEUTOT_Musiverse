import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { Music2, MessageCircle, ListMusic, Settings } from 'lucide-react';
import { NavBar } from '@/ui/navBar';
import { Post } from '@/ui/post';
import { PostType } from '@/pages/home';
import { PlaylistCard } from '@/ui/playlistCard';
import { PageHeader } from '@/ui/PageHeader';
import { FollowersModal } from '@/ui/FollowersModal';
import { EditProfileModal } from '@/ui/EditProfileModal';
import { usePlayer } from '@/lib/playerContext';
import { useAuth } from '@/lib/authContext';
import { usePlaylist } from '@/lib/playlistContext';
import { useFollow } from '@/lib/followContext';
import { useUserMusic } from '@/lib/userMusicContext';
import { SAMPLE_POST_CONTENTS } from '@/lib/sampleData';
import { Play } from 'lucide-react';

export default function UserProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateProfile } = useAuth();
  const { currentTrack, playTrack, isPlaying, pause, currentSourceId } = usePlayer();
  const { playlists } = usePlaylist();
  const { userTracks } = useUserMusic();
  const { followingCount, followersCount } = useFollow();
  
  const [activeTab, setActiveTab] = useState<'feed' | 'music' | 'playlists'>('feed');
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followModalMode, setFollowModalMode] = useState<'followers' | 'following'>('followers');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Lire le tab depuis l'URL au chargement
  useEffect(() => {
    const tabFromUrl = router.query.tab;
    if (tabFromUrl === 'music' || tabFromUrl === 'playlists' || tabFromUrl === 'feed') {
      setActiveTab(tabFromUrl);
    }
  }, [router.query.tab]);

  // Fonction pour changer de tab et mettre à jour l'URL
  const handleTabChange = (tab: 'feed' | 'music' | 'playlists') => {
    setActiveTab(tab);
    router.replace({
      pathname: router.pathname,
      query: { ...router.query, tab }
    }, undefined, { shallow: true });
  };

  // Rediriger si non connecté
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Récupérer les vrais posts de l'utilisateur depuis localStorage + posts simulés
  const userPosts = useMemo((): PostType[] => {
    if (!user) return [];
    
    // Importer les posts utilisateur de localStorage
    const { getUserPosts } = require('@/lib/feedUtils');
    const realUserPosts = getUserPosts();
    
    // Convertir les posts localStorage en PostType
    const convertedRealPosts: PostType[] = realUserPosts.map((p: {
      id: string; username: string; artistImage: string; content: string; datePosted: Date;
      numberComment: number; numberLike: number; numberView: number; numberReshare: number;
      attachedTracks?: Array<{ id: string; name: string; artist: string; image: string }>;
      attachedPlaylist?: { id: string; name: string; coverImage: string };
      attachedEvent?: { id: string; name: string; artist: string; venue: string; city: string; date: string; price: string; category: string };
      poll?: { question: string; options: string[] };
    }) => ({
      id: p.id,
      username: p.username,
      datePosted: new Date(p.datePosted),
      content: p.content,
      numberComment: p.numberComment,
      numberLike: p.numberLike,
      numberView: p.numberView,
      numberReshare: p.numberReshare,
      artistImage: p.artistImage,
      attachedTracks: p.attachedTracks,
      attachedPlaylist: p.attachedPlaylist,
      attachedEvent: p.attachedEvent,
      poll: p.poll,
    }));
    
    // Générer des posts simulés
    const seed = parseInt(user.id.replace('user_', '')) || 12345;
    const numPosts = 5;
    
    const simulatedPosts: PostType[] = Array.from({ length: numPosts }, (_, i) => {
      const contentIndex = (seed + i) % SAMPLE_POST_CONTENTS.length;
      const hoursAgo = (i + 1) * 2 + ((seed * i) % 10);
      
      return {
        username: user.displayName,
        datePosted: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
        content: SAMPLE_POST_CONTENTS[contentIndex],
        numberComment: 10 + ((seed * (i + 1) * 3) % 90),
        numberLike: 50 + ((seed * (i + 1) * 7) % 450),
        numberView: 500 + ((seed * (i + 1) * 11) % 4500),
        numberReshare: 5 + ((seed * (i + 1) * 5) % 45),
        artistImage: user.image,
      };
    });
    
    // Fusionner et trier par date (plus récent en premier)
    return [...convertedRealPosts, ...simulatedPosts].sort(
      (a, b) => b.datePosted.getTime() - a.datePosted.getTime()
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshKey]);

  // Playlists publiques de l'utilisateur (exclure favoris)
  const publicPlaylists = useMemo(() => {
    return playlists.filter(p => p.id !== 'favorites');
  }, [playlists]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
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
    <main className={`flex flex-col min-h-screen ${bottomPadding}`}>
      <PageHeader title="Mon Profil" showLogout />

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
          />
        </div>
        
        {/* Name */}
        <h2 className="text-xl font-bold text-gray-900 mb-1">{user.displayName}</h2>
        <p className="text-sm text-gray-500 mb-4">@{user.username}</p>
        
        {/* Bio */}
        <p className="text-center text-gray-600 mb-4 max-w-xs">{user.bio}</p>
        
        {/* Stats */}
        <div className="flex gap-8 mb-6">
          <button 
            onClick={() => { setFollowModalMode('followers'); setShowFollowersModal(true); }}
            className="text-center hover:opacity-70 transition-opacity"
          >
            <p className="text-lg font-bold text-gray-900">{formatNumber(followersCount)}</p>
            <p className="text-xs text-gray-500">Abonnés</p>
          </button>
          <button 
            onClick={() => { setFollowModalMode('following'); setShowFollowersModal(true); }}
            className="text-center hover:opacity-70 transition-opacity"
          >
            <p className="text-lg font-bold text-gray-900">{formatNumber(followingCount)}</p>
            <p className="text-xs text-gray-500">Abonnements</p>
          </button>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{publicPlaylists.length}</p>
            <p className="text-xs text-gray-500">Playlists</p>
          </div>
        </div>

        {/* Edit Profile Button */}
        <button 
          onClick={() => setShowEditProfile(true)}
          className="px-6 py-2 bg-(--brown) text-(--text-color) font-semibold rounded-full hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Settings size={16} />
          Modifier le profil
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => handleTabChange('feed')}
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
          onClick={() => handleTabChange('music')}
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
          onClick={() => handleTabChange('playlists')}
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
      <div className="flex-1">
        {activeTab === 'feed' && (
          <div className="px-4 py-4 flex flex-col gap-3">
            {userPosts.map((post, index) => (
              <Post 
                key={post.id || index} 
                post={post} 
                hideSubscribe 
                onDelete={() => setRefreshKey(k => k + 1)}
              />
            ))}
          </div>
        )}

        {activeTab === 'music' && (
          <div className="px-4 py-4">
            {userTracks.length > 0 ? (
              <div className="flex flex-col gap-3">
                {userTracks.map((track) => (
                  <div 
                    key={track.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-(--brown)/30 transition-colors"
                    onClick={() => playTrack(track as any)}
                  >
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image 
                        src={track.image || '/albumCoverExample.png'} 
                        alt={track.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                        <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
                          <Play size={14} className="ml-0.5 text-(--brown)" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">{track.name}</h4>
                      <p className="text-sm text-gray-500 truncate">{track.artist_name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Ajouté le {new Date(track.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Music2 size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pas encore de musiques</h3>
                <p className="text-gray-500 max-w-xs">
                  Tes musiques personnelles apparaîtront ici
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'playlists' && (
          <div>
            {publicPlaylists.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-4">
                {publicPlaylists.map((playlist) => {
                  const isCurrentPlaylist = currentSourceId === playlist.id;
                  
                  return (
                    <PlaylistCard 
                      key={playlist.id} 
                      playlist={playlist}
                      variant="light"
                      isCurrentlyPlaying={isCurrentPlaylist}
                      isPlaying={isPlaying && isCurrentPlaylist}
                      onPlay={() => {
                        if (playlist.tracks.length > 0) {
                          playTrack(playlist.tracks[0], playlist.tracks, playlist.id);
                        }
                      }}
                      onPause={() => pause()}
                    />
                  );
                })}
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

      {/* Modal abonnés/abonnements */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        mode={followModalMode}
        title={followModalMode === 'followers' ? 'Abonnés' : 'Abonnements'}
      />

      {/* Modal modifier profil */}
      {user && (
        <EditProfileModal
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          user={user}
          onSave={(updates) => updateProfile(updates)}
        />
      )}

      <NavBar />
    </main>
  );
}
