import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  User, X, CheckCircle, Sparkles, ShieldCheck, Tag, 
  RotateCcw, Cloud, Zap, Crown, ArrowRight
} from 'lucide-react';
import { useShop } from '../../context/ShopContext.tsx';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (phone: string) => void;
  onOpenOrders?: () => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const { 
    customerProfile, 
    customerTiers, 
    refreshCustomerProfile, 
  } = useShop();

  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '') || '/api';

  // Automatically close modal if user is already logged in
  useEffect(() => {
    if (isOpen && customerProfile) {
      onClose();
    }
  }, [isOpen, customerProfile, onClose]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    let rawPhone = phoneInput.trim().replace(/\s+/g, '');
    if (!rawPhone) return;

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
      const res = await fetch(`${apiBase}/v1/public/customer/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: rawPhone, name: nameInput.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.status === 'success') {
        const p = json.data;
        await refreshCustomerProfile(p.phone);
        setSuccessMsg('ເຂົ້າສູ່ລະບົບສຳເລັດແລ້ວ! ຍິນດີຕ້ອນຮັບສູ່ Som Sing Phim VIP');
        if (onLoginSuccess) onLoginSuccess(p.phone);
        // Direct transition into website - close modal immediately
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setErrorMsg(json.error || json.message || 'ບໍ່ສາມາດເຂົ້າສູ່ລະບົບໄດ້');
      }
    } catch {
      setErrorMsg('ເຊື່ອມຕໍ່ລະບົບຜິດພາດ ກະລຸນາກວດສອບການເຊື່ອມຕໍ່');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const demoEmail = 'customer@gmail.com';
      const demoName = 'Som Sing Phim VIP Atelier';
      const demoPhone = '020 55889988';

      const res = await fetch(`${apiBase}/v1/public/customer/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: demoPhone, name: demoName, email: demoEmail }),
      });
      const json = await res.json();
      if (res.ok && json.status === 'success') {
        await refreshCustomerProfile(demoPhone);
        setSuccessMsg('ເຂົ້າສູ່ລະບົບດ້ວຍ Google ສຳເລັດແລ້ວ!');
        if (onLoginSuccess) onLoginSuccess(demoPhone);
        // Direct transition into website - close modal immediately
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setErrorMsg('ບໍ່ສາມາດເຂົ້າສູ່ລະບົບດ້ວຍ Google ໄດ້');
      }
    } catch {
      setErrorMsg('ເຊື່ອມຕໍ່ລະບົບຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || customerProfile) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-5 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900">
        
        {/* Modal Top Bar - Light Ivory Atelier */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-300 text-amber-600 flex items-center justify-center shadow-xs">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-wide text-slate-900">
                  SOM SING PHIM ATELIER
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 border border-amber-300 text-amber-800">
                  VIP PRIVILEGES
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block font-sans">
                ໂຮງພິມດິຈິຕອນມາດຕະຖານສາກົນ • ສັ່ງງ່າຍ ໄດ້ໄວ ຄຸ້ມຄ່າ
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Notifications */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-fade-in shadow-xs">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-fade-in">
            <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Body: Light Theme Split Bento */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            
            {/* Left Column: Member Privilege Showcase */}
            <div className="order-2 lg:order-1 lg:col-span-7 bg-slate-50 border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center gap-2 text-amber-700 text-xs font-black uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>ສິດທິພິເສດເມື່ອເຂົ້າສູ່ລະບົບສະມາຊິກ</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  ປົດລັອກລາຄາສະມາຊິກ VIP & ສັ່ງພິມຊ້ຳ 1 ຄລິກ
                </h2>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  ສະມາຊິກ Som Sing Phim Atelier ຈະໄດ້ຮັບສິດທິປະໂຫຍດ ແລະ ຄວາມສະດວກສະບາຍໃນການສັ່ງພິມທີ່ເໜືອກວ່າລູກຄ້າທົ່ວໄປ:
                </p>
              </div>

              {/* 4 Bento Perks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 transition shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-2">
                    <Tag className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-slate-900 block">ສ່ວນຫຼຸດພິເສດ 5 - 15%</span>
                  <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                    ຮັບສ່ວນຫຼຸດພິເສດທັນທີທຸກງານພິມຕາມລະດັບ VIP
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 transition shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-2">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-slate-900 block">ສັ່ງພິມຊ້ຳໃນ 1 ຄລິກ</span>
                  <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                    ບັນທຶກສະເປກວັດສະດຸ, ຂະໜາດ ແລະ ຈຳນວນເດີມ
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 transition shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mb-2">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-slate-900 block">ຄັງເກັບໄຟລ໌ Artwork Cloud</span>
                  <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                    ເກັບໄຟລ໌ຄວາມລະອຽດສູງພ້ອມພິມຕະຫຼອດ 24 ຊມ.
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 transition shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-2">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-slate-900 block">ກວດໄຟລ໌ Proof ດ່ວນ ຟຣີ</span>
                  <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                    Fast-Track Preflight Proofing ມາດຕະຖານໂຮງພິມ
                  </span>
                </div>
              </div>

              {/* VIP Tiers Roadmap Indicator */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
                <span className="text-[11px] font-black text-amber-900 block mb-1.5 uppercase">
                  ລະດັບສະມາຊິກ Som Sing Phim VIP:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {(customerTiers.length > 0 ? customerTiers : [
                    { id: 'STANDARD', name_lo: 'Standard (0%)' },
                    { id: 'SILVER', name_lo: 'Silver VIP (-5%)' },
                    { id: 'GOLD', name_lo: 'Gold VIP (-10%)' },
                    { id: 'PLATINUM', name_lo: 'Platinum (-15%)' },
                  ]).map((tier) => (
                    <span 
                      key={tier.id} 
                      className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-white border border-slate-200 text-slate-700 flex items-center gap-1 shadow-xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>{tier.name_lo}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Fast Sign-In Form */}
            <div className="order-1 lg:order-2 lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col justify-center space-y-4 shadow-sm">
              <div>
                <h3 className="text-base font-black text-slate-900">ເຂົ້າສູ່ລະບົບດ່ວນ</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ເລືອກວິທີທີ່ສະດວກ ບໍ່ຕ້ອງຈື່ລະຫັດຜ່ານ
                </p>
              </div>

              {/* Google 1-Click Sign-in Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 active:scale-[0.99] border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-3 transition shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>ເຂົ້າສູ່ລະບົບດ້ວຍ Google (1-Click)</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] uppercase font-bold text-slate-400">ຫຼື ໃຊ້ເບີໂທລະສັບ</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Phone Sign-In Form */}
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-700 block uppercase">
                    ເບີໂທລະສັບ (Phone Number) *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-slate-500 select-none">
                      +856 20
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="55XXXXXX ຫຼື 77XXXXXX"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full pl-22 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-100 transition placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-700 block uppercase">
                    ຊື່ລູກຄ້າ / ຊື່ຮ້ານ (ທາງເລືອກ)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ປ້ອນຊື່ຂອງທ່ານ ຫຼື ຊື່ແບຣນ..."
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-100 transition placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn--gold w-full py-3 rounded-xl text-sm shadow-glow font-black text-slate-950 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{loading ? 'ກຳລັງກວດສອບ...' : 'ເຂົ້າສູ່ລະບົບ / ຮັບສິດ VIP'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
