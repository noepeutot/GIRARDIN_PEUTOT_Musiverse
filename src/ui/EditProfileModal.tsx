'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, Camera } from 'lucide-react';
import { User } from '@/lib/authContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (updates: { displayName: string; bio: string; image: string }) => void;
}

// Images de profil prédéfinies (12 avatars disponibles)
const AVATAR_OPTIONS = [
  '/avatar1.jpg',
  '/avatar2.jpg',
  '/avatar3.jpg',
  '/avatar4.jpg',
  '/avatar5.jpg',
  '/avatar6.jpg',
  '/avatar7.jpg',
  '/avatar8.jpg',
  '/avatar9.jpg',
  '/avatar10.jpg',
  '/avatar11.jpg',
  '/avatar12.jpg',
];

export function EditProfileModal({ isOpen, onClose, user, onSave }: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [selectedImage, setSelectedImage] = useState(user.image);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const avatarScrollRef = useRef<HTMLDivElement>(null);

  // Réinitialiser les valeurs quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setDisplayName(user.displayName);
      setBio(user.bio);
      setSelectedImage(user.image);
      setShowAvatarPicker(false);
    }
  }, [isOpen, user]);

  // Bloquer le scroll du body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Gérer le scroll horizontal à la molette
  useEffect(() => {
    const scrollContainer = avatarScrollRef.current;
    if (!scrollContainer) return;

    const handleWheel = (e: WheelEvent) => {
      // Convertir le scroll vertical en scroll horizontal
      e.preventDefault();
      scrollContainer.scrollLeft += e.deltaY;
    };

    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
    return () => scrollContainer.removeEventListener('wheel', handleWheel);
  }, [showAvatarPicker]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!displayName.trim()) return;
    onSave({
      displayName: displayName.trim(),
      bio: bio.trim(),
      image: selectedImage,
    });
    onClose();
  };

  const handleImageSelect = (img: string) => {
    setSelectedImage(img);
    setShowAvatarPicker(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-bold text-lg">Modifier le profil</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        {/* Contenu */}
        <div className="p-6">
          {/* Photo de profil */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-(--yellow) shadow-lg">
                <Image
                  src={selectedImage}
                  alt="Photo de profil"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute bottom-0 right-0 w-8 h-8 bg-(--brown) rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
              >
                <Camera size={16} className="text-(--text-color)" />
              </button>
            </div>
            
            {/* Sélecteur d'avatar */}
            {showAvatarPicker && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl w-full relative">
                <p className="text-sm text-gray-500 mb-2 text-center">Choisir un avatar (défilez sur la droite)</p>
                <div 
                  ref={avatarScrollRef}
                  className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {AVATAR_OPTIONS.map((avatar, index) => (
                    <button
                      key={index}
                      onClick={() => handleImageSelect(avatar)}
                      className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all flex-shrink-0 ${
                        selectedImage === avatar 
                          ? 'border-(--yellow) scale-110' 
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <Image
                        src={avatar}
                        alt={`Avatar ${index + 1}`}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nom d'affichage */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom d'affichage
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--yellow) focus:border-transparent"
              placeholder="Votre nom"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{displayName.length}/30</p>
          </div>

          {/* Bio */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={150}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--yellow) focus:border-transparent resize-none"
              placeholder="Décrivez-vous en quelques mots..."
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/150</p>
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={!displayName.trim()}
              className="flex-1 py-2.5 bg-(--brown) text-(--text-color) font-medium rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
