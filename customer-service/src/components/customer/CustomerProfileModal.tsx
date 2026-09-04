import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Phone, MapPin, X, Save, LogOut, CheckCircle } from 'lucide-react';

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
}

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (phone: string) => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
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
    if (!phoneInput.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/v1/public/customer/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput.trim(), name: nameInput.trim() })
      });
      const json = await res.json();
      if (res.ok && json.status === 'success') {
        const p = json.data;
        localStorage.setItem('ssp_customer_phone', p.phone);
        localStorage.setItem('ssp_customer_id', p.id);
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
        setSuccessMsg('...ບັນທຶກຂໍ້ມູນທີ່ຢູ່ຮຽບຮ້ອຍແລ້ວ!');
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
    setProfile(null);
    setPhoneInput('');
    setNameInput('');
    if (onLoginSuccess) onLoginSuccess('');
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-500" />
            <span className="text-base font-black text-slate-900 dark:text-white">
              {profile ? 'ຂໍ້ມູນສະມາຊິກ & ທີ່ຢູ່ຈັດສົ່ງ' : 'ເຂົ້າສູ່ລະບົບສະມາຊິກ'}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
            <form onSubmit={handleLogin} className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ກະລຸນາປ້ອນເບີໂທລະສັບເພື່ອເຂົ້າສູ່ລະບົບ, ກວດສອບປະຫວັດການສັ່ງຊື້ ແລະ ບັນທຶກທີ່ຢູ່ງ່າຍໆໃນການສັ່ງຊື້ຄັ້ງຕໍ່ໄປ.
              </p>
              
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 block uppercase">
                  ເບີໂທລະສັບ (Phone Number) *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="ຕົວຢ່າງ: 020 55XXXXXX"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-hidden focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 block uppercase">
                  ຊື່ລູກຄ້າ / ຊື່ຮ້ານ (ທາງເລືອກ)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ປ້ອນຊື່ຂອງທ່ານ..."
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-hidden focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-slate-950 font-black rounded-2xl text-sm transition shadow-md shadow-amber-500/20"
              >
                {loading ? 'ກຳລັງກວດສອບ...' : 'ເຂົ້າສູ່ລະບົບ / ລົງທະບຽນ'}
              </button>
            </form>
          ) : (
            /* Profile & Address Book Form */
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">ເບີໂທລະສັບ</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{profile.phone}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ອອກຈາກລະບົບ</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 block uppercase">ຊື່ຜູ້ຮັບສິນຄ້າ / ຊື່ຮ້ານ</label>
                <input
                  type="text"
                  required
                  placeholder="ຊື່ ແລະ ນາມສະກຸນ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-hidden focus:border-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 block uppercase">ແຂວງ</label>
                  <input
                    type="text"
                    placeholder="ຕົວຢ່າງ: ນະຄອນຫຼວງວຽງຈັນ"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-hidden focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 block uppercase">ເມືອງ</label>
                  <input
                    type="text"
                    placeholder="ຕົວຢ່າງ: ໄຊເສດຖາ"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-hidden focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 block uppercase">ບ້ານ</label>
                <input
                  type="text"
                  placeholder="ຕົວຢ່າງ: ໂພນພະເນົາ"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-hidden focus:border-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 block uppercase">ລາຍລະອຽດທີ່ຢູ່ເພີ່ມເຕີມ / ສາຂາຂົນສົ່ງ</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    rows={2}
                    placeholder="ເລກທີເຮືອນ, ຮ່ອມ, ປ້າຍບອກທາງ ຫຼື ສາຂາຂົນສົ່ງທີ່ສະດວກຮັບ..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-hidden focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 block uppercase">ລະຫັດສາຂາຂົນສົ່ງທີ່ໃຊ້ປະຈຳ (ຕົວເລືອກ)</label>
                <input
                  type="text"
                  placeholder="ຕົວຢ່າງ: AN-VTE-02"
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-hidden focus:border-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-slate-950 font-black rounded-2xl text-sm transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກທີ່ຢູ່ຈັດສົ່ງ'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
