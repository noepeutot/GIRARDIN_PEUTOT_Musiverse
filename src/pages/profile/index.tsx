import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Music2, Users, User } from 'lucide-react';
import { NavBar } from '@/ui/navBar';
import { JamendoArtist } from '@/lib/types';
import { getPopularArtists } from '@/lib/jamendoApi';
import { usePlayer } from '@/lib/playerContext';

export default function ProfilePage() {
  const router = useRouter();
  const [popularArtists, setPopularArtists] = useState<JamendoArtist[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { currentTrack } = usePlayer();

  useEffect(() => {
    async function loadArtists() {
      try {
        const artists = await getPopularArtists(12);
        setPopularArtists(artists);
      } catch (error) {
        console.error('Erreur lors du chargement des artistes:', error);
      } finally {
        setLoading(false);
      }
    }
    loadArtists();
  }, []);

  const bottomPadding = currentTrack ? 'pb-36' : 'pb-24';

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
          <h1 className="font-bold text-lg text-gray-800">Profils</h1>
        </div>
      </header>

      {/* User Profile Card */}
      <div className="px-4 py-6">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Users size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Utilisateur</h2>
              <p className="text-amber-100">Connecte-toi pour voir ton profil</p>
            </div>
          </div>
          <button className="w-full py-2 bg-white text-amber-600 font-semibold rounded-full hover:bg-amber-50 transition-colors">
            Se connecter
          </button>
        </div>
      </div>

      {/* Popular Artists */}
      <div className="px-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Artistes populaires</h2>
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {popularArtists.map((artist) => (
              <Link
                key={artist.id}
                href={`/profile/${artist.id}`}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-amber-500 transition-colors">
                  {artist.image ? (
                    <Image
                      src={artist.image}
                      alt={artist.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <User size={32} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-800 text-center truncate w-full font-medium">
                  {artist.name}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <NavBar />
    </main>
  );
}
