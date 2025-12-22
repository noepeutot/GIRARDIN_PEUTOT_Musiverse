'use client';

import { useEffect } from 'react';

/**
 * Hook pour appliquer un thème au body
 * @param theme - 'dark' pour les pages music (gradient), 'light' pour les autres (blanc)
 */
export function useBodyTheme(theme: 'dark' | 'light') {
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('theme-dark');
    } else {
      document.body.classList.remove('theme-dark');
    }

    // Cleanup: retirer la classe quand on quitte la page
    return () => {
      document.body.classList.remove('theme-dark');
    };
  }, [theme]);
}
