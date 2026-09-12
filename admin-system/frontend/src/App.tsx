import React, { useState, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { AppProvider, useApp } from '@store/AppContext';
import Sidebar from '@components/Sidebar';
import TopHeader from '@components/TopHeader';
import { ProtectedRoute } from '@components/ProtectedRoute';
import CurrencyRatesModal from '@components/common/CurrencyRatesModal';
import { useTranslation } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  CheckCircle2, 
  AlertCircle, 
  X, 
  HelpCircle,
  Loader2
} from 'lucide-react';

// Lazy-loaded Feature Modules for Fast Initial Bundle Load
const DashboardOverview = lazy(() => import('@features/dashboard').then(m => ({ default: m.DashboardOverview })));
const InventoryManagement = lazy(() => import('@features/inventory').then(m => ({ default: m.InventoryManagement })));
const EquipmentOverhead = lazy(() => import('@features/equipment').then(m => ({ default: m.EquipmentManagement })));
const InboundManagement = lazy(() => import('@features/inbound').then(m => ({ default: m.InboundManagement })));
const CustomerManagement = lazy(() => import('@features/customers').then(m => ({ default: m.CustomerManagement })));
const CustomerOrders = lazy(() => import('@features/orders').then(m => ({ default: m.CustomerOrders })));
const QuotationManager = lazy(() => import('@features/pricing').then(m => ({ default: m.QuotationManager })));
const HistoryAnalytics = lazy(() => import('@features/analytics').then(m => ({ default: m.HistoryAnalytics })));
const EmployeeManagement = lazy(() => import('@features/hr').then(m => ({ default: m.EmployeeManagement })));
const FinanceDashboard = lazy(() => import('@features/finance').then(m => ({ default: m.FinanceDashboard })));
const ProfileSettingsPage = lazy(() => import('@features/profile').then(m => ({ default: m.ProfileSettingsPage })));
const PreflightPage = lazy(() => import('./features/production/PreflightPage').then(m => ({ default: m.PreflightPage })));
const ShopFloorTracker = lazy(() => import('./features/production/ShopFloorTracker').then(m => ({ default: m.ShopFloorTracker })));
const WebCatalogPage = lazy(() => import('./features/catalog').then(m => ({ default: m.WebCatalogPage })));
const MaterialManagement = lazy(() => import('./features/materials').then(m => ({ default: m.MaterialManagement })));
const MasterDataManagement = lazy(() => import('./features/master-data').then(m => ({ default: m.MasterDataManagement })));
const SupplierManagement = lazy(() => import('./features/suppliers').then(m => ({ default: m.SupplierManagement })));

function ModuleSkeleton() {
  return (
    <div className="w-full h-96 flex flex-col items-center justify-center gap-3 text-slate-400 animate-pulse">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      <span className="text-sm font-medium">ກຳລັງໂຫລດຂໍ້ມູນໜ້າວຽກ...</span>
    </div>
  );
}

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
  const isTracker = isTrackerRoute || activeTab === 'tracker';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 flex transition-colors duration-300">
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
              <Suspense fallback={<ModuleSkeleton />}>
                {isTrackerRoute ? (
                  <ShopFloorTracker initialOrderNo={trackerOrderNo || undefined} />
                ) : (
                  <>
                    {activeTab === 'dashboard' && <DashboardOverview />}
                    {activeTab === 'catalog' && <WebCatalogPage />}
                    {activeTab === 'materials' && <MaterialManagement />}
                    {activeTab === 'master_data' && <MasterDataManagement />}
                    {activeTab === 'preflight' && (
                      <PreflightPage
                        onSendToQuotation={(res) => {
                          if (setPrefilledOrderSpecs) {
                            const isBatch = (res as any).is_batch_photo || res.file_name?.includes('Photo Prints') || !!(res as any).batch_files;
                            const isMono = !isBatch && (res.color_pages_count || 0) === 0 && (res.mono_pages_count || 0) > 0;
                            const covC = res.color_pages_avg_c !== undefined ? res.color_pages_avg_c : (res.avg_cov_c ?? 0);
                            const covM = res.color_pages_avg_m !== undefined ? res.color_pages_avg_m : (res.avg_cov_m ?? 0);
                            const covY = res.color_pages_avg_y !== undefined ? res.color_pages_avg_y : (res.avg_cov_y ?? 0);
                            const covK = (res.color_pages_count || 0) > 0
                              ? (res.color_pages_avg_k !== undefined ? res.color_pages_avg_k : (res.avg_cov_k ?? 0))
                              : (res.mono_pages_avg_k !== undefined ? res.mono_pages_avg_k : (res.avg_cov_k ?? 0));
                            const targetSize = res.target_paper_size || (isBatch ? '5x7 cm' : (res.suggested_paper || 'A4'));
                            setPrefilledOrderSpecs({
                              jobName: res.file_name.replace(/\.[^/.]+$/, ''),
                              pageCount: isBatch ? 1 : res.total_pages,
                              orderQuantity: isBatch ? 1 : 1,
                              photoCount: isBatch ? res.total_pages : undefined,
                              colorPages: isBatch ? res.total_pages : (res.color_pages_count || 0),
                              monoPages: isBatch ? 0 : (res.mono_pages_count || 0),
                              jobWidth: res.target_width_mm || (isBatch ? 50 : 210),
                              jobHeight: res.target_height_mm || (isBatch ? 70 : 297),
                              suggestedPaper: res.suggested_paper || (isBatch ? 'Photo Glossy 230gsm' : targetSize),
                              selected_paper_id: res.selected_paper_id,
                              paperId: res.selected_paper_id,
                              jobSizePreset: targetSize,
                              avgCovC: covC,
                              avgCovM: covM,
                              avgCovY: covY,
                              avgCovK: covK,
                              cCoverage: covC,
                              mCoverage: covM,
                              yCoverage: covY,
                              kCoverage: covK,
                              colorMode: isMono ? 'MONO_K' : (res.color_mode || 'CMYK'),
                              fileUrl: res.file_url,
                              fileName: res.file_name,
                              preflightData: res,
                              is_batch_photo: isBatch,
                              batch_files: (res as any).batch_files,
                              batchFiles: (res as any).batch_files,
                              cuts_per_sheet_override: res.cuts_per_sheet_override,
                              cutsPerSheetOverride: res.cuts_per_sheet_override,
                              imposition_summary: res.imposition_summary,
                              impositionSummary: res.imposition_summary,
                              includeCover: false,
                            });
                          }
                          setActiveTab('quotation');
                          showToast('ສົ່ງຄ່າສີ, ຂະໜາດຕັດ ແລະ ຈຳນວນຮູບໄປຍັງໃບສະເໜີລາຄາຮຽບຮ້ອຍ!', 'success');
                        }}
                      />
                    )}
                    {activeTab === 'quotation' && (
                      <QuotationManager onConvertToOrder={() => setActiveTab('orders')} />
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
              </Suspense>
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
