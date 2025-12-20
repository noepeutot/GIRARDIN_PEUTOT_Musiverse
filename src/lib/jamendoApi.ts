/**
 * Client API Jamendo
 * Documentation: https://developer.jamendo.com/v3.0
 */

import { JamendoTrack, JamendoAlbum, JamendoArtist, JamendoResponse } from './types';

// Client ID Jamendo (public, non sensible)
const JAMENDO_CLIENT_ID = '9c6f8d2a';
const JAMENDO_API_BASE = 'https://api.jamendo.com/v3.0';

/**
 * Effectue une requête à l'API Jamendo
 */
async function jamendoFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<JamendoResponse<T>> {
  const searchParams = new URLSearchParams({
    client_id: JAMENDO_CLIENT_ID,
    format: 'json',
    ...params,
  });

  const response = await fetch(`${JAMENDO_API_BASE}${endpoint}?${searchParams}`);
  
  if (!response.ok) {
    throw new Error(`Jamendo API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Récupère les pistes populaires avec pagination
 */
export async function getPopularTracks(limit: number = 20, offset: number = 0): Promise<JamendoTrack[]> {
  const response = await jamendoFetch<JamendoTrack>('/tracks/', {
    limit: limit.toString(),
    offset: offset.toString(),
    order: 'popularity_total',
    include: 'musicinfo',
    imagesize: '300',
  });
  return response.results;
}

/**
 * Récupère les pistes tendances (popularité de la semaine)
 */
export async function getTrendingTracks(limit: number = 20): Promise<JamendoTrack[]> {
  const response = await jamendoFetch<JamendoTrack>('/tracks/', {
    limit: limit.toString(),
    order: 'popularity_week',
    imagesize: '300',
  });
  return response.results;
}

/**
 * Recherche des pistes par terme
 */
export async function searchTracks(query: string, limit: number = 20): Promise<JamendoTrack[]> {
  const response = await jamendoFetch<JamendoTrack>('/tracks/', {
    search: query,
    limit: limit.toString(),
    imagesize: '300',
  });
  return response.results;
}

/**
 * Récupère les pistes par genre/tag
 */
export async function getTracksByTag(tag: string, limit: number = 20): Promise<JamendoTrack[]> {
  const response = await jamendoFetch<JamendoTrack>('/tracks/', {
    tags: tag,
    limit: limit.toString(),
    order: 'popularity_total',
    imagesize: '300',
  });
  return response.results;
}

/**
 * Récupère les pistes d'un artiste par nom
 */
export async function getTracksByArtist(artistName: string, limit: number = 10): Promise<JamendoTrack[]> {
  const response = await jamendoFetch<JamendoTrack>('/tracks/', {
    artist_name: artistName,
    limit: limit.toString(),
    order: 'popularity_total',
    imagesize: '300',
  });
  return response.results;
}

/**
 * Récupère les pistes d'un album
 * L'API retourne un album avec un tableau tracks imbriqué
 */
export async function getAlbumTracks(albumId: string): Promise<JamendoTrack[]> {
  interface AlbumWithTracks {
    id: string;
    name: string;
    releasedate: string;
    artist_id: string;
    artist_name: string;
    image: string;
    tracks: Array<{
      id: string;
      name: string;
      duration: string;
      position: string;
      audio: string;
      audiodownload: string;
      license_ccurl: string;
    }>;
  }
  
  const response = await jamendoFetch<AlbumWithTracks>('/albums/tracks/', {
    id: albumId,
    imagesize: '300',
  });
  
  if (response.results.length === 0) {
    return [];
  }
  
  const album = response.results[0];
  
  // Convertir les tracks de l'album en JamendoTrack avec les infos de l'album
  return album.tracks
    .sort((a, b) => parseInt(a.position) - parseInt(b.position))
    .map(track => ({
      id: track.id,
      name: track.name,
      duration: parseInt(track.duration),
      artist_id: album.artist_id,
      artist_name: album.artist_name,
      artist_idstr: '',
      album_name: album.name,
      album_id: album.id,
      license_ccurl: track.license_ccurl,
      position: parseInt(track.position),
      releasedate: album.releasedate,
      album_image: album.image,
      audio: track.audio,
      audiodownload: track.audiodownload,
      prourl: '',
      shorturl: '',
      shareurl: '',
      image: album.image,
    }));
}

/**
 * Récupère les albums populaires avec plus d'un titre
 */
export async function getPopularAlbums(limit: number = 20): Promise<JamendoAlbum[]> {
  // Demander plus d'albums pour pouvoir filtrer
  interface AlbumWithTracks extends JamendoAlbum {
    tracks?: { id: string }[];
  }
  
  const response = await jamendoFetch<AlbumWithTracks>('/albums/tracks/', {
    limit: Math.min(limit * 3, 50).toString(),
    order: 'popularity_total',
    imagesize: '300',
  });
  
  // Filtrer les albums avec plus d'un titre
  const albumsWithMultipleTracks = response.results.filter(album => 
    album.tracks && album.tracks.length > 1
  );
  
  // Retourner sans le champ tracks
  return albumsWithMultipleTracks.slice(0, limit).map(album => ({
    id: album.id,
    name: album.name,
    releasedate: album.releasedate,
    artist_id: album.artist_id,
    artist_name: album.artist_name,
    image: album.image,
    zip: album.zip,
    shorturl: album.shorturl,
    shareurl: album.shareurl,
  }));
}

/**
 * Recherche des albums
 */
export async function searchAlbums(query: string, limit: number = 20): Promise<JamendoAlbum[]> {
  const response = await jamendoFetch<JamendoAlbum>('/albums/', {
    search: query,
    limit: limit.toString(),
    imagesize: '300',
  });
  return response.results;
}

/**
 * Récupère les artistes populaires (uniquement ceux avec une vraie image)
 */
export async function getPopularArtists(limit: number = 20): Promise<JamendoArtist[]> {
  // On demande plus d'artistes pour pouvoir filtrer ceux avec image
  const response = await jamendoFetch<JamendoArtist>('/artists/', {
    limit: Math.min(limit * 3, 50).toString(),
    order: 'popularity_total',
    imagesize: '300',
    hasimage: 'true',
  });
  
  // Filtrer les artistes qui ont une vraie image (pas vide et pas un placeholder générique)
  const artistsWithImage = response.results.filter(artist => 
    artist.image && 
    artist.image.length > 0 && 
    !artist.image.includes('default')
  );
  
  return artistsWithImage.slice(0, limit);
}

/**
 * Recherche des artistes
 */
export async function searchArtists(query: string, limit: number = 20): Promise<JamendoArtist[]> {
  const response = await jamendoFetch<JamendoArtist>('/artists/', {
    search: query,
    limit: limit.toString(),
    imagesize: '300',
  });
  return response.results;
}

/**
 * Récupère un artiste par son ID
 */
export async function getArtistById(artistId: string): Promise<JamendoArtist | null> {
  const response = await jamendoFetch<JamendoArtist>('/artists/', {
    id: artistId,
    imagesize: '300',
  });
  return response.results.length > 0 ? response.results[0] : null;
}

/**
 * Récupère les tracks d'un artiste par son ID
 */
export async function getArtistTracksById(artistId: string, limit: number = 50): Promise<JamendoTrack[]> {
  const response = await jamendoFetch<JamendoTrack>('/artists/tracks/', {
    id: artistId,
    limit: limit.toString(),
    order: 'popularity_total',
    imagesize: '300',
  });
  return response.results;
}

/**
 * Tags musicaux populaires pour la navigation
 */
export const MUSIC_TAGS = [
  'pop', 'rock', 'electronic', 'hiphop', 'jazz', 
  'classical', 'ambient', 'metal', 'folk', 'reggae',
  'blues', 'country', 'indie', 'punk', 'soul'
];

/**
 * Formate la durée en mm:ss
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
