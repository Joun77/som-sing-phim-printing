import React, { useState } from 'react';
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
  Check
} from 'lucide-react';

export function ProfileSettingsPage() {
  const { showToast, currency, setCurrency } = useApp();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  // Form states
  const [profileName, setProfileName] = useState('ຮ້ານ ສົມສິ່ງພິມ (Som Sing Owner)');
  const [email, setEmail] = useState('som.sing.phim@gmail.com');
  const [phone, setPhone] = useState('+856 20 5555 8888');
  const [branch, setBranch] = useState('สำนักงานใหญ่ นครหลวงเวียงจันทน์ (Vientiane Head Office)');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedLang, setSelectedLang] = useState(currentLang);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);

  const handleLanguageChange = (lang: string) => {
    setSelectedLang(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('somsing_lang', lang);
    showToast(
      lang === 'lo' ? 'ປ່ຽນພາສາລະບົບເປັນ ພາສາລາວ เรียบร้อย!' : 'System language changed to English successfully!',
      'success'
    );
  };

  const handleCurrencyChange = (curr: string) => {
    setSelectedCurrency(curr);
    if (setCurrency) setCurrency(curr);
    showToast(
      currentLang === 'lo' ? `ອັບເດດສະກຸນເງິນຫຼັກເປັນ ${curr} ເລstarted!` : `Default currency updated to ${curr}!`,
      'success'
    );
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(
      currentLang === 'lo' 
        ? 'ບັນທຶກການຕັ້ງຄ່າໂປຣໄຟລ໌ ແລະ ລະບົບສຳເລັດແລ້ວ!' 
        : 'Profile and System settings saved successfully!',
      'success'
    );
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
              <Mail className="w-4 h-4 text-emerald-400" /> {email}
            </p>
            <p className="text-xs text-slate-400 flex items-center justify-center md:justify-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-sky-400" /> {branch}
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
        
        {/* SECTION 1: SYSTEM & LANGUAGE SETTINGS (การตั้งค่าภาษาและระบบ) */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-sky-50 text-accent-sky rounded-2xl flex items-center justify-center border border-sky-100">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {currentLang === 'lo' ? 'ການຕັ້ງຄ່າພາສາ ແລະ ລະບົບ (Language & System Settings)' : 'Language & System Preferences'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {currentLang === 'lo' ? 'ເລືອກພາສາ ແລະ ສະກຸນເງິນຫຼັກທີ່ຕ້ອງການໃຊ້ງານໃນລະບົບ ERP' : 'Configure display language, currency, and system behaviors.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Language Selector */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-700 tracking-wide uppercase flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-accent-sky" />
                {currentLang === 'lo' ? 'ພາສາປະຈຳລະບົບ (System Language)' : 'System Language'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                
                {/* Lao option */}
                <button
                  type="button"
                  onClick={() => handleLanguageChange('lo')}
                  className={`
                    p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-left cursor-pointer
                    ${selectedLang === 'lo' 
                      ? 'border-accent-sky bg-sky-50/50 shadow-md shadow-sky-500/10' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇱🇦</span>
                    <div>
                      <div className="text-sm font-black text-slate-900">ພາສາລາວ</div>
                      <div className="text-[11px] text-slate-500 font-medium">Lao Language</div>
                    </div>
                  </div>
                  {selectedLang === 'lo' && <Check className="w-5 h-5 text-accent-sky shrink-0" />}
                </button>

                {/* English option */}
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`
                    p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-left cursor-pointer
                    ${selectedLang === 'en' 
                      ? 'border-accent-sky bg-sky-50/50 shadow-md shadow-sky-500/10' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇬🇧</span>
                    <div>
                      <div className="text-sm font-black text-slate-900">English</div>
                      <div className="text-[11px] text-slate-500 font-medium">International</div>
                    </div>
                  </div>
                  {selectedLang === 'en' && <Check className="w-5 h-5 text-accent-sky shrink-0" />}
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

          {/* Notifications Setting */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-indigo-500" />
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {currentLang === 'lo' ? 'ການແຈ້ງເຕືອນສະຖານະການຜະລິດ (Lao Production Notifications)' : 'Production Status Notification Toasts'}
                </div>
                <div className="text-xs text-slate-500">
                  {currentLang === 'lo' ? 'ສະແດງຂໍ້ຄວາມແຈ້ງເຕືອນພາສາລາວເມື່ອມີການອັບເດດສະຖານະອໍເດີ' : 'Show rich Lao toast alerts when changing production status.'}
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={notificationsEnabled} 
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {/* SECTION 2: PROFILE DETAILS (ข้อมูลส่วนตัวโปรไฟล์เจ้าของร้าน) */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {currentLang === 'lo' ? 'ຂໍ້ມູນສ່ວນຕົວ ແລະ ຮ້ານ (Owner & Profile Info)' : 'Personal & Shop Details'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {currentLang === 'lo' ? 'ຈັດການຂໍ້ມູນຜູ້ບໍລິຫານ ແລະ ຂໍ້ມູນຕິດຕໍ່' : 'Update admin account names, contact emails, and branch details.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">ชื่อผู้ใช้งาน / ร้าน (Owner Name)</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-sky"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">อีเมลติดต่อ (Contact Email)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-sky"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">เบอร์โทรศัพท์ (Phone Number)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-sky"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">สาขาหลัก (Branch Office)</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-sky"
              />
            </div>
          </div>
        </div>

        {/* Action Footers */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="submit"
            className="px-8 py-4 bg-accent-sky hover:bg-sky-600 text-white rounded-2xl text-base font-black shadow-xl shadow-sky-500/25 transition active:scale-95 flex items-center gap-2.5 cursor-pointer"
          >
            <Save className="w-5 h-5" />
            <span>{currentLang === 'lo' ? 'ບັນທຶກການຕັ້ງຄ່າ (Save Settings)' : 'Save Profile & Settings'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
