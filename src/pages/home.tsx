import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { NavBar } from "@/ui/navBar";
import { Post } from "@/ui/post";
import { PageHeader } from "@/ui/PageHeader";
import { getPopularArtists } from "@/lib/jamendoApi";
import { JamendoArtist } from "@/lib/types";
import { generateRandomPosts, generateNewerPosts, GeneratedPost } from "@/lib/feedUtils";
import { usePlayer } from "@/lib/playerContext";
import { useAuth } from "@/lib/authContext";
import { ensureArtistsLoaded } from "@/lib/artistsCache";

export interface PostType {
  username: string;
  datePosted: Date;
  content: string;
  numberComment: number;
  numberLike: number;
  numberView: number;
  numberReshare: number;
  music?: MusicType;
  artistImage?: string;
  artistId?: string; // ID de l'artiste pour la navigation
}

export interface MusicType {
  title: string;
  artist: string;
  albumCover: string;
  url: string;
}

export const musicExample: MusicType = {
  title: "Have Heart",
  artist: "Heartless",
  albumCover: "/albumCoverExample.png",
  url: "/musicExample.mp4",
};

export default function Home() {
  const { currentTrack } = usePlayer();
  const { user, isAuthenticated } = useAuth();
  
  const [artists, setArtists] = useState<JamendoArtist[]>([]);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [usedPostIds, setUsedPostIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  
  const feedRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Charger les artistes au montage
  useEffect(() => {
    const loadArtists = async () => {
      try {
        // Charger les artistes pour les posts et pour le cache (photos de commentaires)
        await ensureArtistsLoaded(); // Charge en parallèle pour les commentaires
        const popularArtists = await getPopularArtists(30);
        setArtists(popularArtists);
        
        // Générer les premiers posts
        const initialPosts = generateRandomPosts(popularArtists, 10);
        setPosts(initialPosts);
        setUsedPostIds(new Set(initialPosts.map(p => p.id)));
      } catch (error) {
        console.error("Erreur lors du chargement des artistes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadArtists();
  }, []);
  
  // Afficher le bouton refresh après 5 secondes
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRefreshButton(true);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Intersection Observer pour le scroll infini vers le bas
  useEffect(() => {
    if (!loadMoreRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && artists.length > 0) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(loadMoreRef.current);
    
    return () => observer.disconnect();
  }, [artists, isLoadingMore, usedPostIds]);
  
  // Charger plus de posts (scroll vers le bas)
  const loadMorePosts = useCallback(() => {
    if (isLoadingMore || artists.length === 0) return;
    
    setIsLoadingMore(true);
    
    // Simulation d'un délai réseau
    setTimeout(() => {
      const newPosts = generateRandomPosts(artists, 5, usedPostIds);
      
      setPosts(prev => [...prev, ...newPosts]);
      setUsedPostIds(prev => {
        const newSet = new Set(prev);
        newPosts.forEach(p => newSet.add(p.id));
        return newSet;
      });
      setIsLoadingMore(false);
    }, 500);
  }, [artists, isLoadingMore, usedPostIds]);
  
  // Pull-to-refresh (scroll vers le haut)
  const handleRefresh = useCallback(() => {
    if (isRefreshing || artists.length === 0) return;
    
    setIsRefreshing(true);
    
    setTimeout(() => {
      const newPosts = generateNewerPosts(artists, 3);
      
      setPosts(prev => [...newPosts, ...prev]);
      setUsedPostIds(prev => {
        const newSet = new Set(prev);
        newPosts.forEach(p => newSet.add(p.id));
        return newSet;
      });
      setIsRefreshing(false);
    }, 500);
  }, [artists, isRefreshing]);
  
  // Convertir GeneratedPost en PostType
  const convertToPostType = (post: GeneratedPost): PostType => ({
    username: post.username,
    datePosted: post.datePosted,
    content: post.content,
    numberComment: post.numberComment,
    numberLike: post.numberLike,
    numberView: post.numberView,
    numberReshare: post.numberReshare,
    artistImage: post.artistImage,
    artistId: post.artistId,
  });
  
  const bottomPadding = currentTrack ? 'pb-36' : 'pb-24';

  return (
    <main className={`flex flex-col ${bottomPadding} box-border`}>
      <PageHeader title="Fil d'actualité" showNotifications />
      
      {/* Pull-to-refresh indicator */}
      {isRefreshing && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-(--brown)"></div>
        </div>
      )}
      
      {/* Bouton refresh en haut - affiché après 5 secondes */}
      {showRefreshButton && !isLoading && posts.length > 0 && (
        <div className="flex justify-center my-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 text-sm font-medium text-(--brown) bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full transition-colors disabled:opacity-50 shadow-sm"
          >
            {isRefreshing ? 'Chargement...' : '↑ Actualiser'}
          </button>
        </div>
      )}
      
      {/* Feed */}
      <div ref={feedRef} className="flex flex-col gap-y-3 mx-5">
        {isLoading ? (
          // Skeleton loading
          <div className="flex flex-col gap-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          // Posts
          posts.map((post) => (
            <Post key={post.id} post={convertToPostType(post)} />
          ))
        )}
        
        {/* Load more trigger */}
        <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
          {isLoadingMore && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-(--brown)"></div>
          )}
        </div>
      </div>
      
      <NavBar />
    </main>
  );
}
