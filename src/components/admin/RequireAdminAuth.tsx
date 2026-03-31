import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/auth/AdminAuthContext';
import type { ReactElement } from 'react';

export default function RequireAdminAuth({ children }: { children: ReactElement }) {
  const { isAuthenticated, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-kaleo-sand text-kaleo-earth">
        <p className="font-body text-sm uppercase tracking-wider">Checking session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

