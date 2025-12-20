import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { JamendoAlbum } from '@/lib/types';

interface AlbumCardProps {
  album: JamendoAlbum;
}

export function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link 
      href={`/music/album/${album.id}`}
      className="flex-shrink-0 w-36 group"
    >
      <div className="relative w-36 h-36 rounded-lg overflow-hidden mb-2 shadow-md">
        <Image
          src={album.image || '/albumCoverExample.png'}
          alt={album.name}
          fill
          sizes="144px"
          className="object-cover group-hover:scale-105 transition-transform"
        />
      </div>
      <h3 className="text-sm font-medium text-(--text-color) truncate">{album.name}</h3>
      <p className="text-xs text-gray-400 truncate">{album.artist_name}</p>
    </Link>
  );
}
