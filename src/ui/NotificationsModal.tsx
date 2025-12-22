'use client';

import React, { useEffect, useRef } from 'react';
import { Heart, UserPlus, MessageCircle, Music2 } from 'lucide-react';

interface Notification {
  id: string;
  type: 'like' | 'follow' | 'comment' | 'music';
  user: string;
  message: string;
  time: string;
}

// Notifications fictives
const SAMPLE_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'like', user: 'Free Music Lab', message: 'a aimé votre post', time: 'Il y a 5 min' },
  { id: '2', type: 'follow', user: 'Aonescape', message: 's\'est abonné à votre profil', time: 'Il y a 12 min' },
  { id: '3', type: 'comment', user: 'ninjatea', message: 'a commenté : "Super son !"', time: 'Il y a 25 min' },
  { id: '4', type: 'like', user: 'The Fifth Resonance', message: 'a aimé votre post', time: 'Il y a 1h' },
  { id: '5', type: 'music', user: 'Frank Schröter', message: 'a ajouté votre titre à sa playlist', time: 'Il y a 2h' },
  { id: '6', type: 'follow', user: 'Morween', message: 's\'est abonné à votre profil', time: 'Il y a 3h' },
];

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: 'light' | 'dark';
}

export function NotificationsModal({ isOpen, onClose, variant = 'light' }: NotificationsModalProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer au clic à l'extérieur
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Délai pour éviter de fermer immédiatement au clic d'ouverture
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like': return <Heart size={16} className="text-red-500" fill="currentColor" />;
      case 'follow': return <UserPlus size={16} className="text-blue-500" />;
      case 'comment': return <MessageCircle size={16} className="text-green-500" />;
      case 'music': return <Music2 size={16} className="text-(--yellow)" />;
    }
  };

  const bgColor = variant === 'dark' ? 'bg-[#2a2518]' : 'bg-white';
  const textColor = variant === 'dark' ? 'text-(--text-color)' : 'text-gray-900';
  const subTextColor = variant === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const borderColor = variant === 'dark' ? 'border-white/10' : 'border-gray-200';
  const hoverBg = variant === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50';
  const iconBg = variant === 'dark' ? 'bg-white/10' : 'bg-gray-100';

  return (
    <div 
      ref={dropdownRef}
      className={`absolute top-full right-0 mt-2 w-80 z-50 ${bgColor} rounded-xl shadow-2xl border ${borderColor} max-h-[60vh] overflow-hidden`}
      style={{ animation: 'fadeInDown 0.2s ease-out' }}
    >
      {/* Header simple */}
      <div className={`px-4 py-3 border-b ${borderColor}`}>
        <h3 className={`font-semibold ${textColor}`}>Notifications</h3>
      </div>
      
      {/* Liste des notifications */}
      <div className="overflow-y-auto max-h-[calc(60vh-50px)]">
        {SAMPLE_NOTIFICATIONS.map((notif) => (
          <div 
            key={notif.id}
            className={`flex items-start gap-3 px-4 py-3 ${hoverBg} transition-colors cursor-pointer border-b ${borderColor} last:border-b-0`}
          >
            {/* Icône */}
            <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
              {getIcon(notif.type)}
            </div>
            
            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${textColor}`}>
                <span className="font-semibold">{notif.user}</span>{' '}
                <span className={subTextColor}>{notif.message}</span>
              </p>
              <p className={`text-xs ${subTextColor} mt-0.5`}>{notif.time}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Style animation */}
      <style jsx>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
