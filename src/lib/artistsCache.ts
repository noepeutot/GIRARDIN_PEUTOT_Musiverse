/**
 * Cache global pour les artistes Jamendo
 * Utilisé pour les photos de profil des commentaires
 */

import { JamendoArtist } from './types';
import { getPopularArtists } from './jamendoApi';

// Cache en mémoire des artistes
let artistsCache: JamendoArtist[] = [];
let isLoading = false;
let loadPromise: Promise<JamendoArtist[]> | null = null;

/**
 * Charge les artistes si ce n'est pas déjà fait
 */
export async function ensureArtistsLoaded(): Promise<JamendoArtist[]> {
  // Si déjà en cache, retourner directement
  if (artistsCache.length > 0) {
    return artistsCache;
  }
  
  // Si déjà en cours de chargement, attendre la promesse existante
  if (isLoading && loadPromise) {
    return loadPromise;
  }
  
  // Sinon, charger
  isLoading = true;
  loadPromise = getPopularArtists(30)
    .then(artists => {
      artistsCache = artists;
      isLoading = false;
      return artists;
    })
    .catch(error => {
      console.error('Erreur lors du chargement des artistes:', error);
      isLoading = false;
      return [];
    });
  
  return loadPromise;
}

/**
 * Récupère une image d'artiste aléatoire du cache
 */
export function getRandomArtistImage(): string {
  if (artistsCache.length === 0) {
    return '/photoProfil.png';
  }
  
  const randomIndex = Math.floor(Math.random() * artistsCache.length);
  return artistsCache[randomIndex].image || '/photoProfil.png';
}

/**
 * Récupère une image d'artiste basée sur un index (déterministe)
 */
export function getArtistImageByIndex(index: number): string {
  if (artistsCache.length === 0) {
    return '/photoProfil.png';
  }
  
  const artistIndex = index % artistsCache.length;
  return artistsCache[artistIndex].image || '/photoProfil.png';
}

/**
 * Récupère les artistes du cache (peut être vide si pas encore chargé)
 */
export function getCachedArtists(): JamendoArtist[] {
  return artistsCache;
}
