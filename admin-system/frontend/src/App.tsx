import React from 'react';
import { AppProvider, useApp } from '@store/AppContext';
import Navbar from '@components/Navbar';
import { DashboardOverview } from '@features/dashboard';
import { InventoryManagement } from '@features/inventory';
import { EquipmentManagement as EquipmentOverhead } from '@features/equipment';
import { InboundManagement } from '@features/inbound';
import { CustomerManagement } from '@features/customers';
import { CustomerOrders } from '@features/orders';
import { QuotationManager } from '@features/pricing';
import { HistoryAnalytics } from '@features/analytics';
import { EmployeeManagement } from '@features/hr';
import { FinanceDashboard } from '@features/finance';
import { ProfileSettingsPage } from '@features/profile';
import { PreflightPage } from './features/production/PreflightPage';
import { ShopFloorTracker } from './features/production/ShopFloorTracker';
import { ProtectedRoute } from '@components/ProtectedRoute';
import CurrencyRatesModal from '@components/common/CurrencyRatesModal';
import { useTranslation } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  CheckCircle2, 
  AlertCircle, 
  X, 
  HelpCircle,
  Coins
} from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const { 
    activeTab, 
    setActiveTab, 
    toast, 
    setToast, 
    confirmDialog, 
    setIsRatesOpen, 
    currency, 
    exchangeRates, 
    rateMode,
    setPrefilledOrderSpecs,
    showToast
  } = useApp();
  const { t } = useTranslation();
  const currentRate = currency === 'LAK' ? 1 : ((exchangeRates[currency] && exchangeRates[currency][rateMode]) || 0);

  const isTrackerRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/track');
  const trackerOrderNo = isTrackerRoute ? window.location.pathname.replace(/^\/track\/?/, '') : null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-bg font-sans antialiased text-slate-800 flex flex-col">
        {/* Top Navbar Navigation */}
        <Navbar />

        {/* Main Contents View (Full Width 100% Edge-to-Edge) */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="w-full">
            {isTrackerRoute ? (
              <ShopFloorTracker initialOrderNo={trackerOrderNo || undefined} />
            ) : (
              <>
                {activeTab === 'dashboard' && <DashboardOverview />}
                {activeTab === 'preflight' && (
                  <PreflightPage
                    onSendToQuotation={(res) => {
                      if (setPrefilledOrderSpecs) {
                        setPrefilledOrderSpecs({
                          jobName: res.file_name.replace(/\.[^/.]+$/, ''),
                          pageCount: res.total_pages,
                          avgCovC: res.avg_cov_c,
                          avgCovM: res.avg_cov_m,
                          avgCovY: res.avg_cov_y,
                          avgCovK: res.avg_cov_k,
                          colorMode: res.color_mode || 'CMYK',
                          fileUrl: res.file_url,
                          fileName: res.file_name,
                        });
                      }
                      setActiveTab('quotation');
                      showToast('ສົ່ງຄ່າສີ ແລະ ຈຳນວນໜ້າໄປຍັງໃບສະເໜີລາຄາຮຽບຮ້ອຍ!', 'success');
                    }}
                  />
                )}
                {(activeTab === 'orders' || activeTab === 'create_order' || activeTab === 'production' || activeTab === 'deliveries' || activeTab === 'quotation') && (
                  <CustomerOrders initialSubTab={activeTab} />
                )}
                {activeTab === 'tracker' && <ShopFloorTracker />}
                {activeTab === 'inbound' && <InboundManagement />}
                {activeTab === 'inventory' && <InventoryManagement />}
                {activeTab === 'equipment' && <EquipmentOverhead />}
                {activeTab === 'crm' && <CustomerManagement />}
                {activeTab === 'hr' && <EmployeeManagement />}
                {activeTab === 'finance' && <FinanceDashboard />}
                {(activeTab === 'settings' || activeTab === 'profile') && <ProfileSettingsPage />}
              </>
            )}
          </div>
        </main>

        {/* FLOATING EXCHANGE RATE ACTION PILL BUTTON */}
        <button
          onClick={() => setIsRatesOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-4.5 py-3.5 bg-gradient-to-r from-slate-900 via-primary-navy to-slate-900 text-emerald-400 hover:text-white font-black text-xs rounded-full shadow-2xl border-2 border-emerald-500/40 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-all group"
          title="ຕັ້ງຄ່າອັດຕາແລກປ່ຽນ"
        >
          <Coins className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
          <span>ອັດຕາແລກປ່ຽນ: {currency} 1={currentRate ? `${currentRate.toLocaleString()}₭` : '—'}</span>
        </button>

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

        {/* MULTI-CURRENCY RATE MANAGEMENT MODAL */}
        <CurrencyRatesModal />
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </QueryClientProvider>
  );
}
