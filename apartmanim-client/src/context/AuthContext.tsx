import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User } from '../types';
import { mockUsers, MOCK_PASSWORD } from '../data/mockData';

// ============================================
// CONTEXT TİPİ
// ============================================

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

// ============================================
// CONTEXT OLUŞTURMA
// ============================================

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================
// PROVIDER
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
  // localStorage'dan mevcut oturumu al
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('apartmanim_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Gerçek API yerine mock doğrulama
    await new Promise((r) => setTimeout(r, 800)); // yüklenme simülasyonu

    const found = mockUsers.find(
      (u) => u.email === email && password === MOCK_PASSWORD
    );

    if (found) {
      setUser(found);
      localStorage.setItem('apartmanim_user', JSON.stringify(found));
      return { success: true };
    }

    return { success: false, error: 'E-posta veya şifre hatalı.' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('apartmanim_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
