import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/lib/authContext";
import { PlayerProvider } from "@/lib/playerContext";
import { PlaylistProvider } from "@/lib/playlistContext";
import { SocialProvider } from "@/lib/socialContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <SocialProvider>
        <PlaylistProvider>
          <PlayerProvider>
            <Component {...pageProps} />
          </PlayerProvider>
        </PlaylistProvider>
      </SocialProvider>
    </AuthProvider>
  );
}
