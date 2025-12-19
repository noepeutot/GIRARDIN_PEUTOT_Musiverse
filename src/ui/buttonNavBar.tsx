import { Url } from "next/dist/shared/lib/router/router";
import Link  from "next/link";
import React from 'react'

interface ButtonNavBarProps {
  children: React.ReactNode;
  name?: string;
  className?: string;
  link?: Url
}

export const ButtonNavBar = ({children, name, className, link}: ButtonNavBarProps) => {
  if (link) {
    return (
      <Link href={link} className={className + ' flex flex-col items-center justify-center cursor-pointer text-(--text-color) text-[0.7em]'}>
        {children}
        {(name) && <p className='text-center font-bold mt-1'>{name}</p>}
      </Link>
    )
  } else {
    return (
      <button className={className + ' flex flex-col items-center justify-center cursor-pointer text-(--text-color) text-[0.7em]'}>
        {children}
        {(name) && <p className='text-center font-bold mt-1'>{name}</p>}
      </button>
    )
  }
}
