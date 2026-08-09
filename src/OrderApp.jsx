import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import CustomerOrders from './components/orders/CustomerOrders';
import CurrencyRatesModal from './components/common/CurrencyRatesModal';
import './i18n.js';
import { useTranslation } from 'react-i18next';
import { 
  ShoppingCart, 
  Plus, 
  Printer, 
  Truck, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  HelpCircle,
  Calculator
} from 'lucide-react';

function OrderAppContent() {
  const { toast, setToast, confirmDialog } = useApp();
  const { t, i18n } = useTranslation();
  const [subTab, setSubTab] = useState('quotation');

  const currentLang = i18n.language || 'lo';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'lo' ? 'en' : 'lo';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('somsing_lang', nextLang);
  };

  const navItems = [
    { id: 'quotation', label: 'ອອກໃບສະເໜີລາຄາ (Create Quotation)', icon: Calculator },
    { id: 'orders', label: 'ລາຍການອໍເດີ (Order Directory)', icon: ShoppingCart },
    { id: 'create_order', label: 'ສ້າງອໍເດີໃໝ່ (Create Order)', icon: Plus },
    { id: 'production', label: 'ຕິດຕາມການຜະລິດ (Production Tracker)', icon: Printer },
    { id: 'deliveries', label: 'ຕິດຕາມການຈັດສົ່ງ (Delivery Tracker)', icon: Truck },
    { id: 'completed', label: 'ຈັດສົ່ງສໍາເລັດ (Completed Orders)', icon: CheckCircle2 },
    { id: 'cancelled', label: 'ລາຍການຍົກເລີກ (Cancelled Orders)', icon: X },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-bg font-sans antialiased text-slate-800">
      {/* STANDALONE ORDER SYSTEM SIDEBAR */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white flex flex-col justify-between shrink-0 shadow-2xl p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-black text-base tracking-tight font-sans">ລະບົບຈັດການອໍເດີ</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order Management App</p>
              </div>
            </div>
            <button 
              onClick={toggleLanguage}
              className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 rounded-lg font-black transition border border-slate-700"
            >
              {currentLang.toUpperCase()}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = subTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSubTab(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-extrabold transition-all text-left justify-start ${
                    isActive 
                      ? 'bg-accent-sky text-white shadow-md shadow-accent-sky/20 scale-[1.01]' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="leading-snug">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Return to Main ERP Web App */}
        <div className="pt-6 border-t border-slate-800 space-y-3">
          <a
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-black transition border border-slate-700 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ກັບຄືນລະບົບຫຼັກ (Main ERP App)</span>
          </a>
          <p className="text-[10px] text-slate-500 text-center font-bold">
            Som Sing Printing System v1.0.0
          </p>
        </div>
      </aside>

      {/* MAIN VIEW CANVAS */}
      <main className="flex-1 h-screen overflow-y-auto p-6 md:p-8">
        <CustomerOrders initialSubTab={subTab} />
      </main>

      {/* TOAST NOTIFICATIONS */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] max-w-sm w-full bg-white rounded-2xl shadow-2xl border-2 border-slate-100 p-5 flex items-start gap-4 animate-fade-in pointer-events-auto">
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-600" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-lg font-bold text-slate-900 leading-snug">
              {toast.type === 'success' ? 'Success' : 'Warning'}
            </h4>
            <p className="text-base text-slate-600 font-medium leading-relaxed">
              {toast.message}
            </p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/50 backdrop-blur-md animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-8 border border-slate-100 text-center space-y-6">
            <div className="w-16 h-16 bg-blue-50 text-accent-sky rounded-full flex items-center justify-center mx-auto border-2 border-blue-100">
              <HelpCircle className="w-9 h-9" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-wide">Are you sure?</h3>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={confirmDialog.onCancel}
                className="flex-1 min-h-[54px] py-3.5 border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-base font-extrabold transition active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="flex-1 min-h-[54px] py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-base font-extrabold shadow-lg shadow-red-600/20 transition active:scale-95"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MULTI-CURRENCY RATE MANAGEMENT MODAL */}
      <CurrencyRatesModal />
    </div>
  );
}

export default function OrderApp() {
  return (
    <AppProvider>
      <OrderAppContent />
    </AppProvider>
  );
}
