import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { PlayerProvider } from "@/lib/playerContext";
import { PlaylistProvider } from "@/lib/playlistContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PlaylistProvider>
      <PlayerProvider>
        <Component {...pageProps} />
      </PlayerProvider>
    </PlaylistProvider>
  );
}
