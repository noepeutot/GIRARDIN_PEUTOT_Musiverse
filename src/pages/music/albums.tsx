import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { NavBar } from '@/ui/navBar';
import { PageHeader } from '@/ui/PageHeader';
import { JamendoAlbum } from '@/lib/types';
import { getPopularAlbums } from '@/lib/jamendoApi';
import { usePlayer } from '@/lib/playerContext';
import { useBodyTheme } from '@/lib/useBodyTheme';

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<JamendoAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  const { currentTrack } = usePlayer();

  useBodyTheme('dark');

  useEffect(() => {
    const loadAlbums = async () => {
      setLoading(true);
      try {
        const data = await getPopularAlbums(20);
        setAlbums(data);
      } catch (error) {
        console.error('Erreur chargement albums:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAlbums();
  }, []);

  const bottomPadding = currentTrack ? 'pb-36' : 'pb-24';

  return (
    <main className={`flex flex-col min-h-screen ${bottomPadding}`}>
      <PageHeader title="Albums Populaires" showBack variant="dark" />

      <div className="flex-grow px-4 pt-4">
        <p className="text-sm text-gray-400 mb-4">
          Découvre les albums les plus populaires
        </p>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--yellow)"></div>
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Aucun album disponible</p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/music/album/${album.id}`}
                className="w-36 group"
              >
                <div className="relative w-36 h-36 rounded-xl overflow-hidden mb-2 shadow-lg">
                  <Image
                    src={album.image || '/albumCoverExample.png'}
                    alt={album.name}
                    fill
                    sizes="144px"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <p className="text-sm font-medium text-(--text-color) truncate">
                  {album.name}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {album.artist_name}
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
