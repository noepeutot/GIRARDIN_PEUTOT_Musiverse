import React, { useState, useEffect } from 'react';
import { X, Pencil, Globe, Lock } from 'lucide-react';
import { Playlist } from '@/lib/playlistContext';

interface EditPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Playlist;
  onSave: (name: string, description: string, isPublic: boolean) => void;
}

export const EditPlaylistModal = ({ isOpen, onClose, playlist, onSave }: EditPlaylistModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (isOpen && playlist) {
      setName(playlist.name);
      setDescription(playlist.description || '');
      setIsPublic(playlist.isPublic ?? false);
    }
  }, [isOpen, playlist]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), description.trim(), isPublic);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#1a1610] rounded-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-(--text-color)">Modifier la playlist</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-4 space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Nom de la playlist</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ma playlist"
              className="w-full bg-[#2a2518] text-(--text-color) placeholder-gray-500 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--yellow)"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Description (optionnel)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ajoute une description..."
              rows={3}
              className="w-full bg-[#2a2518] text-(--text-color) placeholder-gray-500 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--yellow) resize-none"
            />
          </div>

          {/* Visibilité */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Visibilité</label>
            <div className="flex gap-3">
              <button
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
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full border border-gray-600 text-(--text-color) hover:bg-white/5 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 py-3 rounded-full bg-(--yellow) text-(--background-brown) font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};
