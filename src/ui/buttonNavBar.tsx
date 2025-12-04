import React from 'react'

interface ButtonNavBarProps {
  children: React.ReactNode;
  name?: string;
  className?: string;
}

export const ButtonNavBar = ({children, name, className}: ButtonNavBarProps) => {
  return (
    <div className={className + ' flex flex-col items-center justify-center cursor-pointer text-(--text-color) text-[0.7em]'}>
      {children}
      {(name) && <p className='text-center font-bold mt-1'>{name}</p>}
    </div>
  )
}
