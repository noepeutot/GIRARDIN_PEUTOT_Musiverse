// Utilitaires pour la génération de posts du feed
import { JamendoArtist } from './types';
import { SAMPLE_POST_CONTENTS } from './sampleData';

// Types pour les posts générés
export interface GeneratedPost {
  id: string;
  username: string;
  artistId: string;
  artistImage: string;
  content: string;
  datePosted: Date;
  numberComment: number;
  numberLike: number;
  numberView: number;
  numberReshare: number;
  // Extensions pour les pièces jointes
  attachedTracks?: Array<{ id: string; name: string; artist: string; artist_id?: string; image: string; audio?: string }>;
  attachedPlaylist?: { id: string; name: string; coverImage: string; tracks?: Array<{ id: string; name: string; artist_name?: string; artist_id?: string; image?: string; album_image?: string; duration?: number; audio?: string }> };
  attachedEvent?: { id: string; name: string; artist: string; artist_id?: string; venue: string; city: string; date: string; price: string; category: string };
  poll?: { question: string; options: string[] };
}

// Générer un ID unique pour un post
const generatePostId = (artistId: string, contentIndex: number, timestamp: number): string => {
  return `post_${artistId}_${contentIndex}_${timestamp}`;
};

// Mélanger un tableau (Fisher-Yates shuffle)
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Génère des posts aléatoires en utilisant les artistes Jamendo
 * @param artists Liste des artistes disponibles
 * @param count Nombre de posts à générer
 * @param existingIds Set des IDs de posts déjà affichés (pour éviter les doublons)
 * @param tracks Liste optionnelle de tracks à attacher aléatoirement
 * @returns Tableau de posts générés
 */
export const generateRandomPosts = (
  artists: JamendoArtist[],
  count: number,
  existingIds: Set<string> = new Set(),
  tracks: Array<{ id: string; name: string; artist_name: string; artist_id: string; image: string; audio: string }> = []
): GeneratedPost[] => {
  if (artists.length === 0) return [];
  
  const posts: GeneratedPost[] = [];
  const usedCombinations = new Set<string>();
  
  // Mélanger les artistes et les contenus
  const shuffledArtists = shuffleArray(artists);
  const shuffledContents = shuffleArray(SAMPLE_POST_CONTENTS);
  const shuffledTracks = shuffleArray(tracks);
  
  let attempts = 0;
  const maxAttempts = count * 10; // Évite les boucles infinies
  let trackIndex = 0;
  
  while (posts.length < count && attempts < maxAttempts) {
    attempts++;
    
    // Sélectionner un artiste et un contenu aléatoires
    const artist = shuffledArtists[Math.floor(Math.random() * shuffledArtists.length)];
    const contentIndex = Math.floor(Math.random() * shuffledContents.length);
    const content = shuffledContents[contentIndex];
    
    // Créer une combinaison unique
    const combinationKey = `${artist.id}_${contentIndex}`;
    
    if (usedCombinations.has(combinationKey)) continue;
    
    const timestamp = Date.now() - posts.length * (1000 * 60 * (5 + Math.floor(Math.random() * 55))); // Posts espacés de 5-60 min
    const postId = generatePostId(artist.id, contentIndex, timestamp);
    
    if (existingIds.has(postId)) continue;
    
    usedCombinations.add(combinationKey);
    
    // Attacher une track à environ 30% des posts
    let attachedTracks: GeneratedPost['attachedTracks'] = undefined;
    if (shuffledTracks.length > 0 && Math.random() < 0.3 && trackIndex < shuffledTracks.length) {
      const track = shuffledTracks[trackIndex];
      attachedTracks = [{
        id: track.id,
        name: track.name,
        artist: track.artist_name,
        artist_id: track.artist_id,
        image: track.image,
        audio: track.audio,
      }];
      trackIndex++;
    }
    
    posts.push({
      id: postId,
      username: artist.name,
      artistId: artist.id,
      artistImage: artist.image || '/photoProfil.png',
      content,
      datePosted: new Date(timestamp),
      numberComment: 0, // Sera généré dynamiquement
      numberLike: 0,    // Sera généré dynamiquement
      numberView: 0,    // Sera généré dynamiquement
      numberReshare: 0,
      ...(attachedTracks && { attachedTracks }),
    });
  }
  
  // Trier par date (plus récent en premier)
  return posts.sort((a, b) => b.datePosted.getTime() - a.datePosted.getTime());
};

