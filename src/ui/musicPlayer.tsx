import React, { useRef, useState, useEffect } from "react";
import { MusicType } from "@/pages/home";
import Image from "next/image";
import { Play, Pause } from "lucide-react";

interface MusicPlayerProps {
  music: MusicType;
  className?: string;
}

const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const MusicPlayer = ({ music, className }: MusicPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  let fillPercentage = (currentTime / duration) * 100;
  fillPercentage = isNaN(fillPercentage) ? 0 : fillPercentage;

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div
      className={
        className +
        " flex gap-x-4 bg-(--background-brown) rounded-md items-center text-(--text-color)"
      }
    >
      <Image
        src={music.albumCover}
        alt={`${music.title} album cover`}
        width={112}
        height={112}
        className="rounded-md"
      />
      <div className="flex flex-col">
        <audio
          ref={audioRef}
          src={music.url}
          onCanPlayThrough={(e) => {
            setDuration(e.currentTarget.duration);
          }}
          onTimeUpdate={(e) => {
            setCurrentTime(e.currentTarget.currentTime);
          }}
        />
        {/* Titre et Artiste */}
        <section>
          <p className="font-bold">{music.title}</p>
          <p className="text-sm">{music.artist}</p>
        </section>

        {/* Barre de progression et temps */}
        <section className="flex items-center gap-x-2 mt-2 mr-4">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={(e) => {
              if (audioRef.current) {
                audioRef.current.currentTime = parseFloat(e.target.value);
              }
              setCurrentTime(parseFloat(e.target.value));
            }}
            className="range-player-custom flex-grow h-1 bg-(--yellow) rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #f59e0b ${fillPercentage}%, #44403c ${fillPercentage}%)`,
            }}
          />
          <span className="text-xs text-right">
            {formatTime(currentTime)}
          </span>
        </section>

        {/* Contrôles de lecture */}
        <section className="flex justify-center items-center gap-x-4 mt-2 mb-3">
          <button
            className="cursor-pointer"
            onClick={() => setIsPlaying((prevIsPlaying) => !prevIsPlaying)}
          >
            {isPlaying ? (
              <Pause size={24} fill="white" />
            ) : (
              <Play size={24} fill="#FEF9E4" />
            )}
          </button>
        </section>
      </div>
    </div>
  );
};
