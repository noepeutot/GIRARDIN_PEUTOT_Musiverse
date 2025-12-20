'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Type pour l'utilisateur
export interface User {
  id: string;
  username: string;
  displayName: string;
  image: string;
  bio: string;
  followers: number;
  following: number;
  joinedDate: Date;
}

// État du contexte
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'musiverse_auth_user';

// Utilisateur simulé par défaut après connexion
const createDefaultUser = (username: string): User => ({
  id: 'user_' + Date.now(),
  username: username.toLowerCase().replace(/\s+/g, '_'),
  displayName: username,
  image: '/photoProfil.png',
  bio: '🎵 Passionné de musique | Découvreur de talents',
  followers: Math.floor(Math.random() * 500) + 50,
  following: Math.floor(Math.random() * 200) + 20,
  joinedDate: new Date(),
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger l'utilisateur depuis localStorage au démarrage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsedUser = JSON.parse(stored);
        // Convertir la date string en Date object
        parsedUser.joinedDate = new Date(parsedUser.joinedDate);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'utilisateur:', error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sauvegarder dans localStorage quand l'utilisateur change
  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    }
  }, [user]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    // Simulation d'un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500));

    // Validation basique (accepte tout login/password non vide)
    if (!username.trim() || !password.trim()) {
      return false;
    }

    // Créer l'utilisateur simulé
    const newUser = createDefaultUser(username);
    setUser(newUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const updateProfile = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
