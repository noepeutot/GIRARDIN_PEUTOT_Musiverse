'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Music, Upload, ImageIcon } from 'lucide-react';
import { useUserMusic } from '@/lib/userMusicContext';
import { useAuth } from '@/lib/authContext';

interface UploadSoundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadSoundModal({ isOpen, onClose }: UploadSoundModalProps) {
  const { addUserTrack } = useUserMusic();
  const { user } = useAuth();
  
  const [name, setName] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [coverImage, setCoverImage] = useState<string>('/albumCoverExample.png');
  const [duration, setDuration] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      
      // Obtenir la durée
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        setDuration(Math.floor(audio.duration));
      };
      
      // Utiliser le nom du fichier si pas de nom défini
      if (!name) {
        setName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverImage(url);
    }
  };

  const handleSubmit = () => {
    if (!name.trim() || !audioUrl || isSubmitting) return;
    
    setIsSubmitting(true);
    
    const track = addUserTrack({
      name: name.trim(),
      duration,
      artist_id: user?.id || 'anonymous',
      artist_name: user?.displayName || 'Artiste inconnu',
      artist_idstr: user?.id || 'anonymous',
      album_name: 'Uploads',
      album_id: 'user_uploads',
      album_image: coverImage,
      audio: audioUrl,
      image: coverImage,
    });
    
    console.log('Track ajoutée:', track);
    
    // Reset et fermer
    setName('');
    setAudioFile(null);
    setAudioUrl('');
    setCoverImage('/albumCoverExample.png');
    setDuration(0);
    setIsSubmitting(false);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const canSubmit = name.trim() && audioUrl;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-(--background-brown) w-full max-w-lg rounded-t-3xl p-6 animate-slide-up"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-(--text-color)">Ajouter un son</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} className="text-(--text-color)" />
          </button>
        </div>

        {/* Cover Image */}
        <div className="flex justify-center mb-6">
          <div 
            className="relative w-40 h-40 rounded-2xl overflow-hidden bg-[#3d3525] cursor-pointer group"
            onClick={() => imageInputRef.current?.click()}
          >
            <Image
              src={coverImage}
              alt="Cover"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ImageIcon size={32} className="text-white" />
            </div>
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* Nom du son */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Nom du son</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mon super morceau"
            className="w-full bg-[#3d3525] text-(--text-color) rounded-xl px-4 py-3 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-(--yellow)"
          />
        </div>

        {/* Fichier audio */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Fichier audio</label>
          <button
            onClick={() => audioInputRef.current?.click()}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-dashed transition-colors ${
              audioFile 
                ? 'border-(--yellow) bg-(--yellow)/10' 
                : 'border-gray-500 hover:border-gray-400'
            }`}
          >
            {audioFile ? (
              <>
                <Music size={24} className="text-(--yellow)" />
                <span className="text-(--text-color) truncate max-w-[200px]">{audioFile.name}</span>
                <span className="text-gray-400 text-sm">
                  ({Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')})
                </span>
              </>
            ) : (
              <>
                <Upload size={24} className="text-gray-400" />
                <span className="text-gray-400">Sélectionner un fichier audio</span>
              </>
            )}
          </button>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioSelect}
            className="hidden"
          />
        </div>

        {/* Preview audio */}
        {audioUrl && (
          <div className="mb-6">
            <audio ref={audioRef} src={audioUrl} controls className="w-full" />
          </div>
        )}

        {/* Bouton Ajouter */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            canSubmit && !isSubmitting
              ? 'bg-(--yellow) text-(--background-brown) hover:opacity-90'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Ajout en cours...' : 'Ajouter le son'}
        </button>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
