import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/lib/authContext";
import { PlayerProvider } from "@/lib/playerContext";
import { PlaylistProvider } from "@/lib/playlistContext";
import { SocialProvider } from "@/lib/socialContext";
import { FollowProvider } from "@/lib/followContext";
import { UserMusicProvider } from "@/lib/userMusicContext";
import AppLayout from "@/ui/AppLayout";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <FollowProvider>
        <SocialProvider>
          <UserMusicProvider>
            <PlaylistProvider>
              <PlayerProvider>
                <AppLayout>
                  <Component {...pageProps} />
                </AppLayout>
              </PlayerProvider>
            </PlaylistProvider>
          </UserMusicProvider>
        </SocialProvider>
      </FollowProvider>
    </AuthProvider>
  );
}