/**
 * Génère des posts "nouveaux" pour le pull-to-refresh
 * @param artists Liste des artistes disponibles
 * @param count Nombre de posts à générer
 * @returns Tableau de posts avec des dates très récentes
 */
export const generateNewerPosts = (
  artists: JamendoArtist[],
  count: number
): GeneratedPost[] => {
  if (artists.length === 0) return [];
  
  const posts: GeneratedPost[] = [];
  const shuffledArtists = shuffleArray(artists);
  const shuffledContents = shuffleArray(SAMPLE_POST_CONTENTS);
  
  for (let i = 0; i < count && i < shuffledArtists.length; i++) {
    const artist = shuffledArtists[i];
    const contentIndex = Math.floor(Math.random() * shuffledContents.length);
    const content = shuffledContents[contentIndex];
    
    // Posts très récents (quelques secondes à quelques minutes)
    const timestamp = Date.now() - i * (1000 * (10 + Math.floor(Math.random() * 50)));
    const postId = generatePostId(artist.id, contentIndex, timestamp);
    
    posts.push({
      id: postId,
      username: artist.name,
      artistId: artist.id,
      artistImage: artist.image || '/photoProfil.png',
      content,
      datePosted: new Date(timestamp),
      numberComment: 0,
      numberLike: 0,
      numberView: 0,
      numberReshare: 0,
    });
  }
  
  return posts.sort((a, b) => b.datePosted.getTime() - a.datePosted.getTime());
};

// Clé localStorage pour les posts utilisateur
const USER_POSTS_STORAGE_KEY = 'musiverse_user_posts';

/**
 * Récupère les posts de l'utilisateur depuis localStorage
 */
export const getUserPosts = (): GeneratedPost[] => {
  try {
    const stored = localStorage.getItem(USER_POSTS_STORAGE_KEY);
    if (stored) {
      const posts = JSON.parse(stored);
      return posts.map((p: GeneratedPost) => ({
        ...p,
        datePosted: new Date(p.datePosted),
      }));
    }
  } catch (error) {
    console.error('Erreur chargement posts utilisateur:', error);
  }
  return [];
};

/**
 * Ajoute un nouveau post utilisateur
 */
export const addUserPost = (
  username: string,
  userImage: string,
  content: string,
  attachedTracks?: Array<{ id: string; name: string; artist: string; artist_id?: string; image: string; audio?: string }> | null,
  attachedPlaylist?: { id: string; name: string; coverImage: string; tracks?: Array<{ id: string; name: string; artist_name?: string; artist_id?: string; image?: string; album_image?: string; duration?: number; audio?: string }> } | null,
  attachedEvent?: { id: string; name: string; artist: string; artist_id?: string; venue: string; city: string; date: string; price: string; category: string } | null,
  poll?: { question: string; options: string[] } | null
): GeneratedPost => {
  const timestamp = Date.now();
  const newPost: GeneratedPost = {
    id: `user_post_${timestamp}`,
    username,
    artistId: 'user_self',
    artistImage: userImage,
    content,
    datePosted: new Date(timestamp),
    numberComment: 0,
    numberLike: 0,
    numberView: 0,
    numberReshare: 0,
    // Extensions pour les pièces jointes (optionnel)
    ...(attachedTracks && attachedTracks.length > 0 && { attachedTracks }),
    ...(attachedPlaylist && { attachedPlaylist }),
    ...(attachedEvent && { attachedEvent }),
    ...(poll && { poll }),
  };

  // Sauvegarder dans localStorage
  const existingPosts = getUserPosts();
  const updatedPosts = [newPost, ...existingPosts];
  localStorage.setItem(USER_POSTS_STORAGE_KEY, JSON.stringify(updatedPosts));

  return newPost;
};

/**
 * Supprime un post utilisateur par son ID
 */
export const deleteUserPost = (postId: string): boolean => {
  const existingPosts = getUserPosts();
  const filteredPosts = existingPosts.filter(post => post.id !== postId);
  
  if (filteredPosts.length === existingPosts.length) {
    // Post non trouvé
    return false;
  }
  
  localStorage.setItem(USER_POSTS_STORAGE_KEY, JSON.stringify(filteredPosts));
  return true;
};
