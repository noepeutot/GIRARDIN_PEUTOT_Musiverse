import { Search } from 'lucide-react'
import React from 'react'

export const SearchBar = () => {
  return (
    <label className='w-8/10 pl-2 flex items-center gap-x-2 bg-[#F5F5F5] rounded-full' htmlFor="search-bar">
      <Search color="#A2A2A2" />
      <input
        type="text"
        id="search-bar"
        placeholder="Recherchez un son"
        className="p-2 w-full outline-none placeholder:text-gray-400"
      />
    </label>
  )
}
