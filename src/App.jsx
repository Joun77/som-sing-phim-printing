import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import InboundManagement from './components/inbound/InboundManagement';
import InventoryManagement from './components/inventory/InventoryManagement';
import EquipmentOverhead from './components/equipment/EquipmentManagement';
import CustomerManagement from './components/customers/CustomerManagement';
import CustomerOrders from './components/orders/CustomerOrders';
import QuotationManager from './components/QuotationManager';
import HistoryAnalytics from './components/HistoryAnalytics';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle2, 
  AlertCircle, 
  X, 
  HelpCircle 
} from 'lucide-react';

function AppContent() {
  const { activeTab, toast, setToast, confirmDialog } = useApp();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-bg font-sans antialiased text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Contents view */}
      <main className="flex-1 h-screen overflow-y-auto px-6 py-8 md:px-8">
        <div className="w-full">
          {activeTab === 'dashboard' && <DashboardOverview />}
          {activeTab === 'inbound' && <InboundManagement />}
          {activeTab === 'inventory' && <InventoryManagement />}
          {activeTab === 'equipment' && <EquipmentOverhead />}
          {activeTab === 'crm' && <CustomerManagement />}
          {activeTab === 'orders' && <CustomerOrders />}
          {activeTab === 'calculator' && <QuotationManager />}
          {activeTab === 'reports' && <HistoryAnalytics />}
        </div>
      </main>

      {/* ACCESSIBLE ELDERLY-FRIENDLY TOAST NOTIFICATIONS */}
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
              {toast.type === 'success' 
                ? (t('common.yes') === 'Yes' ? 'Success' : 'ດຳເນີນການສຳເລັດ') 
                : (t('common.yes') === 'Yes' ? 'Warning / Alert' : 'ແຈ້ງເຕືອນ / ຂໍ້ຜິດພາດ')
              }
            </h4>
            <p className="text-base text-slate-600 font-medium leading-relaxed">
              {toast.message}
            </p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition shrink-0"
            aria-label="Close Notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ACCESSIBLE CONFIRMATION DIALOG MODAL */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/50 backdrop-blur-md animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-8 border border-slate-100 text-center space-y-6">
            <div className="w-16 h-16 bg-blue-50 text-accent-sky rounded-full flex items-center justify-center mx-auto border-2 border-blue-100">
              <HelpCircle className="w-9 h-9" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-wide">
                {t('common.yes') === 'Yes' ? 'Are you sure?' : 'ທ່ານແນ່ໃຈ ຫຼື ບໍ່?'}
              </h3>
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
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="flex-1 min-h-[54px] py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-base font-extrabold shadow-lg shadow-red-600/20 transition active:scale-95"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
