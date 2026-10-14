
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

interface ApiLoginResponse {
  token: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    role: string;
    apartmentId: number;
  };
  message: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = 'http://localhost:5285/api/Auth';

function getSavedUser(): User | null {
  try {
    const saved = localStorage.getItem('apartmanim_user');
    if (!saved) return null;

    return JSON.parse(saved) as User;
  } catch {
    localStorage.removeItem('apartmanim_user');
    localStorage.removeItem('apartmanim_token');
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getSavedUser);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as
        | ApiLoginResponse
        | { message?: string };

      if (!response.ok) {
        return {
          success: false,
          error: data.message ?? 'E-posta veya şifre hatalı.',
        };
      }

      const result = data as ApiLoginResponse;

      const loggedInUser: User = {
        id: result.user.id,
        name: result.user.fullName,
        email: result.user.email,
        role:
          result.user.role.toLowerCase() === 'admin'
            ? 'admin'
            : 'resident',
        apartmentId: result.user.apartmentId,
      };

      localStorage.setItem('apartmanim_token', result.token);
      localStorage.setItem('apartmanim_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);

      return { success: true };
    } catch {
      return {
        success: false,
        error: 'Sunucuya bağlanılamadı. API çalışıyor mu kontrol et.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('apartmanim_user');
    localStorage.removeItem('apartmanim_token');
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}
