import React from 'react';
import { useAuthStore } from '@store/useAuthStore';
import { LoginPage } from '@features/auth/LoginPage';
import { ShieldAlert, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, token, user, logout } = useAuthStore();

  // Allow public order tracking page without login
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/track')) {
    return <>{children}</>;
  }

  if (!isAuthenticated || !token) {
    return <LoginPage />;
  }

  // Check role authorization if specified
  if (allowedRoles && allowedRoles.length > 0 && user) {
    const userRole = (user.role || '').toLowerCase();
    const isSuperAdmin = userRole === 'owner' || userRole === 'admin' || userRole === 'super_admin';
    const isAllowed = isSuperAdmin || allowedRoles.some(r => r.toLowerCase() === userRole);

    if (!isAllowed) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
          <div className="max-w-md w-full bg-slate-800/90 border border-slate-700 rounded-3xl p-8 space-y-4 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">ບໍ່ມີສິດເຂົ້າເຖິງ (Access Restricted)</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              ບົດບາດຂອງທ່ານ <strong>({user.role})</strong> ບໍ່ໄດ້ຮັບອະນຸຍາດໃຫ້ເຂົ້າເຖິງໜ້ານີ້. ກະລຸນາຕິດຕໍ່ຜູ້ບໍລິຫານລະບົບ ຫຼື ສະຫຼັບບົດບາດ.
            </p>
            <button
              onClick={() => logout()}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>ອອກຈາກລະບົບ (Sign Out)</span>
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
