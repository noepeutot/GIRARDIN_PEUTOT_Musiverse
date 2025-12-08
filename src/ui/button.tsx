import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function Button({children, ...rest}: ButtonProps) {
  return (
    <button 
      {...rest}
      className='min-w-min cursor-pointer rounded-[5px] bg-(--button-color-brown) text-(--text-color) border-2 border-[#000000] px-4 py-2 mt-4 hover:opacity-80 transition-opacity font-bold shadow-[4px_4px_0px_rgb(0,0,0)]'>
      {children}
    </button>
  )
}
