import React from 'react';
import { useAuthStore } from '@store/useAuthStore';
import { LoginPage } from '@features/auth/LoginPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Authentication bypass enabled for preview / front-end testing mode.
  // Original login flow is preserved in LoginPage.tsx when needed.
  return <>{children}</>;
};
