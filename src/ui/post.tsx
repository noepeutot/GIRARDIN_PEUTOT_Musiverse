import React from 'react'
import Logo from './logoMusiverse'
import { PostType } from '@/pages/home'

interface PostProps {
  post: PostType
}

const printDateDifference = (date: Date) => {
  const dateDiff = Date.now() - date.getTime();

  const seconds = Math.round(dateDiff / 1000);
  
  if (seconds < 60) return "à l'instant";
  
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  
  const days = Math.round(hours / 24);
  if (days < 30) return `il y a ${days} jour${days > 1 ? 's' : ''}`;
  
  const months = Math.round(days / 30.4375);
  if (months < 12) return `il y a ${months} mois`;
  
  const years = Math.round(months / 12);
  return `il y a ${years} an${years > 1 ? 's' : ''}`;
} 

export const Post = ({post}: PostProps) => {
  return (
    <article className='border-1 border-gray-300 rounded-[10px] mx-5 p-2'>
      {/* Top bar of a post */}
      <header className='flex items-center justify-around mb-2'>
        <Logo w={24} h={24}/>
        <p className='flex gap-x-2 items-center font-bold ml-2 text-[0.9em]'>{post.username} <span className='font-normal text-gray-500 text-[0.6em]'> • {printDateDifference(post.datePosted)}</span></p>
        <button className='text-(--text-color) text-[0.8em] bg-(--brown) py-0.5 px-2 rounded-[5px]'>
          S'abonner
        </button>
      </header>
      {/* Content */}
      <p>{post.content}</p>
      <footer>
        
      </footer>
    </article>
  )
}
