import React, { useState } from 'react';
import { useAuthStore } from '@store/useAuthStore';
import { ShieldCheck, Lock, User, LogIn, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginStore = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          remember_me: rememberMe,
        }),
      });

      if (!response.ok && response.status === 404) {
        response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
            remember_me: rememberMe,
          }),
        });
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ' }));
        throw new Error(data.error || 'ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ');
      }

      const data = await response.json();
      loginStore(data.token, { username, role: data.role, fullName: data.fullname }, rememberMe);
    } catch (err: any) {
      setError(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ເຊີບເວີ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 border border-slate-100 space-y-8 animate-fade-in">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              ສົມສິ່ງພິມ (Som-Sing Printing)
            </h2>
            <p className="text-base text-slate-500 font-semibold mt-1">
              ລະບົບເຂົ້າສູ່ລະບົບສຳລັບຜູ້ບໍລິຫານ (Owner Full Access)
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3 animate-fade-in">
            <AlertCircle className="w-6 h-6 shrink-0 text-red-600" />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-extrabold text-slate-700">
              ຊື່ຜູ້ໃຊ້ງານ (Username)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl text-slate-900 font-bold placeholder-slate-400 outline-none transition"
                placeholder="ປ້ອນຊື່ຜູ້ໃຊ້..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-extrabold text-slate-700">
              ລະຫັດຜ່ານ (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl text-slate-900 font-bold placeholder-slate-400 outline-none transition"
                placeholder="ປ້ອນລະຫັດຜ່ານ..."
              />
            </div>
          </div>

          {/* Remember Me Option */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 rounded-lg border-2 border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm font-bold text-slate-700">
                ຈົດຈຳການເຂົ້າສູ່ລະບົບ (Remember Me)
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-blue-600/25 active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block animate-spin font-bold">...</span>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                ເຂົ້າສູ່ລະບົບຜູ້ບໍລິຫານ
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs font-semibold text-slate-400">
          Som-Sing Phim Printing ERP • Super Admin Mode
        </div>
      </div>
    </div>
  );
};
