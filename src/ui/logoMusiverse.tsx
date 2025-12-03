import React from 'react'
import Image from 'next/image'

interface LogoProps {
  w?: number;
  h?: number;
}

export default function Logo({w = 100, h = 20}: LogoProps) {
  return (
    <Image
      src="/logoMusiverse.jpg"
      alt="Musiverse logo"
      width={w}
      height={h}
      priority
      className='rounded-[50px]'
    />
      
    )
}
