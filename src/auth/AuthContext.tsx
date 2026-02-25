import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { apiFetch } from '../api/http';
import { STORAGE_KEYS } from '../config';

export type User = {
  id: number;
  email: string;
  name: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type TokenWithUser = {
  access_token: string;
  token_type: 'bearer' | string;
  user: User;
};

async function persistAuth(user: User, token: string) {
  await AsyncStorage.setMany({
    [STORAGE_KEYS.token]: token,
    [STORAGE_KEYS.user]: JSON.stringify(user),
  });
}

async function clearAuth() {
  await AsyncStorage.removeMany([STORAGE_KEYS.token, STORAGE_KEYS.user]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await AsyncStorage.getMany([STORAGE_KEYS.token, STORAGE_KEYS.user]);
        const storedToken = data[STORAGE_KEYS.token] ?? null;
        const storedUserRaw = data[STORAGE_KEYS.user] ?? null;
        if (!mounted) return;

        if (storedToken && storedUserRaw) {
          const parsed = JSON.parse(storedUserRaw) as User;
          setToken(storedToken);
          setUser(parsed);
        }
      } catch {
        if (mounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await apiFetch<TokenWithUser>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(data.user);
      setToken(data.access_token);
      await persistAuth(data.user, data.access_token);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const data = await apiFetch<TokenWithUser>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), email, password }),
      });
      setUser(data.user);
      setToken(data.access_token);
      await persistAuth(data.user, data.access_token);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    await clearAuth();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
    }),
    [user, token, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

