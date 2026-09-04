import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Phone, Mail, MapPin, Plus, Trash2, Check, Star, 
  Crown, Sparkles, Save, LogOut, Camera, ArrowLeft, 
  CheckCircle, ShoppingBag, ShieldCheck
} from 'lucide-react';
import { useShop } from '../context/ShopContext.tsx';
import type { CustomerAddress } from '../types/customer.ts';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { 
    customerProfile, 
    customerTiers, 
    refreshCustomerProfile, 
    logoutCustomer,
    isLoggedIn 
  } = useShop();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [whatsApp, setWhatsApp] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);

  // Address modal / form state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrLabel, setAddrLabel] = useState('ເຮືອນ');
  const [addrRecipient, setAddrRecipient] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrProvince, setAddrProvince] = useState('ນະຄອນຫຼວງວຽງຈັນ');
  const [addrDistrict, setAddrDistrict] = useState('');
  const [addrVillage, setAddrVillage] = useState('');
  const [addrDetail, setAddrDetail] = useState('');
  const [addrBranchCode, setAddrBranchCode] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '') || '/api';

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn && !localStorage.getItem('ssp_customer_phone')) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  // Sync profile into state
  useEffect(() => {
    if (customerProfile) {
      setName(customerProfile.name || '');
      setPhone(customerProfile.phone || '');
      setEmail(customerProfile.email || '');
      setAvatarUrl(customerProfile.avatarUrl || customerProfile.avatar_url || '');

      // Load saved addresses or initialize with current address
      if (customerProfile.addresses && customerProfile.addresses.length > 0) {
        setAddresses(customerProfile.addresses);
      } else if (customerProfile.address || customerProfile.village) {
        const initialAddr: CustomerAddress = {
          id: 'addr-default',
          label: 'ທີ່ຢູ່ຫຼັກ',
          recipientName: customerProfile.name || 'ລູກຄ້າ ສົມສິ່ງພິມ',
          phone: customerProfile.phone || '',
          province: customerProfile.province || 'ນະຄອນຫຼວງວຽງຈັນ',
          district: customerProfile.district || 'ໄຊເສດຖາ',
          village: customerProfile.village || 'ໂພນພະເນົາ',
          addressDetail: customerProfile.address || '',
          branchCode: customerProfile.branchCode || customerProfile.branch_code || 'AN-VTE-02',
          isDefault: true,
        };
        setAddresses([initialAddr]);
      }
    }
  }, [customerProfile]);

  // Handle Avatar Image Upload via File Input
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('ຂະໜາດຮູບພາບຕ້ອງບໍ່ເກີນ 2MB');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setAvatarUrl(base64);
        setSuccessMsg('ອັບໂຫຼດຮູບພາບສຳເລັດແລ້ວ! ກະລຸນາກົດບັນທຶກຂໍ້ມູນ');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save full profile
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customerProfile) return;

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];

      const res = await fetch(`${apiBase}/v1/public/customer/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: customerProfile.id,
          name,
          phone,
          email,
          whatsApp,
          avatarUrl,
          addresses,
          province: defaultAddr?.province || customerProfile.province,
          district: defaultAddr?.district || customerProfile.district,
          village: defaultAddr?.village || customerProfile.village,
          address: defaultAddr?.addressDetail || customerProfile.address,
          branchCode: defaultAddr?.branchCode || customerProfile.branchCode,
        }),
      });

      const json = await res.json();
      if (res.ok && json.status === 'success') {
        await refreshCustomerProfile(phone);
        setSuccessMsg('ບັນທຶກຂໍ້ມູນໂປຣໄຟລ໌ຮຽບຮ້ອຍແລ້ວ!');
        setTimeout(() => setSuccessMsg(''), 3500);
      } else {
        setErrorMsg(json.error || 'ບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ');
      }
    } catch {
      setErrorMsg('ເຊື່ອມຕໍ່ລະບົບບໍ່ສຳເລັດ');
    } finally {
      setSaving(false);
    }
  };

  // Address Handlers
  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrRecipient || !addrPhone) {
      setErrorMsg('ກະລຸນາປ້ອນຊື່ຜູ້ຮັບ ແລະ ເບີໂທລະສັບ');
      return;
    }

    let updated = [...addresses];

    if (editingAddressId) {
      updated = updated.map((a) => {
        if (a.id === editingAddressId) {
          return {
            ...a,
            label: addrLabel,
            recipientName: addrRecipient,
            phone: addrPhone,
            province: addrProvince,
            district: addrDistrict,
            village: addrVillage,
            addressDetail: addrDetail,
            branchCode: addrBranchCode,
            isDefault: addrIsDefault ? true : a.isDefault,
          };
        }
        return addrIsDefault ? { ...a, isDefault: false } : a;
      });
    } else {
      const newAddr: CustomerAddress = {
        id: 'addr-' + Date.now(),
        label: addrLabel,
        recipientName: addrRecipient,
        phone: addrPhone,
        province: addrProvince,
        district: addrDistrict,
        village: addrVillage,
        addressDetail: addrDetail,
        branchCode: addrBranchCode,
        isDefault: addrIsDefault || addresses.length === 0,
      };

      if (newAddr.isDefault) {
        updated = updated.map((a) => ({ ...a, isDefault: false }));
      }
      updated.push(newAddr);
    }

    setAddresses(updated);
    setIsAddingAddress(false);
    setEditingAddressId(null);
    resetAddressForm();
    setSuccessMsg('ອັບເດດທີ່ຢູ່ຈັດສົ່ງຮຽບຮ້ອຍແລ້ວ! ກົດບັນທຶກເພື່ອຢືນຢັນ');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSetDefaultAddress = (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setAddresses(updated);
    setSuccessMsg('ກຳນົດເປັນທີ່ຢູ່ຫຼັກຮຽບຮ້ອຍແລ້ວ! ກົດບັນທຶກເພື່ອຢືນຢັນ');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeleteAddress = (id: string) => {
    if (addresses.length <= 1) {
      setErrorMsg('ຕ້ອງມີທີ່ຢູ່ຈັດສົ່ງຢ່າງໜ້ອຍ 1 ລາຍການ');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    const updated = addresses.filter((a) => a.id !== id);
    if (!updated.some((a) => a.isDefault)) {
      updated[0].isDefault = true;
    }
    setAddresses(updated);
    setSuccessMsg('ລຶບທີ່ຢູ່ຈັດສົ່ງແລ້ວ');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const startEditAddress = (addr: CustomerAddress) => {
    setEditingAddressId(addr.id);
    setAddrLabel(addr.label);
    setAddrRecipient(addr.recipientName);
    setAddrPhone(addr.phone);
    setAddrProvince(addr.province);
    setAddrDistrict(addr.district);
    setAddrVillage(addr.village);
    setAddrDetail(addr.addressDetail);
    setAddrBranchCode(addr.branchCode || '');
    setAddrIsDefault(addr.isDefault);
    setIsAddingAddress(true);
  };

  const resetAddressForm = () => {
    setAddrLabel('ເຮືອນ');
    setAddrRecipient(name || '');
    setAddrPhone(phone || '');
    setAddrProvince('ນະຄອນຫຼວງວຽງຈັນ');
    setAddrDistrict('');
    setAddrVillage('');
    setAddrDetail('');
    setAddrBranchCode('');
    setAddrIsDefault(false);
  };

  const tier = (customerProfile?.tier || 'STANDARD').toUpperCase();
  const matchedTier = customerTiers.find((t) => t.id.toUpperCase() === tier);
  const discount = customerProfile?.discountPercent || customerProfile?.discount_percent || matchedTier?.discount_percent || (tier === 'GOLD' ? 10 : tier === 'SILVER' ? 5 : tier === 'PLATINUM' ? 15 : 0);
  const spentLAK = Math.round(customerProfile?.totalSpentLAK || customerProfile?.total_spent_lak || 0);
  const ordersCount = customerProfile?.totalOrdersCount || customerProfile?.total_orders_count || 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-8">
      <div className="w-[88%] max-w-[1380px] mx-auto space-y-6">
        
        {/* Top Breadcrumb & Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <Link 
              to="/" 
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 text-slate-700 hover:text-slate-900 transition flex items-center justify-center cursor-pointer shadow-xs"
              title="ກັບຄືນໜ້າຫຼັກ"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  ໂປຣໄຟລ໌ & ຕັ້ງຄ່າບັນຊີ (Customer Profile)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                  {tier} VIP
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ຈັດການຂໍ້ມູນສ່ວນຕົວ, ຮູບໂປຣໄຟລ໌, ສາຂາຂົນສົ່ງ ແລະ ສິດທິປະໂຫຍດສະມາຊິກ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/orders"
              className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-amber-400 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              <span>ປະຫວັດການສັ່ງຊື້</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                logoutCustomer();
                navigate('/');
              }}
              className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ອອກຈາກລະບົບ</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Alerts */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-fade-in shadow-xs">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-fade-in">
            <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Top Metric Cards - Light Ivory Atelier Design */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase block">ຍອດສັ່ງພິມສະສົມ</span>
              <div className="text-xl font-black text-amber-700 font-mono mt-1">
                ₭ {spentLAK.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">Total Spend LAK</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase block">ອໍເດີ້ສຳເລັດ</span>
              <div className="text-xl font-black text-slate-900 font-mono mt-1">
                {ordersCount} ອໍເດີ້
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">Completed Orders</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase block">ສ່ວນຫຼຸດສະມາຊິກ</span>
              <div className="text-xl font-black text-amber-700 font-mono mt-1">
                {discount}% OFF
              </div>
              <span className="text-[10px] text-emerald-700 block mt-0.5 font-bold">ນຳໃຊ້ອັດຕະໂນມັດທຸກງານ</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Main 2-Column Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: AVATAR UPLOAD, PERSONAL INFO, LOYALTY CARD  */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Personal Details Card with Avatar Upload */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5">
              
              {/* Avatar Section with Upload Button */}
              <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-slate-100">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 border-2 border-amber-400 overflow-hidden flex items-center justify-center shadow-md text-2xl font-black text-amber-300">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{(name || 'S').substring(0, 1).toUpperCase()}</span>
                    )}
                  </div>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                  />

                  {/* Camera Icon Overlay */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-700 hover:bg-blue-600 text-white border-2 border-white shadow-md transition cursor-pointer"
                    title="ອັບໂຫຼດຮູບໂປຣໄຟລ໌"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {name || 'ລູກຄ້າ ສົມສິ່ງພິມ VIP'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {phone || '020 XXXXXXXX'}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-800 mt-1 inline-flex items-center gap-1 cursor-pointer transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>ປ່ຽນຮູບພາບໂປຣໄຟລ໌</span>
                  </button>
                </div>
              </div>

              {/* Editable Fields Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-700 block uppercase">
                    ຊື່ລູກຄ້າ / ຊື່ແບຣນ *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="ຊື່ ແລະ ນາມສະກຸນ ຫຼື ຊື່ຮ້ານ..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-100 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-700 block uppercase">
                    ເບີໂທລະສັບຕິດຕໍ່ *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="020 XXXXXXXX"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-100 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-700 block uppercase">
                    ອີເມວ (Email)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="customer@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-100 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn--gold w-full py-3 rounded-xl text-xs shadow-glow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກການປ່ຽນແປງ'}</span>
                </button>
              </form>
            </div>

            {/* VIP Loyalty Membership Card - Luxury Metallic Foil */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-amber-400/50 shadow-md space-y-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block">
                    SOM SING PHIM ATELIER
                  </span>
                  <h4 className="text-base font-black text-white mt-0.5">
                    {tier} VIP MEMBER PASS
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-gradient-to-r from-amber-300 to-yellow-400 text-slate-950">
                  {discount}% DISCOUNT
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-black text-slate-300 uppercase block">
                  ສິດທິພິເສດສະມາຊິກ (Active Perks):
                </span>
                <div className="space-y-1.5">
                  {(customerProfile?.perks || [
                    'ສ່ວນຫຼຸດພິເສດ 10% ທຸກງານພິມ',
                    'ສັ່ງພິມຊ້ຳ 1 ຄລິກ (1-Click Re-order)',
                    'ກວດໄຟລ໌ Proof ດ່ວນພາຍໃນ 2 ຊົ່ວໂມງ',
                    'ຄັງເກັບໄຟລ໌ Artwork ສ່ວນຕົວ (Cloud Vault)',
                    'ຜູ້ດູແລງານພິມສ່ວນຕົວ VIP Concierge',
                    'ບັນທຶກສາຂາຂົນສົ່ງ Anousith / HAL ອັດຕະໂນມັດ',
                  ]).map((perk, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-200">
                      <div className="w-4 h-4 rounded-full bg-blue-500/30 text-blue-300 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: MULTI-ADDRESS BOOK (PRIMARY / ADD / EDIT)  */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 space-y-6" id="addresses">
            
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5">
              
              <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      ສະໝຸດທີ່ຢູ່ຈັດສົ່ງ (Delivery Addresses)
                    </h3>
                    <p className="text-xs text-slate-500">
                      ບັນທຶກໄດ້ຫຼາຍທີ່ຢູ່ ແລະ ເລືອກທີ່ຢູ່ຫຼັກສຳລັບການສັ່ງຊື້
                    </p>
                  </div>
                </div>

                {!isAddingAddress && (
                  <button
                    type="button"
                    onClick={() => {
                      resetAddressForm();
                      setEditingAddressId(null);
                      setIsAddingAddress(true);
                    }}
                    className="btn btn--gold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-glow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ເພີ່ມທີ່ຢູ່ໃໝ່</span>
                  </button>
                )}
              </div>

              {/* Add / Edit Address Inline Form */}
              {isAddingAddress && (
                <form onSubmit={handleSaveAddress} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 uppercase">
                      {editingAddressId ? 'ແກ້ໄຂທີ່ຢູ່ຈັດສົ່ງ' : 'ເພີ່ມທີ່ຢູ່ຈັດສົ່ງໃໝ່'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingAddress(false);
                        setEditingAddressId(null);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      ຍົກເລີກ
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">ປ້າຍກຳກັບ (ເຊັ່ນ: ເຮືອນ, ຮ້ານ, ສາງ)</label>
                      <input
                        type="text"
                        required
                        value={addrLabel}
                        onChange={(e) => setAddrLabel(e.target.value)}
                        placeholder="ເຮືອນ / ຮ້ານຄ້າ"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">ຊື່ຜູ້ຮັບສິນຄ້າ *</label>
                      <input
                        type="text"
                        required
                        value={addrRecipient}
                        onChange={(e) => setAddrRecipient(e.target.value)}
                        placeholder="ຊື່ ແລະ ນາມສະກຸນ"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">ເບີໂທລະສັບຜູ້ຮັບ *</label>
                      <input
                        type="tel"
                        required
                        value={addrPhone}
                        onChange={(e) => setAddrPhone(e.target.value)}
                        placeholder="020 XXXXXXXX"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">ແຂວງ *</label>
                      <input
                        type="text"
                        required
                        value={addrProvince}
                        onChange={(e) => setAddrProvince(e.target.value)}
                        placeholder="ນະຄອນຫຼວງວຽງຈັນ"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">ເມືອງ</label>
                      <input
                        type="text"
                        value={addrDistrict}
                        onChange={(e) => setAddrDistrict(e.target.value)}
                        placeholder="ໄຊເສດຖາ"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">ບ້ານ</label>
                      <input
                        type="text"
                        value={addrVillage}
                        onChange={(e) => setAddrVillage(e.target.value)}
                        placeholder="ໂພນພະເນົາ"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">ລາຍລະອຽດທີ່ຢູ່ເພີ່ມເຕີມ</label>
                    <textarea
                      rows={2}
                      value={addrDetail}
                      onChange={(e) => setAddrDetail(e.target.value)}
                      placeholder="ຮ່ອມ, ເລກທີເຮືອນ, ຈຸດສັງເກດ..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">ລະຫັດສາຂາຂົນສົ່ງ (Anousith / HAL)</label>
                      <input
                        type="text"
                        value={addrBranchCode}
                        onChange={(e) => setAddrBranchCode(e.target.value)}
                        placeholder="ຕົວຢ່າງ: AN-VTE-02"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-4 sm:pt-6">
                      <input
                        type="checkbox"
                        id="defaultCheck"
                        checked={addrIsDefault}
                        onChange={(e) => setAddrIsDefault(e.target.checked)}
                        className="w-4 h-4 rounded-md accent-blue-600 cursor-pointer"
                      />
                      <label htmlFor="defaultCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                        ຕັ້ງເປັນທີ່ຢູ່ຫຼັກ (Primary Address)
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingAddress(false);
                        setEditingAddressId(null);
                      }}
                      className="py-2 px-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold"
                    >
                      ຍົກເລີກ
                    </button>
                    <button
                      type="submit"
                      className="btn btn--gold py-2 px-4 rounded-xl text-xs shadow-glow"
                    >
                      ບັນທຶກທີ່ຢູ່ນີ້
                    </button>
                  </div>
                </form>
              )}

              {/* Saved Addresses List */}
              <div className="space-y-3">
                {addresses.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                    ຍັງບໍ່ມີທີ່ຢູ່ຈັດສົ່ງທີ່ບັນທຶກໄວ້
                  </div>
                ) : (
                  addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-4 rounded-2xl transition border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        addr.isDefault
                          ? 'bg-amber-50/40 border-amber-300 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-900">
                            {addr.label || 'ທີ່ຢູ່ຈັດສົ່ງ'}
                          </span>
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-400 text-slate-950 flex items-center gap-1 shadow-xs">
                              <Star className="w-3 h-3 text-slate-950 fill-slate-950" />
                              <span>ທີ່ຢູ່ຫຼັກ</span>
                            </span>
                          )}
                          {addr.branchCode && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {addr.branchCode}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-800 font-bold">
                          {addr.recipientName} • <span className="font-mono text-slate-600">{addr.phone}</span>
                        </div>

                        <div className="text-xs text-slate-600 leading-relaxed">
                          {[addr.addressDetail, addr.village, addr.district, addr.province].filter(Boolean).join(', ')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                        {!addr.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="py-1.5 px-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="ຕັ້ງເປັນທີ່ຢູ່ຫຼັກ"
                          >
                            <Star className="w-3 h-3 text-amber-500" />
                            <span>ຕັ້ງເປັນຫຼັກ</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => startEditAddress(addr)}
                          className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                          title="ແກ້ໄຂທີ່ຢູ່"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-2 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="ລຶບທີ່ຢູ່"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Master Save Button */}
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveProfile()}
                  disabled={saving}
                  className="btn btn--gold py-2.5 px-5 rounded-xl text-xs shadow-glow flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກການຕັ້ງຄ່າທີ່ຢູ່ທັງໝົດ'}</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
