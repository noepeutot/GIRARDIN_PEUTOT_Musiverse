/**
 * Types pour l'API Jamendo
 * API Documentation: https://developer.jamendo.com/v3.0
 */

/** Représente une piste musicale de Jamendo */
export interface JamendoTrack {
  id: string;
  name: string;
  duration: number;
  artist_id: string;
  artist_name: string;
  artist_idstr: string;
  album_name: string;
  album_id: string;
  license_ccurl: string;
  position: number;
  releasedate: string;
  album_image: string;
  audio: string;
  audiodownload: string;
  prourl: string;
  shorturl: string;
  shareurl: string;
  image: string;
}

/** Représente un album de Jamendo */
export interface JamendoAlbum {
  id: string;
  name: string;
  releasedate: string;
  artist_id: string;
  artist_name: string;
  image: string;
  zip: string;
  shorturl: string;
  shareurl: string;
}

/** Représente un artiste de Jamendo */
export interface JamendoArtist {
  id: string;
  name: string;
  website: string;
  joindate: string;
  image: string;
  shorturl: string;
  shareurl: string;
}

/** Réponse générique de l'API Jamendo */
export interface JamendoResponse<T> {
  headers: {
    status: string;
    code: number;
    error_message: string;
    warnings: string;
    results_count: number;
  };
  results: T[];
}

/** Playlist locale (stockée côté client) */
export interface LocalPlaylist {
  id: string;
  name: string;
  description: string;
  tracks: JamendoTrack[];
  createdAt: Date;
  coverImage?: string;
}

/** État du lecteur audio */
export interface PlayerState {
  currentTrack: JamendoTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  queue: JamendoTrack[];
  queueIndex: number;
}
