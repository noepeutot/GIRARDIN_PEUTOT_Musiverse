import React from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout principal de l'application
 * Contenu limité en largeur et centré
 */
export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-content">
      {children}
    </div>
  );
}
