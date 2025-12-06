import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, UserProfile } from '@/lib/api';

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    initAuth();
  }, []);

  async function initAuth() {
    try {
      await apiClient.init();
      if (apiClient.isAuthenticated()) {
        await refreshUser();
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth init error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await apiClient.login(email, password);
    setUser({
      user: response.user,
      client: response.client,
      credits: { allocated: 0, used: 0, remaining: 0 },
    });
    setIsAuthenticated(true);
    await refreshUser();
  }

  async function logout() {
    await apiClient.logout();
    setUser(null);
    setIsAuthenticated(false);
  }

  async function refreshUser() {
    try {
      const profile = await apiClient.fetch<UserProfile>('/api/mobile/me');
      setUser(profile);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ isLoading, isAuthenticated, user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
