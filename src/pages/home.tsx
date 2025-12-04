import Logo from "@/ui/logoMusiverse";
import { NavBar } from "@/ui/navBar";
import { Post } from "@/ui/post";

export interface PostType {
  username: string;
  datePosted: Date;
  content: string;
  numberComment: number;
  numberLike: number;
  numberView: number;
  numberReshare: number;
}

const post: PostType = {
  username: "Virag Mercédesz",
  datePosted: new Date(Date.now() - 8 * 60 * 1000),
  content: "Besoin de vos oreilles avisées 🎧. J'ai retravaillé le mixage de ma dernière track 'Lost in Space'. J'ai l'impression que le kick écrase trop la voix sur le refrain (vers 0:45). Soyez honnêtes, je garde ou je recommence ?",
  numberComment: 160000,
  numberLike: 48800,
  numberView: 12000000,
  numberReshare: 82000
}

export default function Home() {
  return (
    <main className="flex flex-col bg-(--background-white)">
      {/* Home Header */}
      <header className="flex justify-around items-center py-4 mb-2 border-b border-solid border-gray-300">
        <Logo w={36} h={36} />
        <h1 className="font-bold text-[1.4em]">Fil d'actualité</h1>
        <svg
          width="21"
          height="24"
          viewBox="0 0 21 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.9808 0.9C10.9808 0.402936 10.575 0 10.0745 0C9.57403 0 9.16827 0.402936 9.16827 0.9V1.84444C4.5887 2.29598 1.01202 6.13319 1.01202 10.8V14.5368L0.175564 16.7519C-0.490953 18.5171 0.822964 20.4 2.72121 20.4H17.4278C19.326 20.3999 20.6399 18.5171 19.9734 16.7519L19.137 14.5368V10.8C19.137 6.13319 15.5604 2.29598 10.9808 1.84444V0.9Z"
            fill="#342E1B"
          />
          <path
            d="M13.5449 21.6H6.6001C7.12278 23.0004 8.48049 23.9982 10.0725 23.9982C11.6646 23.9982 13.0223 23.0004 13.5449 21.6Z"
            fill="#695735"
          />
        </svg>
      </header>
      {/* Feed */}
      <div className="flex flex-col gap-y-3">
        <Post post={post}/>
        <Post post={post}/>
        <Post post={post}/>
        <Post post={post}/>
      </div>
      <NavBar />
    </main>
  );
}
