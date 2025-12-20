import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Heart, MessageCircle, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { usePlayer } from '@/lib/playerContext';
import { usePlaylist } from '@/lib/playlistContext';
import { formatDuration } from '@/lib/jamendoApi';
import { getTrackLikes, formatLikes, getTrackComments } from '@/lib/socialData';
import { CommentsModal } from './commentsModal';

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FullScreenPlayer = ({ isOpen, onClose }: FullScreenPlayerProps) => {
  const { 
    currentTrack,
    isPlaying, 
    pause, 
    resume, 
    currentTime, 
    duration, 
    seek,
    next,
    previous,
    isShuffled,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
    tracklist,
    canNavigate
  } = usePlayer();

  const { toggleFavorite, isTrackFavorite } = usePlaylist();

  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dominantColor, setDominantColor] = useState('#3d3525');
  const [showComments, setShowComments] = useState(false);

  // Vérifier si la track actuelle est likée
  const isLiked = currentTrack ? isTrackFavorite(currentTrack.id) : false;

  // Obtenir les données sociales
  const likes = currentTrack ? getTrackLikes(currentTrack.id) : 0;
  const comments = currentTrack ? getTrackComments(currentTrack.id) : [];
  
  // Ajuster le nombre de likes si l'utilisateur a liké
  const displayLikes = isLiked ? likes + 1 : likes;

  // Extraire la couleur dominante
  const extractColor = useCallback(async (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve('#3d3525'); return; }

        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);

        try {
          const imageData = ctx.getImageData(0, 0, 50, 50).data;
          let r = 0, g = 0, b = 0, count = 0;

          for (let i = 0; i < imageData.length; i += 16) {
            r += imageData[i];
            g += imageData[i + 1];
            b += imageData[i + 2];
            count++;
          }

          r = Math.floor((r / count) * 0.4);
          g = Math.floor((g / count) * 0.4);
          b = Math.floor((b / count) * 0.4);

          resolve(`rgb(${r}, ${g}, ${b})`);
        } catch {
          resolve('#3d3525');
        }
      };
      img.onerror = () => resolve('#3d3525');
    });
  }, []);

  // Extraire couleur quand la track change
  useEffect(() => {
    if (currentTrack) {
      const imageUrl = currentTrack.album_image || currentTrack.image || '/albumCoverExample.png';
      extractColor(imageUrl).then(setDominantColor);
    }
  }, [currentTrack, extractColor]);

  // Animation d'ouverture/fermeture
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimating(true));
      });
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  const handlePlayPause = () => {
    if (isPlaying) pause();
    else resume();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    seek((clickX / rect.width) * duration);
  };

  const handleLike = () => {
    if (currentTrack) {
      toggleFavorite(currentTrack);
    }
  };

  if (!isVisible || !currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div 
        className={`fixed inset-0 z-[100] ${
          isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
        style={{ 
          transition: 'transform 300ms ease-out, opacity 300ms ease-out',
          backgroundColor: dominantColor 
        }}
      >
        {/* Dégradé overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 px-4 py-4">
          <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ChevronDown size={24} className="text-white" />
          </button>
        </div>

        {/* Zone cliquable pour play/pause */}
        <div 
          className="absolute inset-0 z-10 cursor-pointer"
          onClick={handlePlayPause}
        />

        {/* Indicateur play/pause au centre */}
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-20 transition-opacity duration-200 ${!isPlaying ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-20 h-20 flex items-center justify-center bg-black/60 rounded-full">
            <Play size={36} fill="white" className="text-white ml-1" />
          </div>
        </div>

        {/* Contenu */}
        <div className="relative flex flex-col h-full pt-16 pointer-events-none">
          {/* Pochette centrée */}
          <div className="flex-grow flex items-center justify-center px-8">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src={currentTrack.album_image || currentTrack.image || '/albumCoverExample.png'}
                alt={currentTrack.name}
                fill
                sizes="320px"
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Sidebar TikTok style - Likes et Commentaires uniquement */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-5 pointer-events-auto z-30">
            {/* Like */}
            <button 
              onClick={(e) => { e.stopPropagation(); handleLike(); }}
              className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
            >
              <div className={`w-11 h-11 rounded-full backdrop-blur flex items-center justify-center ${
                isLiked ? 'bg-red-500/20' : 'bg-white/20'
              }`}>
                <Heart 
                  size={22} 
                  className={isLiked ? 'text-red-500' : 'text-white'} 
                  fill={isLiked ? 'currentColor' : 'none'}
                />
              </div>
              <span className={`text-[10px] ${isLiked ? 'text-red-400' : 'text-white'}`}>
                {formatLikes(displayLikes)}
              </span>
            </button>

            {/* Commentaires */}
            <button 
              onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
              className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
            >
              <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <MessageCircle size={22} className="text-white" />
              </div>
              <span className="text-white text-[10px]">{comments.length}</span>
            </button>
          </div>

          {/* Infos en bas */}
          <div className="px-6 pb-6 pointer-events-auto z-30">
            <div className="mb-4">
              <h2 className="text-white font-bold text-xl mb-1">{currentTrack.name}</h2>
              <p className="text-white/70">{currentTrack.artist_name}</p>
            </div>

            {/* Barre de progression */}
            <div className="mb-4">
              <div 
                className="h-1 bg-white/30 rounded-full cursor-pointer overflow-hidden"
                onClick={(e) => { e.stopPropagation(); handleSeek(e); }}
              >
                <div 
                  className="h-full bg-white rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-white/50">
                <span>{formatDuration(Math.floor(currentTime))}</span>
                <span>{formatDuration(Math.floor(duration))}</span>
              </div>
            </div>

            {/* Contrôles */}
            <div className="flex items-center justify-center gap-6">
              {/* Shuffle - toujours visible, disabled si une seule track */}
              <button 
                onClick={(e) => { e.stopPropagation(); if (tracklist.length > 1) toggleShuffle(); }} 
                disabled={tracklist.length <= 1}
                className={`p-2 rounded-full transition-all ${
                  tracklist.length <= 1
                    ? 'text-white/30 cursor-not-allowed'
                    : isShuffled 
                      ? 'text-(--yellow) bg-(--yellow)/10 hover:scale-110 active:scale-95' 
                      : 'text-white hover:bg-white/10 hover:scale-110 active:scale-95'
                }`}
                title={tracklist.length <= 1 ? 'Pas de shuffle pour un seul titre' : 'Aléatoire'}
              >
                <Shuffle size={22} />
              </button>

              {/* Previous */}
              <button 
                onClick={(e) => { e.stopPropagation(); previous(); }}
                disabled={!canNavigate}
                className={`p-2 transition-all ${
                  canNavigate 
                    ? 'text-white hover:scale-110 active:scale-95' 
                    : 'text-white/30 cursor-not-allowed'
                }`}
                title={canNavigate ? 'Précédent' : 'Désactivé en mode répétition'}
              >
                <SkipBack size={28} fill="currentColor" />
              </button>

              {/* Play/Pause */}
              <button 
                onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}
                className="w-16 h-16 flex items-center justify-center bg-white rounded-full text-black hover:scale-105 active:scale-95 transition-transform shadow-lg"
              >
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
              </button>

              {/* Next */}
              <button 
                onClick={(e) => { e.stopPropagation(); next(); }}
                disabled={!canNavigate}
                className={`p-2 transition-all ${
                  canNavigate 
                    ? 'text-white hover:scale-110 active:scale-95' 
                    : 'text-white/30 cursor-not-allowed'
                }`}
                title={canNavigate ? 'Suivant' : 'Désactivé en mode répétition'}
              >
                <SkipForward size={28} fill="currentColor" />
              </button>

              {/* Repeat */}
              <button 
                onClick={(e) => { e.stopPropagation(); toggleRepeat(); }} 
                className={`p-2 rounded-full hover:scale-110 active:scale-95 transition-all ${
                  repeatMode !== 'off' ? 'text-(--yellow) bg-(--yellow)/10' : 'text-white hover:bg-white/10'
                }`}
                title={repeatMode === 'one' ? 'Répéter une fois' : repeatMode === 'all' ? 'Répéter tout' : 'Répétition désactivée'}
              >
                {repeatMode === 'one' ? <Repeat1 size={22} /> : <Repeat size={22} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Commentaires */}
      <CommentsModal 
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        trackId={currentTrack.id}
        trackName={currentTrack.name}
      />
    </>
  );
};
