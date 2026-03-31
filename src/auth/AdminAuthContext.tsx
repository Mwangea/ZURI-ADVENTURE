/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { apiRequest } from '@/lib/api';

type AdminUser = {
  email: string;
  role: string;
};

type LoginResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  admin?: AdminUser;
};

type AdminAuthContextValue = {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authFetch: <T>(path: string, options?: { method?: string; body?: unknown }) => Promise<T>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  const refreshAccessToken = useCallback(async () => {
    const resp = await apiRequest<{ accessToken: string; tokenType: 'Bearer' }>('/api/v1/auth/refresh', {
      method: 'POST',
    });
    tokenRef.current = resp.accessToken;
    return resp.accessToken;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const resp = await apiRequest<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    tokenRef.current = resp.accessToken;
    setAdmin(resp.admin ?? { email, role: 'admin' });
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      tokenRef.current = null;
      setAdmin(null);
    }
  }, []);

  const authFetch = useCallback(
    async <T,>(path: string, options: { method?: string; body?: unknown } = {}) => {
      const currentToken = tokenRef.current;
      try {
        return await apiRequest<T>(path, {
          method: options.method,
          body: options.body,
          token: currentToken,
        });
      } catch (err) {
        const status = (err as { status?: number }).status;
        if (status !== 401) throw err;

        // Access token may be expired; try refresh once.
        const nextToken = await refreshAccessToken();
        return await apiRequest<T>(path, {
          method: options.method,
          body: options.body,
          token: nextToken,
        });
      }
    },
    [refreshAccessToken],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshAccessToken();
        if (!cancelled) {
          setAdmin((a) => a ?? { email: 'admin', role: 'admin' });
        }
      } catch {
        if (!cancelled) setAdmin(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshAccessToken]);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      admin,
      isAuthenticated: Boolean(admin && tokenRef.current),
      loading,
      login,
      logout,
      authFetch,
    }),
    [admin, loading, login, logout, authFetch],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return ctx;
}

