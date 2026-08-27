import React from 'react';
import { useAuthStore } from '@store/useAuthStore';
import { LoginPage } from '@features/auth/LoginPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, token } = useAuthStore();

  // Allow public order tracking page without login
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/track')) {
    return <>{children}</>;
  }

  if (!isAuthenticated || !token) {
    return <LoginPage />;
  }

  return <>{children}</>;
};
