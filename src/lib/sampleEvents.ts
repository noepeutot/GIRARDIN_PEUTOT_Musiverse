// Données fictives pour les événements musicaux

export interface MusicEvent {
  id: string;
  name: string;
  artist: string;
  artist_id?: string;
  artistImage: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  image: string;
  price: string;
  category: 'concert' | 'festival' | 'dj_set' | 'showcase';
  description: string;
}

export const SAMPLE_EVENTS: MusicEvent[] = [
  {
    id: 'event_1',
    name: 'Summer Vibes Festival',
    artist: 'Multi-artistes',
    artistImage: '/avatar1.jpg',
    venue: 'Parc des Expositions',
    city: 'Paris',
    date: '2025-07-15',
    time: '14:00',
    image: '/event1.jpg',
    price: '45€',
    category: 'festival',
    description: 'Le plus grand festival électro de l\'été avec plus de 30 artistes sur 3 scènes.'
  },
  {
    id: 'event_2',
    name: 'Jazz Night',
    artist: 'The Blue Notes',
    artistImage: '/avatar2.jpg',
    venue: 'Le Sunset',
    city: 'Paris',
    date: '2025-03-22',
    time: '21:00',
    image: '/event2.jpg',
    price: '25€',
    category: 'concert',
    description: 'Une soirée jazz intimiste avec les meilleurs musiciens de la scène parisienne.'
  },
  {
    id: 'event_3',
    name: 'Electronic Dreams',
    artist: 'DJ Pulse',
    artistImage: '/avatar3.jpg',
    venue: 'Warehouse Club',
    city: 'Lyon',
    date: '2025-04-05',
    time: '23:00',
    image: '/event3.jpg',
    price: '30€',
    category: 'dj_set',
    description: 'Une nuit techno underground dans un lieu industriel unique.'
  },
  {
    id: 'event_4',
    name: 'Acoustic Sessions',
    artist: 'Sarah Moon',
    artistImage: '/avatar4.jpg',
    venue: 'La Cigale',
    city: 'Paris',
    date: '2025-05-10',
    time: '20:00',
    image: '/event4.jpg',
    price: '35€',
    category: 'showcase',
    description: 'Découvrez les talents émergents de la scène folk française.'
  },
  {
    id: 'event_5',
    name: 'Rock Legends Tour',
    artist: 'The Stormers',
    artistImage: '/avatar5.jpg',
    venue: 'Zénith',
    city: 'Toulouse',
    date: '2025-06-20',
    time: '19:30',
    image: '/event5.jpg',
    price: '55€',
    category: 'concert',
    description: 'Le groupe mythique revient pour une tournée exceptionnelle.'
  },
  {
    id: 'event_6',
    name: 'Hip-Hop Nation',
    artist: 'MC Flow & Friends',
    artistImage: '/avatar6.jpg',
    venue: 'AccorHotels Arena',
    city: 'Paris',
    date: '2025-09-12',
    time: '20:00',
    image: '/event6.jpg',
    price: '40€',
    category: 'concert',
    description: 'Les plus grands noms du rap français réunis sur une même scène.'
  },
  {
    id: 'event_7',
    name: 'Sunset Beach Party',
    artist: 'Tropical Collective',
    artistImage: '/avatar7.jpg',
    venue: 'Plage du Prado',
    city: 'Marseille',
    date: '2025-08-01',
    time: '18:00',
    image: '/event7.jpg',
    price: '20€',
    category: 'dj_set',
    description: 'Dansez au coucher du soleil avec les meilleurs DJs house.'
  },
  {
    id: 'event_8',
    name: 'Classical Nights',
    artist: 'Orchestre Philharmonique',
    artistImage: '/avatar8.jpg',
    venue: 'Opéra Garnier',
    city: 'Paris',
    date: '2025-04-28',
    time: '19:00',
    image: '/event8.jpg',
    price: '65€',
    category: 'concert',
    description: 'Une soirée d\'exception avec les plus grandes œuvres classiques.'
  },
  {
    id: 'event_9',
    name: 'Indie Fest',
    artist: 'Multi-artistes',
    artistImage: '/avatar9.jpg',
    venue: 'Rockhal',
    city: 'Bordeaux',
    date: '2025-07-28',
    time: '15:00',
    image: '/event9.jpg',
    price: '38€',
    category: 'festival',
    description: 'Festival dédié aux artistes indépendants et émergents.'
  },
  {
    id: 'event_10',
    name: 'Electro Warehouse',
    artist: 'Techno Masters',
    artistImage: '/avatar10.jpg',
    venue: 'La Friche',
    city: 'Marseille',
    date: '2025-10-18',
    time: '22:00',
    image: '/event10.jpg',
    price: '28€',
    category: 'dj_set',
    description: 'Une rave underground dans un ancien entrepôt.'
  }
];

// Playlists publiques sample (d'autres utilisateurs)
export interface PublicPlaylist {
  id: string;
  name: string;
  creatorName: string;
  creatorImage: string;
  coverImage: string;
  trackCount: number;
  likes: number;
  createdAt: string;
}

export const SAMPLE_PUBLIC_PLAYLISTS: PublicPlaylist[] = [
  {
    id: 'public_1',
    name: 'Chill Vibes',
    creatorName: 'MusicLover42',
    creatorImage: '/avatar1.jpg',
    coverImage: '/playlist1.jpg',
    trackCount: 45,
    likes: 1234,
    createdAt: '2024-11-15'
  },
  {
    id: 'public_2',
    name: 'Workout Energy',
    creatorName: 'FitBeats',
    creatorImage: '/avatar2.jpg',
    coverImage: '/playlist2.jpg',
    trackCount: 32,
    likes: 892,
    createdAt: '2024-10-22'
  },
  {
    id: 'public_3',
    name: 'Late Night Coding',
    creatorName: 'DevTunes',
    creatorImage: '/avatar3.jpg',
    coverImage: '/playlist3.jpg',
    trackCount: 67,
    likes: 2341,
    createdAt: '2024-09-08'
  },
  {
    id: 'public_4',
    name: 'Summer Road Trip',
    creatorName: 'TravelVibes',
    creatorImage: '/avatar4.jpg',
    coverImage: '/playlist4.jpg',
    trackCount: 28,
    likes: 567,
    createdAt: '2024-06-30'
  },
  {
    id: 'public_5',
    name: 'Focus Mode',
    creatorName: 'ZenMaster',
    creatorImage: '/avatar5.jpg',
    coverImage: '/playlist5.jpg',
    trackCount: 50,
    likes: 1876,
    createdAt: '2024-08-14'
  },
  {
    id: 'public_6',
    name: 'Party Anthems',
    creatorName: 'DJNight',
    creatorImage: '/avatar6.jpg',
    coverImage: '/playlist6.jpg',
    trackCount: 40,
    likes: 3421,
    createdAt: '2024-12-05'
  }
];

// Fonction pour formater la date d'un événement
export function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  };
  return date.toLocaleDateString('fr-FR', options);
}

// Fonction pour obtenir le label de catégorie
export function getCategoryLabel(category: MusicEvent['category']): string {
  const labels = {
    concert: 'Concert',
    festival: 'Festival',
    dj_set: 'DJ Set',
    showcase: 'Showcase'
  };
  return labels[category];
}
