import React, { useState } from 'react';
import { X, Lock, Globe } from 'lucide-react';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, isPublic: boolean) => void;
}

export const CreatePlaylistModal = ({ isOpen, onClose, onCreate }: CreatePlaylistModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), description.trim(), isPublic);
      setName('');
      setDescription('');
      setIsPublic(false);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#1a1610] rounded-2xl w-full max-w-sm relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-(--text-color)">Nouvelle playlist</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Nom de la playlist</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ma playlist..."
              className="w-full px-4 py-3 bg-[#2a2518] rounded-lg text-(--text-color) placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-(--yellow)"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Description (optionnel)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ajouter une description..."
              rows={3}
              className="w-full px-4 py-3 bg-[#2a2518] rounded-lg text-(--text-color) placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-(--yellow) resize-none"
            />
          </div>

          {/* Visibilité */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Visibilité</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors ${
                  !isPublic 
                    ? 'bg-(--yellow) text-(--background-brown)' 
                    : 'bg-[#2a2518] text-gray-400 hover:bg-[#3d3525]'
                }`}
              >
                <Lock size={18} />
                <span className="text-sm font-medium">Privée</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors ${
                  isPublic 
                    ? 'bg-(--yellow) text-(--background-brown)' 
                    : 'bg-[#2a2518] text-gray-400 hover:bg-[#3d3525]'
                }`}
              >
                <Globe size={18} />
                <span className="text-sm font-medium">Publique</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 bg-(--yellow) text-(--background-brown) font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            Créer
          </button>
        </form>
      </div>
    </div>
  );
};
