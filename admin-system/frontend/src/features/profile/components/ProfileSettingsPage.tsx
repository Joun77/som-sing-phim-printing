import React, { useState, useEffect } from 'react';
import { useApp } from '@store/AppContext';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Globe, 
  ShieldCheck, 
  Coins, 
  Store, 
  Bell, 
  Save, 
  CheckCircle2, 
  Sparkles,
  Lock,
  Mail,
  Phone,
  MapPin,
  Check,
  Truck,
  CreditCard,
  Plus,
  MessageCircle,
  Clock
} from 'lucide-react';
import { CourierManagementModal } from '../../orders/components/CourierManagementModal';
import { BankManagementModal } from '../../finance/components/BankManagementModal';
import { NotificationSettingsTab } from './NotificationSettingsTab';

export function ProfileSettingsPage() {
  const { showToast, currency, setCurrency, couriers, bankAccounts } = useApp();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  // Form states
  const [profileName, setProfileName] = useState('ຮ້ານ ສົມສິ່ງພິມ (Som Sing Owner)');
  const [email, setEmail] = useState('som.sing.phim@gmail.com');
  const [phone, setPhone] = useState('+856 20 5555 8888');
  const [whatsappNumber, setWhatsappNumber] = useState('8562055558888');
  const [branch, setBranch] = useState('ນະຄອນຫຼວງວຽງຈັນ (Vientiane Capital, Lao PDR)');
  const [facebookUrl, setFacebookUrl] = useState('https://facebook.com/somsingphim');
  const [workingHours, setWorkingHours] = useState('ຈັນ - ເສົາ: 08:00 - 18:00');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedLang, setSelectedLang] = useState(currentLang);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch shop info from backend
  useEffect(() => {
    fetch('/api/v1/admin/shop-info')
      .then(res => res.json())
      .then(resData => {
        if (resData && resData.data) {
          const d = resData.data;
          if (d.shop_name) setProfileName(d.shop_name);
          if (d.phone) setPhone(d.phone);
          if (d.whatsapp_number) setWhatsappNumber(d.whatsapp_number);
          if (d.email) setEmail(d.email);
          if (d.address) setBranch(d.address);
          if (d.facebook_url) setFacebookUrl(d.facebook_url);
          if (d.working_hours) setWorkingHours(d.working_hours);
        }
      })
      .catch(() => {});
  }, []);

  const handleLanguageChange = (lang: string) => {
    setSelectedLang(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('somsing_lang', lang);
    showToast(
      lang === 'lo' ? 'ປ່ຽນພາສາລະບົບເປັນ ພາສາລາວ ຮຽບຮ້ອຍ!' : 'System language changed to English successfully!',
      'success'
    );
  };

  const handleCurrencyChange = (curr: string) => {
    setSelectedCurrency(curr);
    if (setCurrency) setCurrency(curr);
    showToast(
      currentLang === 'lo' ? `ອັບເດດສະກຸນເງິນຫຼັກເປັນ ${curr} ຮຽບຮ້ອຍ!` : `Default currency updated to ${curr}!`,
      'success'
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/v1/admin/shop-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: profileName,
          phone: phone,
          whatsapp_number: whatsappNumber,
          email: email,
          address: branch,
          facebook_url: facebookUrl,
          working_hours: workingHours
        })
      });
      if (res.ok) {
        showToast(
          currentLang === 'lo' 
            ? 'ບັນທຶກການຕັ້ງຄ່າເບີໂທ, WhatsApp ແລະ ໂປຣໄຟລ໌ຮ້ານຮຽບຮ້ອຍ!' 
            : 'Shop phone, WhatsApp and profile settings saved successfully!',
          'success'
        );
      } else {
        throw new Error('Failed to save');
      }
    } catch {
      showToast('ບັນທຶກຂໍ້ມູນລົງຖານຂໍ້ມູນບໍ່ສຳເລັດ', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      
      {/* Header Profile Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-navy to-slate-900 text-white rounded-3xl p-8 shadow-2xl border border-slate-800 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6 z-10">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-3xl flex items-center justify-center shadow-xl border-4 border-white/10 shrink-0">
            SP
          </div>
          <div className="space-y-1.5 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">{profileName}</h1>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
              </span>
            </div>
            <p className="text-sm text-slate-300 font-medium flex items-center justify-center md:justify-start gap-2">
              <Phone className="w-4 h-4 text-sky-400" /> {phone} &nbsp;|&nbsp; <MessageCircle className="w-4 h-4 text-emerald-400" /> WhatsApp: {whatsappNumber}
            </p>
            <p className="text-xs text-slate-400 flex items-center justify-center md:justify-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> {branch}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            Online Status
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-accent-sky/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-8">
        
        {/* SECTION 1: SHOP CONTACT & WHATSAPP SETTINGS (การตั้งค่าเบอร์โทรและช่องทางติดต่อร้าน) */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {currentLang === 'lo' ? 'ຂໍ້ມູນຕິດຕໍ່ຮ້ານ & WhatsApp (Shop Contact & WhatsApp Settings)' : 'Shop Contact & WhatsApp Hotline'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {currentLang === 'lo' ? 'ຕັ້ງຄ່າເບີໂທສາຍດ່ວນ, WhatsApp ແລະ ທີ່ຢູ່ຮ້ານສຳລັບລູກຄ້າ' : 'Configure phone hotline and WhatsApp number displayed to customers.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-indigo-500" />
                {currentLang === 'lo' ? 'ຊື່ຮ້ານ / ຫົວຂໍ້ (Shop Name)' : 'Shop Name'}
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-sky"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-sky-500" />
                {currentLang === 'lo' ? 'ເບີໂທສາຍດ່ວນ / ໂທລະສັບ (Phone Hotline)' : 'Phone Hotline'}
              </label>
              <input
                type="text"
                value={phone}
                placeholder="+856 20 5555 8888"
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-sky"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                {currentLang === 'lo' ? 'ເບີ WhatsApp ຮ້ານ (WhatsApp Number - ບໍ່ຕ້ອງໃສ່ +)' : 'WhatsApp Number (without +)'}
              </label>
              <input
                type="text"
                value={whatsappNumber}
                placeholder="8562055558888"
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <p className="text-[11px] text-slate-400">
                {currentLang === 'lo' ? 'ຕົວຢ່າງ: 8562055558888 (ໃຊ້ສຳລັບເປີດແຊັດ WhatsApp ອັດຕະໂນມັດ)' : 'e.g. 8562055558888 (Used for direct WhatsApp chat)'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-amber-500" />
                {currentLang === 'lo' ? 'ອີເມວຕິດຕໍ່ (Email)' : 'Contact Email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-sky"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500" />
                {currentLang === 'lo' ? 'ທີ່ຢູ່ / ສາຂາຮ້ານ (Shop Address & Branch)' : 'Shop Address & Branch'}
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-sky"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-500" />
                {currentLang === 'lo' ? 'ເວລາເປີດ-ປິດຮ້ານ (Working Hours)' : 'Working Hours'}
              </label>
              <input
                type="text"
                value={workingHours}
                placeholder="ຈັນ - ເສົາ: 08:00 - 18:00"
                onChange={(e) => setWorkingHours(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-sky"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: SYSTEM & LANGUAGE PREFERENCES */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-sky-50 text-accent-sky rounded-2xl flex items-center justify-center border border-sky-100">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {currentLang === 'lo' ? 'ການຕັ້ງຄ່າພາສາ ແລະ ສະກຸນເງິນ (Language & Currency)' : 'Language & Currency Preferences'}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Language Switch */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-700 tracking-wide uppercase flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-sky-600" />
                {currentLang === 'lo' ? 'ພາສາຫຼັກຂອງລະບົບ (System Language)' : 'Default System Language'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('lo')}
                  className={`
                    p-3.5 rounded-2xl border-2 transition-all text-center cursor-pointer font-bold text-xs flex items-center justify-center gap-2
                    ${selectedLang === 'lo' 
                      ? 'border-accent-sky bg-sky-50/60 text-accent-sky shadow-md shadow-sky-500/10' 
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }
                  `}
                >
                  <span className="text-base">🇱🇦</span>
                  <span>ພາສາລາວ (Lao)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`
                    p-3.5 rounded-2xl border-2 transition-all text-center cursor-pointer font-bold text-xs flex items-center justify-center gap-2
                    ${selectedLang === 'en' 
                      ? 'border-accent-sky bg-sky-50/60 text-accent-sky shadow-md shadow-sky-500/10' 
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }
                  `}
                >
                  <span className="text-base">🇬🇧</span>
                  <span>English (EN)</span>
                </button>
              </div>
            </div>

            {/* Default Base Currency */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-700 tracking-wide uppercase flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-600" />
                {currentLang === 'lo' ? 'ສະກຸນເງິນຫຼັກ (Base Currency)' : 'Base Display Currency'}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { code: 'LAK', label: 'ກີບ (LAK)', symbol: '₭' },
                  { code: 'THB', label: 'ບາດ (THB)', symbol: '฿' },
                  { code: 'USD', label: 'ໂດລາ (USD)', symbol: '$' },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCurrencyChange(c.code)}
                    className={`
                      p-3.5 rounded-2xl border-2 transition-all text-center cursor-pointer font-bold text-xs flex flex-col items-center gap-1
                      ${selectedCurrency === c.code 
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 shadow-md' 
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }
                    `}
                  >
                    <span className="text-base font-black">{c.symbol}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: COURIERS & LOGISTICS MASTER DATA */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center border border-sky-100">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {currentLang === 'lo' ? 'ຈັດການບໍລິສັດຂົນສົ່ງ (Couriers & Logistics)' : 'Shipping Couriers & Logistics'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {currentLang === 'lo' ? 'ເພີ່ມ, ແກ້ໄຂ ແລະ ອັບໂຫຼດໂລໂກ້ບໍລິສັດຂົນສົ່ງສຳລັບລະບົບ' : 'Manage shipping company names, logos and default fees.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCourierModalOpen(true)}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-md shadow-sky-600/20 active:scale-95 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{currentLang === 'lo' ? '+ ເພີ່ມບໍລິສັດຂົນສົ່ງ' : '+ Add Courier'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {(couriers || []).map((c: any) => (
              <div
                key={c.id}
                onClick={() => setIsCourierModalOpen(true)}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/40 transition flex flex-col items-center text-center gap-2 cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-1 shadow-xs group-hover:scale-105 transition overflow-hidden">
                  {c.logoUrl ? (
                    <img src={c.logoUrl} alt={c.name} className="w-full h-full object-contain" />
                  ) : (
                    <Truck className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-slate-900 group-hover:text-sky-700">{c.shortName || c.name}</div>
                  <div className="text-[10.5px] text-slate-500 font-medium">{c.fee ? `${c.fee.toLocaleString()}₭` : 'ຟຣີ'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: BANK ACCOUNTS & PAYMENT METHODS */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {currentLang === 'lo' ? 'ຈັດການບັນຊີທະນາຄານ (Bank Accounts & QR)' : 'Bank Accounts & Payment QR'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {currentLang === 'lo' ? 'ບັນຊີທະນາຄານສຳລັບໃຫ້ລູກຄ້າໂອນເງິນ ແລະ ສະແກນ QR Code' : 'Manage bank accounts and QR codes for payment checkout.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsBankModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 active:scale-95 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{currentLang === 'lo' ? '+ ເພີ່ມບັນຊີທະນາຄານ' : '+ Add Bank Account'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {(bankAccounts || []).map((b: any) => (
              <div
                key={b.id}
                onClick={() => setIsBankModalOpen(true)}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/40 transition flex items-center gap-3.5 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0 overflow-hidden group-hover:scale-105 transition">
                  {b.qrCodeUrl ? (
                    <img src={b.qrCodeUrl} alt={b.bankName} className="w-full h-full object-contain" />
                  ) : (
                    <CreditCard className="w-6 h-6 text-emerald-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 truncate group-hover:text-emerald-700">{b.bankName}</div>
                  <div className="text-[11px] text-slate-600 font-mono font-bold">{b.accountNumber}</div>
                  <div className="text-[10px] text-slate-400 truncate">{b.accountName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: NOTIFICATIONS CONFIG */}
        <NotificationSettingsTab />

        {/* Action Footers */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-4 bg-accent-sky hover:bg-sky-600 text-white rounded-2xl text-base font-black shadow-xl shadow-sky-500/25 transition active:scale-95 flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{isSaving ? (currentLang === 'lo' ? 'ກຳລັງບັນທຶກ...' : 'Saving...') : (currentLang === 'lo' ? 'ບັນທຶກການຕັ້ງຄ່າ (Save Settings)' : 'Save Profile & Settings')}</span>
          </button>
        </div>

      </form>

      {/* Courier Modal */}
      <CourierManagementModal
        isOpen={isCourierModalOpen}
        onClose={() => setIsCourierModalOpen(false)}
        currentLang={currentLang}
      />

      {/* Bank Account Modal */}
      <BankManagementModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        currentLang={currentLang}
      />
    </div>
  );
}
