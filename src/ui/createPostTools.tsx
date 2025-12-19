import React, { useState } from "react";
import {
  CalendarDays,
  ChevronUp,
  Heart,
  Images,
  List,
  ListMusic,
  Music,
  Plus,
} from "lucide-react";
import { SearchBar } from "./searchBar";
import { musicExample, MusicType } from "@/pages/home";
import Image from "next/image";

interface CreatePostToolsProps {
  displayMode?: string;
}

export default function CreatePostTools({
  displayMode = "compact",
}: CreatePostToolsProps) {
  const [mode, setMode] = useState(displayMode);

  switch (mode) {
    case 'music':
      const songs: MusicType[] = [
        musicExample,
        musicExample,
        musicExample,
        musicExample,
        musicExample,
        musicExample,
        musicExample,
        musicExample,
        musicExample,
        musicExample
      ]

      return (
        <div className="max-h-2/3 py-2 flex flex-col gap-y-2 items-center border-t-2 border-solid border-gray-300 rounded-[10px]">
          <span className="border-t-2 border-solid border-gray-300 w-15"></span>
          <h2>Ajouter un son</h2>
          <SearchBar />
          <div className="flex flex-col justify-between items-stretch overflow-auto place-self-stretch gap-y-4">
            {songs.map((song, index) => (
              <article key={index} className="flex items-center gap-x-2 mx-10">
                <Image 
                  src={song.albumCover}
                  width={40}
                  height={40}
                  alt="Album Cover"
                  className="rounded-sm"
                />
                <div className="flex-grow">
                  <p className="font-bold text-[0.9em]">{song.title}</p>
                  <p className="text-[0.8em] text-gray-600">{song.artist}</p>
                </div>
                <Heart color="#000000" />
              </article>
            ))}
          </div>
        </div>

      );
    case 'playlist':
      return ;
    case 'poll':
      return ;
    case "expanded":
      return (
        <div className="py-2 flex flex-col gap-y-2 items-center border-t-2 border-solid border-gray-300 rounded-[10px]">
          <span className="border-t-2 border-solid border-gray-300 w-15"></span>
          <h2>Ajouter à votre post</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="p-2 cursor-pointer bg-[#EEEEEE] hover:bg-(--yellow) rounded-[15px] transition-colors"
              onClick={() => setMode("music")}
            >
              <div className="flex justify-between items-center">
                <Music color="#695735" width={32} height={32} />
                <Plus color="#020202" />
              </div>
              <span>Ajouter un son</span>
            </button>
            <button
              className="p-2 cursor-pointer bg-[#EEEEEE] hover:bg-(--yellow) rounded-[15px] transition-colors"
              onClick={() => setMode("playlist")}
            >
              <div className="flex justify-between items-center">
                <ListMusic color="#695735" width={32} height={32} />
                <Plus color="#020202" />
              </div>
              <span>Ajouter une playlist</span>
            </button>
            <button className="p-2 cursor-pointer bg-[#EEEEEE] hover:bg-(--yellow) rounded-[15px] transition-colors">
              <div className="flex justify-between items-center">
                <Images color="#695735" width={32} height={32} />
                <Plus color="#020202" />
              </div>
              <span>Ajouter un média</span>
            </button>
            <button className="p-2 cursor-pointer bg-[#EEEEEE] hover:bg-(--yellow) rounded-[15px] transition-colors"
              onClick={() => setMode('poll')}>
              <div className="flex justify-between items-center">
                <List color="#695735" width={32} height={32} />
                <Plus color="#020202" />
              </div>
              <span>Créer un sondage</span>
            </button>
            <button className="p-2 cursor-pointer bg-[#EEEEEE] hover:bg-(--yellow) rounded-[15px] transition-colors">
              <div className="flex justify-between items-center">
                <CalendarDays color="#695735" width={32} height={32} />
                <Plus color="#020202" />
              </div>
              <span>Lier un évènement</span>
            </button>
          </div>
        </div>
      );
    default:
      return (
        <div className="py-3 flex justify-around items-center border-t-2 border-solid border-gray-300 rounded-[10px]">
          <button className="cursor-pointer">
            <Music color="#695735" width={32} height={32} />
          </button>
          <button className="cursor-pointer">
            <ListMusic color="#695735" width={32} height={32} />
          </button>
          <button className="cursor-pointer">
            <Images color="#695735" width={32} height={32} />
          </button>
          <button className="cursor-pointer">
            <List color="#695735" width={32} height={32} />
          </button>
          <button className="cursor-pointer">
            <CalendarDays color="#695735" width={32} height={32} />
          </button>
          <button
            className="cursor-pointer"
            onClick={() => setMode("expanded")}
          >
            <ChevronUp color="#020202" width={32} height={32} />
          </button>
        </div>
      );
  }
}
