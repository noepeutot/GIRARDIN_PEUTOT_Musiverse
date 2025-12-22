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
 * @returns Tableau de posts générés
 */
export const generateRandomPosts = (
  artists: JamendoArtist[],
  count: number,
  existingIds: Set<string> = new Set()
): GeneratedPost[] => {
  if (artists.length === 0) return [];
  
  const posts: GeneratedPost[] = [];
  const usedCombinations = new Set<string>();
  
  // Mélanger les artistes et les contenus
  const shuffledArtists = shuffleArray(artists);
  const shuffledContents = shuffleArray(SAMPLE_POST_CONTENTS);
  
  let attempts = 0;
  const maxAttempts = count * 10; // Évite les boucles infinies
  
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
