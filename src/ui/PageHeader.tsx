'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft, LogOut, Bell } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { NotificationsModal } from './NotificationsModal';

interface PageHeaderProps {
  /** Titre affiché au centre du header */
  title: string;
  /** Afficher la flèche retour (pour pages secondaires) */
  showBack?: boolean;
  /** Afficher l'icône déconnexion (uniquement pour la page profile) */
  showLogout?: boolean;
  /** Afficher l'icône notifications (pour les autres pages principales) */
  showNotifications?: boolean;
  /** Variante de couleur: 'light' pour fond blanc, 'dark' pour fond sombre */
  variant?: 'light' | 'dark';
  /** Action personnalisée à afficher à droite (ex: bouton supprimer) */
  rightAction?: ReactNode;
}

export function PageHeader({ 
  title, 
  showBack = false, 
  showLogout = false,
  showNotifications = false,
  variant = 'light',
  rightAction
}: PageHeaderProps) {
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Styles selon la variante (style glassmorphism comme la navbar)
  const bgStyle = variant === 'dark' 
    ? 'bg-[#3d3525]/80 backdrop-blur-xl' 
    : 'bg-gray-50/95 backdrop-blur-xl'; // Gris léger pour être plus visible
  const borderStyle = variant === 'dark' 
    ? 'border-b border-white/10' 
    : 'border-b border-gray-200';
  const textColor = variant === 'dark' ? 'text-(--text-color)' : 'text-gray-900';
  const iconColor = variant === 'dark' ? 'text-(--text-color)' : 'text-gray-600';
  const hoverBg = variant === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100';

  return (
    <>
      <header className={`sticky top-0 z-30 ${bgStyle} ${borderStyle} rounded-b-2xl`}>
        <div className="flex items-center justify-between px-4 py-4 relative">
          {/* Gauche: Flèche retour ou espace vide */}
          <div className="w-10">
            {showBack && (
              <button
                onClick={handleBack}
                className={`p-2 rounded-full ${hoverBg} transition-colors`}
                aria-label="Retour"
              >
                <ChevronLeft size={24} className={iconColor} />
              </button>
            )}
          </div>

          {/* Centre: Titre */}
          <h1 className={`font-bold text-[1.4em] ${textColor}`}>{title}</h1>

          {/* Droite: Action personnalisée, notifications, déconnexion, ou espace vide */}
          <div className="w-10 flex justify-end relative">
            {rightAction ? (
              rightAction
            ) : showNotifications && isAuthenticated ? (
              <button
                onClick={() => setIsNotificationsOpen(true)}
                className={`p-2 rounded-full ${hoverBg} transition-colors relative`}
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell size={20} className={iconColor} />
                {/* Badge de notification */}
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            ) : showLogout && isAuthenticated ? (
              <button
                onClick={handleLogout}
                className={`p-2 rounded-full ${hoverBg} transition-colors`}
                aria-label="Se déconnecter"
                title="Se déconnecter"
              >
                <LogOut size={20} className={iconColor} />
              </button>
            ) : null}
            
            {/* Modal des notifications - positionné par rapport au bouton */}
            <NotificationsModal 
              isOpen={isNotificationsOpen} 
              onClose={() => setIsNotificationsOpen(false)}
              variant={variant}
            />
          </div>
        </div>
      </header>
    </>
  );
}

