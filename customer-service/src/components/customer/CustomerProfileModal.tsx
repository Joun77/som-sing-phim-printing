import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Phone, MapPin, X, Save, LogOut, CheckCircle, ShoppingBag, Sparkles, ShieldCheck } from 'lucide-react';

interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  province: string;
  district: string;
  village: string;
  branchCode: string;
  tier?: string;
  totalSpentLAK?: number;
  totalOrdersCount?: number;
}

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (phone: string) => void;
  onOpenOrders?: () => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenOrders,
}) => {
  const [authMode, setAuthMode] = useState<'phone' | 'google'>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form states for profile editing
  const [name, setName] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [address, setAddress] = useState('');
  const [branchCode, setBranchCode] = useState('');

  const loadProfile = async (storedPhone: string) => {
    try {
      const res = await fetch(`${API_BASE}/v1/public/customer/profile?phone=${encodeURIComponent(storedPhone)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && json.data) {
          const p = json.data;
          setProfile(p);
          setName(p.name || '');
          setProvince(p.province || '');
          setDistrict(p.district || '');
          setVillage(p.village || '');
          setAddress(p.address || '');
          setBranchCode(p.branchCode || '');
        }
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('ssp_customer_phone');
    if (stored && isOpen) {
      loadProfile(stored);
    }
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    let rawPhone = phoneInput.trim().replace(/\s+/g, '');
    if (!rawPhone) return;

    // Normalize Lao phone numbers
    if (rawPhone.startsWith('+85620')) {
      rawPhone = '020' + rawPhone.slice(6);
    } else if (rawPhone.startsWith('85620')) {
      rawPhone = '020' + rawPhone.slice(5);
    } else if (rawPhone.length === 8 && !rawPhone.startsWith('020')) {
      rawPhone = '020' + rawPhone;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/v1/public/customer/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: rawPhone, name: nameInput.trim() })
      });
      const json = await res.json();
      if (res.ok && json.status === 'success') {
        const p = json.data;
        localStorage.setItem('ssp_customer_phone', p.phone);
        localStorage.setItem('ssp_customer_id', p.id);
        if (p.name) localStorage.setItem('ssp_customer_name', p.name);
        setProfile(p);
        setName(p.name || '');
        setProvince(p.province || '');
        setDistrict(p.district || '');
        setVillage(p.village || '');
        setAddress(p.address || '');
        setBranchCode(p.branchCode || '');
        setSuccessMsg('ເຂົ້າສູ່ລະບົບສຳເລັດແລ້ວ!');
        setTimeout(() => setSuccessMsg(''), 3000);
        if (onLoginSuccess) onLoginSuccess(p.phone);
      } else {
        setErrorMsg(json.error || 'ບໍ່ສາມາດເຂົ້າສູ່ລະບົບໄດ້');
      }
    } catch (err) {
      setErrorMsg('ເຊື່ອມຕໍ່ລະບົບຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Fast frictionless simulated OAuth for Google Account
      const demoEmail = 'customer@gmail.com';
      const demoName = 'Som Sing Phim VIP';
      const demoPhone = '020 55889988';

      const res = await fetch(`${API_BASE}/v1/public/customer/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: demoPhone, name: demoName, email: demoEmail })
      });
      const json = await res.json();
      if (res.ok && json.status === 'success') {
        const p = json.data;
        localStorage.setItem('ssp_customer_phone', p.phone);
        localStorage.setItem('ssp_customer_id', p.id);
        if (p.name) localStorage.setItem('ssp_customer_name', p.name);
        setProfile(p);
        setName(p.name || demoName);
        setProvince(p.province || 'ນະຄອນຫຼວງວຽງຈັນ');
        setDistrict(p.district || 'ໄຊເສດຖາ');
        setVillage(p.village || 'ໂພນພະເນົາ');
        setAddress(p.address || '');
        setBranchCode(p.branchCode || '');
        setSuccessMsg('ເຂົ້າສູ່ລະບົບດ້ວຍ Google ສຳເລັດແລ້ວ!');
        setTimeout(() => setSuccessMsg(''), 3000);
        if (onLoginSuccess) onLoginSuccess(p.phone);
      } else {
        setErrorMsg('ບໍ່ສາມາດເຂົ້າສູ່ລະບົບດ້ວຍ Google ໄດ້');
      }
    } catch {
      setErrorMsg('ເຊື່ອມຕໍ່ລະບົບຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/v1/public/customer/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profile.id,
          name,
          phone: profile.phone,
          province,
          district,
          village,
          address,
          branchCode
        })
      });
      const json = await res.json();
      if (res.ok && json.status === 'success') {
        setProfile(json.data);
        if (name) localStorage.setItem('ssp_customer_name', name);
        setSuccessMsg('ບັນທຶກຂໍ້ມູນທີ່ຢູ່ຈັດສົ່ງຮຽບຮ້ອຍແລ້ວ!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(json.error || 'ບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ');
      }
    } catch (err) {
      setErrorMsg('ເຊື່ອມຕໍ່ລະບົບຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ssp_customer_phone');
    localStorage.removeItem('ssp_customer_id');
    localStorage.removeItem('ssp_customer_name');
    setProfile(null);
    setPhoneInput('');
    setNameInput('');
    if (onLoginSuccess) onLoginSuccess('');
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                {profile ? 'ໂປຣໄຟລ໌ສະມາຊິກ & ທີ່ຢູ່ຈັດສົ່ງ' : 'ເຂົ້າສູ່ລະບົບສະມາຊິກ'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {profile ? `ID: ${profile.id}` : 'Som Sing Phim Printing Atelier'}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-xs font-bold rounded-2xl">
              <span>{errorMsg}</span>
            </div>
          )}

          {!profile ? (
            /* Login Form */
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                ເຂົ້າສູ່ລະບົບເພື່ອຕິດຕາມສະຖານະງານພິມ, <strong>ສັ່ງພິມຊ້ຳໃນ 1 ຄລິກ (1-Click Re-order)</strong> ແລະ ບັນທຶກທີ່ຢູ່ຈັດສົ່ງອັດຕະໂນມັດ.
              </p>

              {/* Google 1-Click Login Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-center gap-2.5 transition shadow-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>ເຂົ້າສູ່ລະບົບດ້ວຍ Google (Sign in with Google)</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                <span className="text-[10px] uppercase font-bold text-slate-400">ຫຼື ເຂົ້າສູ່ລະບົບດ້ວຍເບີໂທ</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              </div>

              <form onSubmit={handleLogin} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 block uppercase">
                    ເບີໂທລະສັບ (Phone Number) *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-slate-400 select-none">
                      🇱🇦 +856 20
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="55XXXXXX ຫຼື 77XXXXXX"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full pl-24 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-mono focus:outline-hidden focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 block uppercase">
                    ຊື່ລູກຄ້າ / ຊື່ຮ້ານ (ທາງເລືອກ)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ປ້ອນຊື່ຂອງທ່ານ ຫຼື ຊື່ແບຣນ..."
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-hidden focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-slate-950 font-black rounded-2xl text-sm transition shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {loading ? 'ກຳລັງກວດສອບ...' : 'ເຂົ້າສູ່ລະບົບ / ລົງທະບຽນ'}
                </button>
              </form>
            </div>
          ) : (
            /* Member Profile & Address Book Form */
            <div className="space-y-4">
              
              {/* Member Card & VIP Tier */}
              <div className="p-4 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-sm">
                      {(profile.name || profile.phone).substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-black text-slate-900 dark:text-white block">
                        {profile.name || 'ລູກຄ້າ ສົມສິງພິມ'}
                      </span>
                      <span className="text-xs font-mono text-slate-500 block">
                        {profile.phone}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-3 h-3" />
                    <span>{profile.tier || 'STANDARD VIP'}</span>
                  </span>
                </div>

                {/* Quick Shortcut to Order History & 1-Click Reorder */}
                {onOpenOrders && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenOrders();
                    }}
                    className="w-full py-2 px-3 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700/80 border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>ເບິ່ງປະຫວັດການສັ່ງຊື້ & ສັ່ງພິມຊ້ຳ (Re-order)</span>
                  </button>
                )}
              </div>

              {/* Address Form */}
              <form onSubmit={handleSaveProfile} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 block uppercase">ຊື່ຜູ້ຮັບສິນຄ້າ / ຊື່ຮ້ານ</label>
                  <input
                    type="text"
                    required
                    placeholder="ຊື່ ແລະ ນາມສະກຸນ"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-hidden focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 block uppercase">ແຂວງ</label>
                    <input
                      type="text"
                      placeholder="ຕົວຢ່າງ: ນະຄອນຫຼວງວຽງຈັນ"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-hidden focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 block uppercase">ເມືອງ</label>
                    <input
                      type="text"
                      placeholder="ຕົວຢ່າງ: ໄຊເສດຖາ"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-hidden focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 block uppercase">ບ້ານ</label>
                  <input
                    type="text"
                    placeholder="ຕົວຢ່າງ: ໂພນພະເນົາ"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-hidden focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 block uppercase">ລາຍລະອຽດທີ່ຢູ່ເພີ່ມເຕີມ / ສາຂາຂົນສົ່ງ</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <textarea
                      rows={2}
                      placeholder="ເລກທີເຮືອນ, ຮ່ອມ, ປ້າຍບອກທາງ ຫຼື ສາຂາຂົນສົ່ງທີ່ສະດວກຮັບ..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-hidden focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 block uppercase">ລະຫັດສາຂາຂົນສົ່ງທີ່ໃຊ້ປະຈຳ (ຕົວເລືອກ)</label>
                  <input
                    type="text"
                    placeholder="ຕົວຢ່າງ: AN-VTE-02 (ອານຸສິດ ໄຊເສດຖາ)"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-hidden focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-slate-950 font-black rounded-2xl text-sm transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກທີ່ຢູ່ຈັດສົ່ງ'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-3 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl transition cursor-pointer flex items-center gap-1.5"
                    title="ອອກຈາກລະບົບ"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">ອອກຈາກລະບົບ</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
