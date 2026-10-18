
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  setupComplete: boolean | null;
  refreshSetupStatus: () => Promise<boolean | null>;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string;mustChangePassword?: boolean; }>;
  completePasswordChange: (token: string) => void;
  logout: () => void;
}

interface ApiLoginResponse {
  token: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    role: string;
    apartmentId: number | null;
  };
  message: string;
  mustChangePassword: boolean;
}

interface SetupStatusResponse {
  isSetupComplete?: boolean;
  IsSetupComplete?: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = 'http://localhost:5285/api/Auth';
const APARTMENTS_API_URL = 'http://localhost:5285/api/Apartments';

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
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const refreshSetupStatus = useCallback(async (): Promise<boolean | null> => {
    const token = localStorage.getItem('apartmanim_token');

    if (!token) {
      setSetupComplete(null);
      return null;
    }

    try {
      const response = await fetch(
        `${APARTMENTS_API_URL}/setup-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        setSetupComplete(null);
        return null;
      }

      const data = (await response.json()) as SetupStatusResponse;
      const completed =
        data.isSetupComplete ?? data.IsSetupComplete;

      if (typeof completed !== 'boolean') {
        setSetupComplete(null);
        return null;
      }

      setSetupComplete(completed);
      return completed;
    } catch {
      setSetupComplete(null);
      return null;
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setSetupComplete(null);
      return;
    }

    setSetupComplete(null);
    void refreshSetupStatus();
  }, [user, refreshSetupStatus]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; mustChangePassword?: boolean; }> => {
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
      console.log('Login API sonucu:', result);
console.log('Şifre değiştirme gerekli mi:', result.mustChangePassword);

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

      if (result.mustChangePassword) {
        setPendingUser(loggedInUser);
        return { success: true, mustChangePassword: true };
      }

      localStorage.setItem(
        'apartmanim_user',
        JSON.stringify(loggedInUser)
      );
      setUser(loggedInUser);

      return { success: true, mustChangePassword: false };
    } catch {
      return {
        success: false,
        error: 'Sunucuya bağlanılamadı. API çalışıyor mu kontrol et.',
      };
    }
  };

    const completePasswordChange = (newToken: string) => {
    if (!pendingUser) return;
    localStorage.setItem('apartmanim_token', newToken);
    localStorage.setItem('apartmanim_user', JSON.stringify(pendingUser));
    setUser(pendingUser);
    setPendingUser(null);
  };

  const logout = () => {
    setUser(null);
    setSetupComplete(null);
    localStorage.removeItem('apartmanim_user');
    localStorage.removeItem('apartmanim_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        setupComplete,
        refreshSetupStatus,
        login,
        completePasswordChange,
        logout,
      }}
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
