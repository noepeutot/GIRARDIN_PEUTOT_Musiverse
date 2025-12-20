// Données simulées pour les likes et commentaires
// Ces données sont générées de manière déterministe basée sur l'ID de la track

// Noms d'utilisateurs samples
const SAMPLE_USERNAMES = [
  'MusicLover42', 'BeatMaster', 'SoundWave', 'GrooveKing', 'RhythmQueen',
  'MelodyHunter', 'VibeChecker', 'HarmonySeeker', 'BassDrop', 'TrackAddict',
  'SynthWizard', 'DrumBoss', 'ChillVibes_', 'NightOwl🦉', 'SunsetBeats',
  'UrbanSound', 'RetroFunk', 'ElectroSoul', 'JazzHands', 'IndieDreamer',
  'LofiLife', 'TechnoTribe', 'DanceFloor', 'AudioPhile', 'StereoLove',
];

// Commentaires samples
const SAMPLE_COMMENTS = [
  "Ce son est incroyable ! 🔥",
  "En boucle depuis ce matin",
  "La production est tellement clean",
  "Qui écoute en 2024 ? 🙋",
  "Cette mélodie me donne des frissons",
  "Ajouté à ma playlist direct 💯",
  "L'artiste mérite plus de reconnaissance",
  "Ce drop !! 🔥🔥",
  "Parfait pour le workout",
  "Les vibes sont incroyables",
  "Je découvre grâce à Musiverse ❤️",
  "Cette chanson me rappelle tellement de souvenirs",
  "La basse est trop bien",
  "Quelqu'un connaît des sons similaires ?",
  "Cette track > toutes les autres",
  "J'adore les paroles de ce morceau",
  "Masterpiece 🎨",
  "Le beat est addictif",
  "En mode repeat depuis 3h",
  "Cette voix est magique ✨",
  "Le clip est aussi incroyable",
  "Top 1 de ma playlist du moment",
  "Les instruments sont parfaits",
  "Je suis fan depuis le début 💜",
  "Ça me met de bonne humeur !",
  "L'intro est folle 🔊",
  "Besoin de plus de sons comme ça",
  "Pure pépite 💎",
  "La montée en puissance est ouf",
  "Je recommande à 100%",
];

// Générer un hash simple à partir d'un string
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

// Générer un nombre de likes basé sur l'ID de la track
export const getTrackLikes = (trackId: string): number => {
  const hash = hashString(trackId);
  // Génère un nombre entre 500 et 50000
  return 500 + (hash % 49500);
};

// Formater le nombre de likes
export const formatLikes = (count: number): string => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
};

// Interface pour un commentaire
export interface TrackComment {
  id: string;
  username: string;
  text: string;
  timestamp: number; // en minutes (il y a X minutes)
  likes: number;
}

// Générer des commentaires basés sur l'ID de la track
export const getTrackComments = (trackId: string): TrackComment[] => {
  const hash = hashString(trackId);
  const numComments = 3 + (hash % 15); // Entre 3 et 17 commentaires
  
  const comments: TrackComment[] = [];
  
  for (let i = 0; i < numComments; i++) {
    const commentHash = hashString(trackId + i.toString());
    const usernameIndex = commentHash % SAMPLE_USERNAMES.length;
    const commentIndex = (commentHash * 7) % SAMPLE_COMMENTS.length;
    
    comments.push({
      id: `${trackId}-comment-${i}`,
      username: SAMPLE_USERNAMES[usernameIndex],
      text: SAMPLE_COMMENTS[commentIndex],
      timestamp: 1 + (commentHash % 1440), // Entre 1 min et 24h
      likes: commentHash % 500,
    });
  }
  
  // Ajouter les commentaires utilisateur sauvegardés
  const userComments = getUserComments(trackId);
  
  // Combiner et trier
  const allComments = [...userComments, ...comments];
  return allComments.sort((a, b) => {
    // Les commentaires utilisateur récents en premier
    if (a.timestamp === 0 && b.timestamp !== 0) return -1;
    if (b.timestamp === 0 && a.timestamp !== 0) return 1;
    return b.likes - a.likes;
  });
};

// Formater le timestamp
export const formatTimestamp = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}j`;
};

// Clé localStorage pour les commentaires utilisateur
const USER_COMMENTS_KEY = 'musiverse_user_comments';

// Récupérer les commentaires utilisateur pour une track
export const getUserComments = (trackId: string): TrackComment[] => {
  try {
    const saved = localStorage.getItem(USER_COMMENTS_KEY);
    if (!saved) return [];
    
    const allComments: Record<string, TrackComment[]> = JSON.parse(saved);
    return allComments[trackId] || [];
  } catch {
    return [];
  }
};

// Ajouter un commentaire utilisateur
export const addUserComment = (trackId: string, text: string): TrackComment => {
  const newComment: TrackComment = {
    id: `user-${trackId}-${Date.now()}`,
    username: 'Toi',
    text: text.trim(),
    timestamp: 0, // 0 = à l'instant
    likes: 0,
  };
  
  try {
    const saved = localStorage.getItem(USER_COMMENTS_KEY);
    const allComments: Record<string, TrackComment[]> = saved ? JSON.parse(saved) : {};
    
    if (!allComments[trackId]) {
      allComments[trackId] = [];
    }
    
    allComments[trackId].unshift(newComment);
    localStorage.setItem(USER_COMMENTS_KEY, JSON.stringify(allComments));
  } catch (error) {
    console.error('Erreur sauvegarde commentaire:', error);
  }
  
  return newComment;
};

// Supprimer un commentaire utilisateur
export const deleteUserComment = (trackId: string, commentId: string): void => {
  try {
    const saved = localStorage.getItem(USER_COMMENTS_KEY);
    if (!saved) return;
    
    const allComments: Record<string, TrackComment[]> = JSON.parse(saved);
    if (!allComments[trackId]) return;
    
    allComments[trackId] = allComments[trackId].filter(c => c.id !== commentId);
    localStorage.setItem(USER_COMMENTS_KEY, JSON.stringify(allComments));
  } catch (error) {
    console.error('Erreur suppression commentaire:', error);
  }
};
