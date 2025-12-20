import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Pause, Plus, Check } from "lucide-react";
import { ButtonNavBar } from "./buttonNavBar";
import { usePlayer } from "@/lib/playerContext";
import { FullScreenPlayer } from "./fullScreenPlayer";
import { AddToPlaylistModal } from "./addToPlaylistModal";
import { CreatePlaylistModal } from "./createPlaylistModal";
import { usePlaylist } from "@/lib/playlistContext";
import { useAuth } from "@/lib/authContext";

export const NavBar = () => {
  const { currentTrack, isPlaying, pause, resume, currentTime, duration, seek } = usePlayer();
  const { createPlaylist, isTrackInAnyPlaylist } = usePlaylist();
  const { user, isAuthenticated } = useAuth();
  
  // Vérifier si la track actuelle est dans une playlist
  const isCurrentTrackSaved = currentTrack ? isTrackInAnyPlaylist(currentTrack.id) : false;
  
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentTrack) {
      setShowAddToPlaylist(true);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      seek(newTime);
    }
  };

  const openFullScreen = () => {
    if (currentTrack) {
      setIsFullScreenOpen(true);
    }
  };

  return (
    <>
      {/* Player plein écran */}
      <FullScreenPlayer 
        isOpen={isFullScreenOpen} 
        onClose={() => setIsFullScreenOpen(false)} 
      />

      <div className="fixed bottom-0 left-4 right-4 mb-3 z-50">
        {/* Container glassmorphism unifié */}
        <div className="bg-[#3d3525]/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          
          {/* Mini Player */}
          {currentTrack && (
            <>
              {/* Contenu du player */}
              <div 
                className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                onClick={openFullScreen}
              >
                {/* Cover */}
                <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden shadow-lg">
                  <Image
                    src={currentTrack.album_image || currentTrack.image || '/albumCoverExample.png'}
                    alt={currentTrack.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>

                {/* Infos */}
                <div className="flex-grow min-w-0">
                  <p className="font-medium text-(--text-color) truncate text-sm">
                    {currentTrack.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {currentTrack.artist_name}
                  </p>
                </div>

                {/* Bouton Ajouter à playlist */}
                <button 
                  onClick={handleAddToPlaylist}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                    isCurrentTrackSaved 
                      ? 'bg-(--text-color) text-(--background-brown)' 
                      : 'border-2 border-(--text-color) text-(--text-color) hover:bg-(--text-color)/10'
                  }`}
                >
                  {isCurrentTrackSaved ? <Check size={16} strokeWidth={3} /> : <Plus size={16} />}
                </button>

                {/* Bouton Play/Pause */}
                <button 
                  onClick={handlePlayPause}
                  className="p-2.5 bg-(--text-color) rounded-full text-(--background-brown) hover:scale-105 transition-transform flex-shrink-0"
                >
                  {isPlaying ? (
                    <Pause size={16} fill="currentColor" />
                  ) : (
                    <Play size={16} fill="currentColor" />
                  )}
                </button>
              </div>

              {/* Barre de progression */}
              <div 
                className="h-[3px] bg-white/20 cursor-pointer mx-4 mb-3 rounded-full overflow-hidden"
                onClick={handleSeek}
              >
                <div 
                  className="h-full bg-(--yellow) rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          )}

          {/* Navbar principale */}
          <nav className="flex items-center justify-around py-3 px-2">
            <ButtonNavBar name="Accueil" link="/home">
              <svg
                width="24"
                height="24"
                viewBox="0 0 30 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M15.7714 2.82916C15.3142 2.48623 14.6858 2.48623 14.2286 2.82916L3.08571 11.188C2.76197 11.4309 2.57143 11.812 2.57143 12.2168V26.1421C2.57143 26.8524 3.14707 27.428 3.85714 27.428H9.85714V23.5701C9.85714 20.7293 12.1596 18.4262 15 18.4262C17.8404 18.4262 20.1429 20.7293 20.1429 23.5701V27.428H26.1429C26.8529 27.428 27.4286 26.8524 27.4286 26.1421V12.2168C27.4286 11.812 27.2381 11.4309 26.9143 11.188L15.7714 2.82916ZM12.6857 0.771588C14.0571 -0.257196 15.9429 -0.257196 17.3143 0.771588L28.4571 9.13046C29.4285 9.85905 30 11.0025 30 12.2168V26.1421C30 28.2728 28.273 30 26.1429 30H18.8571C18.1471 30 17.5714 29.4244 17.5714 28.714V23.5701C17.5714 22.1497 16.4201 20.9981 15 20.9981C13.5799 20.9981 12.4286 22.1497 12.4286 23.5701V28.714C12.4286 29.4244 11.8529 30 11.1429 30H3.85714C1.7269 30 0 28.2728 0 26.1421V12.2168C0 11.0025 0.571612 9.85905 1.54286 9.13046L12.6857 0.771588Z"
                  fill="#FEF9E4"
                />
              </svg>
            </ButtonNavBar>
            <ButtonNavBar name="Recherche" link="/music/search">
              <svg
                width="24"
                height="24"
                viewBox="0 0 30 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M13.876 0C6.21277 0 0 6.21092 0 13.8731C0 21.5351 6.21277 27.746 13.876 27.746C17.3015 27.746 20.4372 26.5051 22.8576 24.4482L28.0794 29.6704C28.5186 30.1098 29.231 30.1099 29.6704 29.6705C30.1098 29.2311 30.1099 28.5187 29.6705 28.0794L24.4493 22.8576C26.5091 20.437 27.752 17.3003 27.752 13.8731C27.752 6.21092 21.5393 0 13.876 0ZM2.25017 13.8731C2.25017 7.45416 7.45498 2.25018 13.876 2.25018C20.2971 2.25018 25.5019 7.45416 25.5019 13.8731C25.5019 20.2919 20.2971 25.4959 13.876 25.4959C7.45498 25.4959 2.25017 20.2919 2.25017 13.8731Z"
                  fill="#FEF9E4"
                />
              </svg>
            </ButtonNavBar>
            <ButtonNavBar link="/createPost" className="bg-[#F2F2F2] w-12 h-12 rounded-xl flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 30 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14.9997 0C16.3078 0 17.368 1.06033 17.368 2.3683V12.6314H27.6317C28.9396 12.6314 30 13.6917 30 14.9997C30 16.3078 28.9396 17.368 27.6317 17.368H17.368V27.6317C17.368 28.9396 16.3078 30 14.9997 30C13.6917 30 12.6314 28.9396 12.6314 27.6317V17.368H2.3683C1.06033 17.368 0 16.3078 0 14.9997C0 13.6917 1.06033 12.6314 2.3683 12.6314H12.6314V2.3683C12.6314 1.06033 13.6917 0 14.9997 0Z"
                  fill="#342E1B"
                />
              </svg>
            </ButtonNavBar>
            <ButtonNavBar name="Musique" link="/music">
              <svg
                width="24"
                height="24"
                viewBox="0 0 30 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  transform="scale(1.37)"
                  d="M7.66667 18.7778C7.66667 20.0051 6.17428 21 4.33333 21C2.49238 21 1 20.0051 1 18.7778C1 17.5505 2.49238 16.5556 4.33333 16.5556C6.17428 16.5556 7.66667 17.5505 7.66667 18.7778ZM7.66667 18.7778V3.22222L21 1V16.5556M21 16.5556C21 17.7829 19.5076 18.7778 17.6667 18.7778C15.8257 18.7778 14.3333 17.7829 14.3333 16.5556C14.3333 15.3283 15.8257 14.3333 17.6667 14.3333C19.5076 14.3333 21 15.3283 21 16.5556ZM7.66667 7.66667L21 5.44444"
                  stroke="#FEF9E4"
                  strokeWidth="2"
                />
              </svg>
            </ButtonNavBar>
            <ButtonNavBar name="Profil" link="/profile">
              <svg
                width="24"
                height="24"
                viewBox="0 0 30 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 15C18.3137 15 21 12.3137 21 9C21 5.68629 18.3137 3 15 3C11.6863 3 9 5.68629 9 9C9 12.3137 11.6863 15 15 15Z"
                  stroke="#FEF9E4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M25.5 27C25.5 22.0294 20.799 18 15 18C9.20101 18 4.5 22.0294 4.5 27"
                  stroke="#FEF9E4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </ButtonNavBar>
          </nav>
        </div>
      </div>

      {/* Modals */}
      <AddToPlaylistModal
        isOpen={showAddToPlaylist}
        onClose={() => setShowAddToPlaylist(false)}
        track={currentTrack}
        onCreateNew={() => {
          setShowAddToPlaylist(false);
          setShowCreatePlaylist(true);
        }}
      />
      
      <CreatePlaylistModal
        isOpen={showCreatePlaylist}
        onClose={() => setShowCreatePlaylist(false)}
        onCreate={(name, desc, isPublic) => createPlaylist(name, desc, isPublic)}
      />
    </>
  );
};
