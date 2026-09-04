import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  User, Phone, MapPin, X, Save, LogOut, CheckCircle, ShoppingBag, 
  Sparkles, ShieldCheck, Tag, RotateCcw, Cloud, Zap, ChevronRight, 
  Crown, Layers, Check, ArrowRight
} from 'lucide-react';
import { useShop } from '../../context/ShopContext.tsx';
import type { CustomerOrderSummary } from '../../types/customer.ts';

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
  onOpenOrders,
}) => {
  const { 
    customerProfile, 
    customerTiers, 
    refreshCustomerProfile, 
    logoutCustomer,
    addToCart,
    openCart
  } = useShop();

  const [activeTab, setActiveTab] = useState<'card' | 'reorder' | 'address'>('card');
  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Address form fields
  const [name, setName] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [address, setAddress] = useState('');
  const [branchCode, setBranchCode] = useState('');

  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '') || '/api';

  // Sync profile into address form fields
  useEffect(() => {
    if (customerProfile) {
      setName(customerProfile.name || '');
      setProvince(customerProfile.province || '');
      setDistrict(customerProfile.district || '');
      setVillage(customerProfile.village || '');
      setAddress(customerProfile.address || '');
      setBranchCode(customerProfile.branchCode || '');
    }
  }, [customerProfile]);

  // Load customer orders when reorder tab is opened or profile changes
  useEffect(() => {
    if (customerProfile?.phone && (activeTab === 'reorder' || isOpen)) {
      setOrdersLoading(true);
      fetch(`${apiBase}/v1/public/customer/orders?phone=${encodeURIComponent(customerProfile.phone)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.status === 'success' && Array.isArray(json.data)) {
            setOrders(json.data);
          }
        })
        .catch((e) => console.error('Failed to load orders:', e))
        .finally(() => setOrdersLoading(false));
    }
  }, [customerProfile?.phone, activeTab, isOpen, apiBase]);

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
        setTimeout(() => setSuccessMsg(''), 3000);
        if (onLoginSuccess) onLoginSuccess(p.phone);
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
        setSuccessMsg('ເຂົ້າສູ່ລະບົບດ້ວຍ Google ສຳເລັດແລ້ວ! ປົດລັອກສິດທິ VIP ຮຽບຮ້ອຍ');
        setTimeout(() => setSuccessMsg(''), 3000);
        if (onLoginSuccess) onLoginSuccess(demoPhone);
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
    if (!customerProfile) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${apiBase}/v1/public/customer/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: customerProfile.id,
          name,
          phone: customerProfile.phone,
          province,
          district,
          village,
          address,
          branchCode,
        }),
      });
      const json = await res.json();
      if (res.ok && json.status === 'success') {
        await refreshCustomerProfile(customerProfile.phone);
        setSuccessMsg('ບັນທຶກຂໍ້ມູນທີ່ຢູ່ຈັດສົ່ງ ແລະ ສາຂາຂົນສົ່ງຮຽບຮ້ອຍແລ້ວ!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(json.error || json.message || 'ບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ');
      }
    } catch {
      setErrorMsg('ເຊື່ອມຕໍ່ລະບົບຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  const handleReorderItem = (item: any) => {
    // Quick Re-order into Cart
    addToCart({
      product: {
        id: item.job_name || 'reorder-item',
        slug: 'waterproof-pp-sticker',
        name: item.item_name || item.job_name || 'ງານພິມສັ່ງຊ້ຳ (Re-order)',
        nameEn: item.job_name || 'Reorder Printing Item',
        category: 'general',
        description: 'ສັ່ງພິມຊ້ຳຈາກປະຫວັດງານເກົ່າ',
        thumbnail: '/images/products/sticker-pp.jpg',
        images: [],
        features: ['ສັ່ງພິມຊ້ຳ 1-Click', 'ຄຸນນະພາບມາດຕະຖານໂຮງພິມ'],
        minQty: 1,
        leadDays: 1,
        options: {},
        basePrice: { THB: 50, LAK: 35000 },
        isFeatured: true,
      },
      config: {
        sizeId: item.paper_size || 'standard',
        materialId: 'default',
        finishingId: 'none',
        quantity: item.quantity || 100,
        specLabels: {
          size: item.paper_size || 'Standard',
          paper: item.specs?.material || 'Standard Paper',
          finishing: item.specs?.cutting || 'Standard',
        },
      },
      driveLink: '',
      permissionConfirmed: true,
      specialNotes: `ສັ່ງພິມຊ້ຳ (1-Click Re-order) ອ້າງອີງສະເປກເດີມ: ${JSON.stringify(item.specs || {})}`,
      price: {
        subtotal: item.total_price_lak || 50000,
        subtotalTHB: Math.round((item.total_price_lak || 50000) / 630),
        discount: 0,
        shipping: 0,
        total: item.total_price_lak || 50000,
        totalTHB: Math.round((item.total_price_lak || 50000) / 630),
        currency: 'LAK',
      },
    });

    onClose();
    openCart();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-5 animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-wide text-white">
                  SOM SING PHIM ATELIER
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  {customerProfile ? customerProfile.tier || 'VIP MEMBER' : 'VIP PRIVILEGES'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block font-mono">
                {customerProfile ? `ID: ${customerProfile.id} • ${customerProfile.phone}` : 'ໂຮງພິມດິຈິຕອນມາດຕະຖານສາກົນ • ສັ່ງງ່າຍ ໄດ້ໄວ ຄຸ້ມຄ່າ'}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Feedback Notifications */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-fade-in shadow-lg shadow-emerald-950/40">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-fade-in">
            <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          {!customerProfile ? (
            /* ============================================================ */
            /* PRE-LOGIN: SPLIT BENTO CARD (PERKS SHOWCASE & FAST SIGN-IN) */
            /* ============================================================ */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
              
              {/* Left Column: Member Privilege Showcase */}
              <div className="lg:col-span-7 bg-slate-950/50 border border-amber-500/20 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>ສິດທິພິເສດເມື່ອເຂົ້າສູ່ລະບົບສະມາຊິກ</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    ປົດລັອກລາຄາສະມາຊິກ VIP & ສັ່ງພິມຊ້ຳ 1 ຄລິກ
                  </h2>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    ສະມາຊິກ Som Sing Phim Atelier ຈະໄດ້ຮັບສິດທິປະໂຫຍດ ແລະ ຄວາມສະດວກສະບາຍໃນການສັ່ງພິມທີ່ເໜືອກວ່າລູກຄ້າທົ່ວໄປ:
                  </p>
                </div>

                {/* 4 Bento Perks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/30 transition">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-2">
                      <Tag className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-white block">ສ່ວນຫຼຸດພິເສດ 5 - 15%</span>
                    <span className="text-[11px] text-slate-400 leading-snug block mt-0.5">
                      ຮັບສ່ວນຫຼຸດພິເສດທັນທີທຸກງານພິມຕາມລະດັບ VIP
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/30 transition">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-2">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-white block">ສັ່ງພິມຊ້ຳໃນ 1 ຄລິກ</span>
                    <span className="text-[11px] text-slate-400 leading-snug block mt-0.5">
                      ບັນທຶກສະເປກວັດສະດຸ, ຂະໜາດ ແລະ ຈຳນວນເດີມ
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/30 transition">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-2">
                      <Cloud className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-white block">ຄັງເກັບໄຟລ໌ Artwork Cloud</span>
                    <span className="text-[11px] text-slate-400 leading-snug block mt-0.5">
                      ເກັບໄຟລ໌ຄວາມລະອຽດສູງພ້ອມພິມຕະຫຼອດ 24 ຊມ.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/30 transition">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-white block">ກວດໄຟລ໌ Proof ດ່ວນ ຟຣີ</span>
                    <span className="text-[11px] text-slate-400 leading-snug block mt-0.5">
                      Fast-Track Preflight Proofing ມາດຕະຖານໂຮງພິມ
                    </span>
                  </div>
                </div>

                {/* VIP Tiers Roadmap Indicator */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-slate-900 border border-amber-500/20">
                  <span className="text-[11px] font-black text-amber-300 block mb-1.5 uppercase">
                    ລະດັບສະມາຊິກ Som Sing Phim VIP:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {(customerTiers.length > 0 ? customerTiers : [
                      { id: 'STANDARD', name_lo: 'Standard (0%)' },
                      { id: 'SILVER', name_lo: 'Silver VIP (-5%)' },
                      { id: 'GOLD', name_lo: 'Gold VIP (-10%)' },
                      { id: 'PLATINUM', name_lo: 'Platinum (-15%)' },
                    ]).map((tier, idx) => (
                      <span 
                        key={tier.id} 
                        className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>{tier.name_lo}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Fast Sign-In Form */}
              <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-center space-y-4">
                <div>
                  <h3 className="text-base font-black text-white">ເຂົ້າສູ່ລະບົບດ່ວນ</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ເລືອກວິທີທີ່ສະດວກ ບໍ່ຕ້ອງຈື່ລະຫັດຜ່ານ
                  </p>
                </div>

                {/* Google 1-Click Sign-in Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-850 active:scale-[0.99] border border-slate-700 hover:border-slate-500 text-slate-100 font-bold rounded-2xl text-xs flex items-center justify-center gap-3 transition shadow-sm cursor-pointer"
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
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-[10px] uppercase font-bold text-slate-500">ຫຼື ໃຊ້ເບີໂທລະສັບ</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>

                {/* Phone Sign-In Form */}
                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-300 block uppercase">
                      ເບີໂທລະສັບ (Phone Number) *
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-amber-400/90 select-none">
                        +856 20
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="55XXXXXX ຫຼື 77XXXXXX"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full pl-22 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-white placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-300 block uppercase">
                      ຊື່ລູກຄ້າ / ຊື່ຮ້ານ (ທາງເລືອກ)
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="ປ້ອນຊື່ຂອງທ່ານ ຫຼື ຊື່ແບຣນ..."
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-white placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.99] text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'ກຳລັງກວດສອບ...' : 'ເຂົ້າສູ່ລະບົບ / ຮັບສິດ VIP'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* POST-LOGIN: MEMBER ATELIER HUB (TABS FOR CARD, ORDERS, ADDR) */
            /* ============================================================ */
            <div className="space-y-6">
              
              {/* Tab Selector */}
              <div className="flex items-center gap-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('card')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'card'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  <span>ບັດສະມາຊິກ & ສິດທິພິເສດ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('reorder')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'reorder'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>ງານທີ່ເຄີຍສັ່ງ & ສັ່ງຊ້ຳ ({orders.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('address')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'address'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>ທີ່ຢູ່ຈັດສົ່ງ & ສາຂາ</span>
                </button>
              </div>

              {/* TAB 1: VIP CARD & PRIVILEGES */}
              {activeTab === 'card' && (
                <div className="space-y-6">
                  {/* Luxury Atelier VIP Member Card */}
                  <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border border-amber-500/40 shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                            SOM SING PHIM PRINTING ATELIER
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                            {customerProfile.tier || 'VIP GOLD'}
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                          {customerProfile.name || 'ລູກຄ້າ ສົມສິ່ງພິມ VIP'}
                        </h3>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">
                          {customerProfile.phone} • ID: {customerProfile.id}
                        </p>
                      </div>

                      {/* VIP Discount Badge */}
                      <div className="text-right sm:text-right bg-slate-950/60 border border-amber-500/30 rounded-2xl p-3 sm:p-4 shrink-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase block">ສ່ວນຫຼຸດສະມາຊິກຂອງທ່ານ</span>
                        <div className="text-2xl font-black text-amber-400">
                          {customerProfile.discountPercent || 10}% OFF
                        </div>
                        <span className="text-[10px] text-emerald-400 block font-bold">
                          ນຳໃຊ້ທຸກລາຍການອັດຕະໂນມັດ
                        </span>
                      </div>
                    </div>

                    {/* Member Stats & Progress */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-black">ຍອດສັ່ງພິມສະສົມ</span>
                        <div className="text-sm font-black text-white font-mono">
                          ₭ {Math.round(customerProfile.totalSpentLAK || 0).toLocaleString()}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-black">ຈຳນວນອໍເດີ້ທີ່ສຳເລັດ</span>
                        <div className="text-sm font-black text-white font-mono">
                          {customerProfile.totalOrdersCount || 0} ອໍເດີ້
                        </div>
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-400 uppercase font-black">ສະຖານະສິດທິ</span>
                        <div className="text-xs font-bold text-amber-300 flex items-center gap-1 mt-0.5">
                          <Check className="w-3.5 h-3.5 text-amber-400" />
                          <span>ປົດລັອກສິດ VIP ແລ້ວ</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Perks List */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>ສິດທິພິເສດທີ່ທ່ານໄດ້ຮັບໃນປັດຈຸບັນ (Active Perks)</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(customerProfile.perks && customerProfile.perks.length > 0 ? customerProfile.perks : [
                        'ສ່ວນຫຼຸດພິເສດ 10% ທຸກງານພິມ',
                        'ສັ່ງພິມຊ້ຳ 1 ຄລິກ (1-Click Re-order)',
                        'ກວດໄຟລ໌ Proof ດ່ວນພາຍໃນ 2 ຊົ່ວໂມງ',
                        'ຄັງເກັບໄຟລ໌ Artwork ສ່ວນຕົວ (Cloud Vault)',
                        'ຜູ້ດູແລງານພິມສ່ວນຕົວ VIP Concierge',
                        'ບັນທຶກສາຂາຂົນສົ່ງ Anousith / HAL ອັດຕະໂນມັດ'
                      ]).map((perk, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                          <span>{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('reorder')}
                      className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-amber-500/20"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>ເບິ່ງງານເກົ່າ & ສັ່ງພິມຊ້ຳ 1 ຄລິກ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('address')}
                      className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-slate-700"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>ຈັດການທີ່ຢູ່ & ສາຂາຂົນສົ່ງ</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: ORDER HISTORY & 1-CLICK REORDER */}
              {activeTab === 'reorder' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-white">ປະຫວັດງານພິມ & ສັ່ງພິມຊ້ຳ (Re-order)</h4>
                      <p className="text-xs text-slate-400">
                        ກົດ "ສັ່ງພິມຊ້ຳ" ເພື່ອດຶງສະເປກວັດສະດຸ, ຂະໜາດ ແລະ ຈຳນວນເດີມເຂົ້າກະຕ່າທັນທີ
                      </p>
                    </div>
                  </div>

                  {ordersLoading ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      ກຳລັງໂຫຼດປະຫວັດງານພິມ...
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="py-12 text-center bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-3">
                      <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400">ຍັງບໍ່ທັນມີປະຫວັດການສັ່ງຊື້ໃນເບີໂທນີ້</p>
                      <button
                        type="button"
                        onClick={onClose}
                        className="py-2 px-4 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition"
                      >
                        ເລີ່ມສັ່ງພິມງານທຳອິດ
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((ord) => (
                        <div 
                          key={ord.id}
                          className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/30 transition space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-amber-400 font-mono">
                                  {ord.orderNumber || ord.id}
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300">
                                  {ord.courierName || 'Anousith Express'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
                                {new Date(ord.createdAt).toLocaleDateString('lo-LA', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-xs font-black text-white font-mono block">
                                ₭ {(ord.totalAmountLAK || 0).toLocaleString()}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-400 uppercase">
                                {ord.status}
                              </span>
                            </div>
                          </div>

                          {/* Line Items */}
                          <div className="space-y-2">
                            {(ord.items || []).map((it, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs"
                              >
                                <div className="space-y-0.5">
                                  <span className="font-bold text-white block">
                                    {it.item_name || it.job_name}
                                  </span>
                                  <span className="text-[11px] text-slate-400 block font-mono">
                                    ຈຳນວນ: {it.quantity} ຊິ້ນ • ຂະໜາດ: {it.paper_size || 'ມາດຕະຖານ'}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleReorderItem(it)}
                                  className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>ສັ່ງພິມຊ້ຳ 1 ຄລິກ</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ADDRESS BOOK & COURIER BRANCH */}
              {activeTab === 'address' && (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3.5">
                    <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>ຂໍ້ມູນທີ່ຢູ່ຈັດສົ່ງ & ສາຂາຂົນສົ່ງປະຈຳ</span>
                    </h4>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-300 block uppercase">
                        ຊື່ຜູ້ຮັບສິນຄ້າ / ຊື່ຮ້ານ
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ຊື່ ແລະ ນາມສະກຸນ ຫຼື ຊື່ແບຣນ..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-white placeholder:text-slate-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-300 block uppercase">ແຂວງ</label>
                        <input
                          type="text"
                          placeholder="ນະຄອນຫຼວງວຽງຈັນ"
                          value={province}
                          onChange={(e) => setProvince(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-white placeholder:text-slate-600"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-300 block uppercase">ເມືອງ</label>
                        <input
                          type="text"
                          placeholder="ໄຊເສດຖາ"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-white placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-300 block uppercase">ບ້ານ</label>
                      <input
                        type="text"
                        placeholder="ໂພນພະເນົາ"
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-white placeholder:text-slate-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-300 block uppercase">
                        ລາຍລະອຽດທີ່ຢູ່ເພີ່ມເຕີມ
                      </label>
                      <textarea
                        rows={2}
                        placeholder="ເລກທີເຮືອນ, ຮ່ອມ, ປ້າຍບອກທາງ ຫຼື ຈຸດສັງເກດ..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-white placeholder:text-slate-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-300 block uppercase">
                        ລະຫັດສາຂາຂົນສົ່ງທີ່ໃຊ້ປະຈຳ (Anousith / HAL)
                      </label>
                      <input
                        type="text"
                        placeholder="ຕົວຢ່າງ: AN-VTE-02 (ອານຸສິດ ໄຊເສດຖາ)"
                        value={branchCode}
                        onChange={(e) => setBranchCode(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-white placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.99] text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{loading ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກຂໍ້ມູນທີ່ຢູ່'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        logoutCustomer();
                        onClose();
                      }}
                      className="px-4 py-3 border border-rose-500/40 hover:bg-rose-950/30 text-rose-400 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2"
                      title="ອອກຈາກລະບົບ"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>ອອກຈາກລະບົບ</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
