import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AppProvider, useApp } from '@store/AppContext';
import Sidebar from '@components/Sidebar';
import TopHeader from '@components/TopHeader';
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
import { WebCatalogPage } from './features/catalog';
import { SupplierManagement } from './features/suppliers';
import { ProtectedRoute } from '@components/ProtectedRoute';
import CurrencyRatesModal from '@components/common/CurrencyRatesModal';
import { useTranslation } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  CheckCircle2, 
  AlertCircle, 
  X, 
  HelpCircle
} from 'lucide-react';

function AppContent() {
  const { 
    activeTab, 
    setActiveTab, 
    toast, 
    setToast, 
    confirmDialog, 
    setPrefilledOrderSpecs,
    showToast
  } = useApp();
  const { t } = useTranslation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isTrackerRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/track');
  const trackerOrderNo = isTrackerRoute ? window.location.pathname.replace(/^\/track\/?/, '') : null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 flex">
        {/* Left Side: Modern Dark Navy Collapsible Sidebar */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        {/* Right Side: Main Application View Container */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header with Breadcrumbs, Exchange Rate & Quick Profile */}
          <TopHeader
            onToggleMobileSidebar={() => setSidebarOpen(!sidebarOpen)}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
          />

          {/* Main Content Area (Full Width Edge-to-Edge 100%) */}
          <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="w-full">
              {isTrackerRoute ? (
                <ShopFloorTracker initialOrderNo={trackerOrderNo || undefined} />
              ) : (
                <>
                  {activeTab === 'dashboard' && <DashboardOverview />}
                  {activeTab === 'catalog' && <WebCatalogPage />}
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
                  {activeTab === 'quotation' && (
                    <QuotationManager />
                  )}
                  {(activeTab === 'orders' || activeTab === 'create_order' || activeTab === 'production' || activeTab === 'deliveries') && (
                    <CustomerOrders initialSubTab={activeTab === 'orders' ? 'orders' : activeTab} />
                  )}
                  {activeTab === 'tracker' && <ShopFloorTracker />}
                  {activeTab === 'suppliers' && <SupplierManagement />}
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
        </div>

        {/* TOAST NOTIFICATIONS (TOP-LEVEL) */}
        {toast && createPortal(
          <div className="fixed bottom-6 right-6 z-[999999] flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-slide-up">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-bold tracking-wide">{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="p-1 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>,
          document.body
        )}

        {/* ACCESSIBLE CONFIRMATION DIALOG MODAL (TOP-MOST LAYER) */}
        {confirmDialog && createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in">
            <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-7 sm:p-8 border border-slate-100 text-center space-y-6 animate-scale-up">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border-2 border-rose-100 shadow-sm">
                <HelpCircle className="w-9 h-9" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wide">
                  {t('common.yes') === 'Yes' ? 'Are you sure?' : 'ທ່ານແນ່ໃຈ ຫຼື ບໍ່?'}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={confirmDialog.onCancel}
                  className="flex-1 min-h-[48px] py-3 border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-sm font-black transition cursor-pointer active:scale-95"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 min-h-[48px] py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-rose-600/25 transition cursor-pointer active:scale-95"
                >
                  {t('common.confirm')}
                </button>
              </div>
            </div>
          </div>,
          document.body
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
