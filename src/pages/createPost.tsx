import { X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import CreatePostTools from '@/ui/createPostTools'

export default function CreatePost() {
  return (
    <main className='h-screen flex flex-col gap-y-2 bg-(--background-white)'>
      {/* Header de la page */}
      <header className='flex justify-around items-center border-b border-solid border-gray-300 py-4'>
        <Link href="/home" className='cursor-pointer hover:opacity-80 transition-opacity '>
          <X />
        </Link>
        <h1 className='font-bold text-[1.4em]'>Créer un post</h1>
        <button className="cursor-pointer font-bold hover:opacity-80 transition-opacity text-(--text-color) bg-(--brown) py-0.5 px-2 rounded-[5px]">
          Poster
        </button>
      </header>
      {/* Contenu principal */}
      <div className='px-4 py-2 flex flex-col flex-grow gap-y-4'>
        <header className='flex items-center gap-x-2 font-bold'>
          <Image
            src="/photoProfil.png"
            alt="Profile Photo"
            width={32}
            height={32}
            className="rounded-full"
          />
          <span>Lyric Cruz</span>
        </header>
        <textarea
          className='w-full flex-grow resize-none focus:outline-none'
          placeholder="Quoi de neuf ?"
        />
      </div>
      <CreatePostTools />
    </main>
  )
}
