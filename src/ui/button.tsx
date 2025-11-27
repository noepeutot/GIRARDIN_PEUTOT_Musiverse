import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function Button({children, ...rest}: ButtonProps) {
  return (
    <button 
      {...rest}
      className='cursor-pointer rounded-[5px] bg-pink-500 text-white px-4 py-2 mt-4 hover:opacity-80 transition-opacity font-bold shadow-[6px_6px_0px_rgba(236,94,252,0.50)]'>
      {children}
    </button>
  )
}
