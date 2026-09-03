import React, { useState, useEffect, useMemo } from 'react';
import {
  User, Phone, MapPin, CreditCard, Search, Plus, X,
  ClipboardList, TrendingUp, AtSign, ExternalLink,
  Eye, Download, Image as ImageIcon, Receipt,
  Banknote, CreditCard as CardIcon, AlertTriangle,
  CheckCircle2, Clock, ArrowRight, Edit3, Save, XCircle,
  Wallet, ArrowLeft, Trash2, Globe, MessageSquare,
  Filter, CheckSquare, Square,  Building2, Truck, Users,
  ShieldAlert, ArrowUpDown, Tag, Sparkles, Store, Handshake,
  FileText
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@store/AppContext';
import { CustomerTier } from '../types';
import { CustomerCategoryModal } from './CustomerCategoryModal';
import { CustomerReceiptModal } from './CustomerReceiptModal';
import { CustomerLightbox } from './CustomerLightbox';
import { CustomerFormModal } from './CustomerFormModal';

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CustomerManagement() {
  const {
    customers,
    orders,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    bulkDeleteCustomers,
    customerCategories = [],
    addCustomerCategory,
    updateCustomerCategory,
    deleteCustomerCategory,
    showToast,
    setActiveTab,
    setPreselectedCustomerName,
    askConfirmation,
    formatCurrency
  } = useApp();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetailCustomerId, setSelectedDetailCustomerId] = useState<string | null>(null);
  
  // Filter & Sorting States
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [debtFilter, setDebtFilter] = useState<string>('ALL');
  const [orderFilter, setOrderFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('DEFAULT');

  // Multi-select state
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

  // Modals Open
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [lightbox, setLightbox] = useState<any>(null);
  const [receiptOrder, setReceiptOrder] = useState<any>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Block Delete & Bulk Delete Modals
  const [blockedDeleteModal, setBlockedDeleteModal] = useState<{
    isOpen: boolean;
    customerName: string;
    orderCount: number;
  } | null>(null);

  const [bulkDeleteModal, setBulkDeleteModal] = useState<{
    isOpen: boolean;
    blocked: Array<{ customer: any; orderCount: number }>;
    eligible: any[];
  } | null>(null);

  const formatLAK = formatCurrency;

  // Helper to accurately match customer orders
  const getOrdersForCustomer = (custName: string, custId?: string) => {
    const normName = (custName || '').trim().toLowerCase();
    const normId = ((custId || '') + '').trim();
    return orders.filter(o => {
      const oId = ((o.customerId || (o as any).customer_id || '') + '').trim();
      const oName = ((o.customerName || (o as any).customer_name || '') + '').trim().toLowerCase();
      if (normId && oId && oId === normId) return true;
      if (normName && oName && oName === normName) return true;
      return false;
    });
  };

  const getCustomerStats = (custName: string, custId?: string, customerTotalOrders?: number) => {
    const custOrders = getOrdersForCustomer(custName, custId);
    const totalOrders = Math.max(custOrders.length, customerTotalOrders || 0);
    const totalSpent = custOrders.reduce((sum, o) => sum + (o.totalPriceCharged || o.total_amount_lak || (o as any).total_price || 0), 0);
    const outstanding = custOrders.reduce((sum, o) => sum + (o.remainingUnpaidBalance || o.remaining_lak || 0), 0);
    return { totalOrders, totalSpent, outstanding, custOrders };
  };

  const handleOpenEditModal = (c: any) => {
    setEditingCustomer(c);
  };

  // Block Delete Policy: Single Delete
  const handleDeleteCustomer = (customerId: string, customerName: string) => {
    const cust = customers.find(c => c.id === customerId);
    const custOrders = getOrdersForCustomer(customerName, customerId);
    const orderCount = Math.max(custOrders.length, cust?.totalOrdersCount || 0);

    if (orderCount > 0) {
      setBlockedDeleteModal({
        isOpen: true,
        customerName,
        orderCount,
      });
      return;
    }

    const confirmMessage = currentLang === 'lo'
      ? `ທ່ານຕ້ອງການລຶບລູກຄ້າ "${customerName}" ແທ້ຫຼືບໍ່?`
      : `Are you sure you want to delete customer "${customerName}"?`;

    askConfirmation(confirmMessage, async () => {
      try {
        await deleteCustomer(customerId);
        if (selectedDetailCustomerId === customerId) {
          setSelectedDetailCustomerId(null);
        }
        setSelectedCustomerIds(prev => prev.filter(id => id !== customerId));
        showToast(currentLang === 'lo' ? 'ລຶບຂໍ້ມູນລູກຄ້າສຳເລັດ!' : 'Customer deleted successfully!', 'success');
      } catch (err: any) {
        showToast(err.message || 'Error deleting customer', 'error');
      }
    });
  };

  // Block Delete Policy: Bulk Delete
  const handleOpenBulkDelete = () => {
    if (selectedCustomerIds.length === 0) return;

    const blocked: Array<{ customer: any; orderCount: number }> = [];
    const eligible: any[] = [];

    selectedCustomerIds.forEach(id => {
      const cust = customers.find(c => c.id === id);
      if (!cust) return;
      const custOrders = getOrdersForCustomer(cust.name, cust.id);
      const orderCount = Math.max(custOrders.length, cust.totalOrdersCount || 0);
      if (orderCount > 0) {
        blocked.push({ customer: cust, orderCount });
      } else {
        eligible.push(cust);
      }
    });

    setBulkDeleteModal({
      isOpen: true,
      blocked,
      eligible
    });
  };

  const handleConfirmBulkDelete = async () => {
    if (!bulkDeleteModal || bulkDeleteModal.eligible.length === 0) return;
    const eligibleIds = bulkDeleteModal.eligible.map(c => c.id);

    try {
      if (bulkDeleteCustomers) {
        await bulkDeleteCustomers(eligibleIds);
      } else {
        for (const id of eligibleIds) {
          await deleteCustomer(id);
        }
      }
      setSelectedCustomerIds(prev => prev.filter(id => !eligibleIds.includes(id)));
      const count = eligibleIds.length;
      setBulkDeleteModal(null);
      showToast(
        currentLang === 'lo'
          ? `ລຶບລູກຄ້າທີ່ບໍ່ມີອໍເດີສຳເລັດ ${count} ລາຍການ!`
          : `Deleted ${count} eligible customers successfully!`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Bulk delete error', 'error');
    }
  };

  const handleCreateOrderRedirect = (customerName: string) => {
    setPreselectedCustomerName(customerName);
    setActiveTab('calculator');
  };

  // Fetch real order history for selected customer
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    if (!selectedDetailCustomerId) {
      setCustomerOrders([]);
      return;
    }
    const cust = customers.find(c => c.id === selectedDetailCustomerId);
    setIsLoadingOrders(true);
    fetch(`/api/orders/customer/${encodeURIComponent(selectedDetailCustomerId)}`)
      .then(res => res.json())
      .then(resData => {
        if (resData.status === 'success' && Array.isArray(resData.data)) {
          setCustomerOrders(resData.data);
        } else if (cust) {
          setCustomerOrders(getOrdersForCustomer(cust.name, cust.id));
        }
      })
      .catch(() => {
        if (cust) {
          setCustomerOrders(getOrdersForCustomer(cust.name, cust.id));
        }
      })
      .finally(() => setIsLoadingOrders(false));
  }, [selectedDetailCustomerId, customers, orders]);

  // ─── 4 Summary KPI Cards Calculation ───────────────────────────────────────────
  const directorySummary = useMemo(() => {
    const totalCustomers = customers.length;
    let totalRevenue = 0;
    let totalOutstanding = 0;
    let activeClientsCount = 0;

    const categoryCounts: Record<string, number> = {};
    (customerCategories || []).forEach((cat: any) => {
      categoryCounts[cat.id] = 0;
    });

    customers.forEach(c => {
      const cTier = c.tier || 'RETAIL';
      if (categoryCounts[cTier] !== undefined) {
        categoryCounts[cTier]++;
      } else {
        categoryCounts[cTier] = (categoryCounts[cTier] || 0) + 1;
      }

      const custOrders = getOrdersForCustomer(c.name, c.id);
      const orderCount = Math.max(custOrders.length, c.totalOrdersCount || 0);
      if (orderCount > 0) {
        activeClientsCount++;
      }
      const custSpent = (c.totalSpentLAK && c.totalSpentLAK > 0)
        ? c.totalSpentLAK
        : custOrders.reduce((sum, o) => sum + (o.total_amount_lak || o.totalPriceCharged || (o as any).total_price || 0), 0);
      const custDebt = custOrders.reduce((sum, o) => sum + (o.remaining_lak || o.remainingUnpaidBalance || 0), 0);

      totalRevenue += custSpent;
      totalOutstanding += custDebt;
    });

    return {
      totalCustomers,
      totalRevenue,
      totalOutstanding,
      activeClientsCount,
      categoryCounts
    };
  }, [customers, orders, customerCategories]);

  // ─── Filter & Sort Logic ────────────────────────────────────────────────────────
  const filteredCustomers = useMemo(() => {
    let result = customers.filter(c => {
      const matchSearch = (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone || '').includes(searchQuery) ||
        (c.taxId || '').includes(searchQuery) ||
        (c.village || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.district || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.province || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.address || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      // Tier Filter
      if (tierFilter !== 'ALL') {
        const cTier = c.tier || 'RETAIL';
        if (cTier !== tierFilter) return false;
      }

      // Debt Filter
      if (debtFilter !== 'ALL') {
        const custOrders = getOrdersForCustomer(c.name, c.id);
        const debt = custOrders.reduce((sum, o) => sum + (o.remaining_lak || o.remainingUnpaidBalance || 0), 0);
        if (debtFilter === 'HAS_DEBT' && debt <= 0) return false;
        if (debtFilter === 'CLEAR' && debt > 0) return false;
      }

      // Order Activity Filter
      if (orderFilter !== 'ALL') {
        const custOrders = getOrdersForCustomer(c.name, c.id);
        const orderCount = Math.max(custOrders.length, c.totalOrdersCount || 0);
        if (orderFilter === 'HAS_ORDERS' && orderCount === 0) return false;
        if (orderFilter === 'NEW_CLIENTS' && orderCount > 0) return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === 'SPENT_DESC') {
      result.sort((a, b) => {
        const spentA = getCustomerStats(a.name, a.id).totalSpent;
        const spentB = getCustomerStats(b.name, b.id).totalSpent;
        return spentB - spentA;
      });
    } else if (sortBy === 'SPENT_ASC') {
      result.sort((a, b) => {
        const spentA = getCustomerStats(a.name, a.id).totalSpent;
        const spentB = getCustomerStats(b.name, b.id).totalSpent;
        return spentA - spentB;
      });
    } else if (sortBy === 'ORDERS_DESC') {
      result.sort((a, b) => {
        const countA = getCustomerStats(a.name, a.id).totalOrders;
        const countB = getCustomerStats(b.name, b.id).totalOrders;
        return countB - countA;
      });
    } else if (sortBy === 'NAME_ASC') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return result;
  }, [customers, orders, searchQuery, tierFilter, debtFilter, orderFilter, sortBy]);

  // ─── Selection Management ──────────────────────────────────────────────────────
  const isAllSelected = filteredCustomers.length > 0 && filteredCustomers.every(c => selectedCustomerIds.includes(c.id));
  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const filteredIdSet = new Set(filteredCustomers.map(c => c.id));
      setSelectedCustomerIds(prev => prev.filter(id => !filteredIdSet.has(id)));
    } else {
      const newIds = Array.from(new Set([...selectedCustomerIds, ...filteredCustomers.map(c => c.id)]));
      setSelectedCustomerIds(newIds);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedCustomerIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectedCustomerObj = customers.find(c => c.id === selectedDetailCustomerId);
  
  const activeStats = useMemo(() => {
    if (!selectedCustomerObj) {
      return { totalOrders: 0, totalSpent: 0, outstanding: 0, custOrders: [] };
    }
    const custOrdersList = customerOrders.length > 0
      ? customerOrders
      : getOrdersForCustomer(selectedCustomerObj.name, selectedCustomerObj.id);

    const totalOrders = Math.max(custOrdersList.length, selectedCustomerObj.totalOrdersCount || 0);
    const totalSpent = (selectedCustomerObj.totalSpentLAK && selectedCustomerObj.totalSpentLAK > 0)
      ? selectedCustomerObj.totalSpentLAK
      : custOrdersList.reduce((sum, o) => sum + (o.total_amount_lak || o.totalPriceCharged || (o as any).total_price || 0), 0);

    const outstanding = custOrdersList.reduce((sum, o) => sum + (o.remaining_lak || o.remainingUnpaidBalance || 0), 0);

    return { totalOrders, totalSpent, outstanding, custOrders: custOrdersList };
  }, [selectedCustomerObj, customerOrders, orders]);

  const getTierBadge = (t?: string) => {
    const tierKey = (t || 'RETAIL').toUpperCase();
    const foundCat = (customerCategories || []).find((c: any) => c.id.toUpperCase() === tierKey);

    const color = foundCat?.color || 'sky';
    const label = foundCat?.name || t || 'ລູກຄ້າໜ້າຮ້ານ (Walk-in)';

    const colorClasses: Record<string, string> = {
      sky: 'bg-sky-50 text-sky-700 border-sky-100',
      violet: 'bg-violet-50 text-violet-700 border-violet-100',
      emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      amber: 'bg-amber-50 text-amber-800 border-amber-200',
      rose: 'bg-rose-50 text-rose-700 border-rose-200',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      slate: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    const activeClass = colorClasses[color] || colorClasses.sky;

    const renderIcon = () => {
      if (tierKey === 'RETAIL') return <Store className="w-3 h-3 text-sky-600 shrink-0" />;
      if (tierKey === 'ONLINE') return <Globe className="w-3 h-3 text-violet-600 shrink-0" />;
      if (tierKey === 'CORPORATE') return <Building2 className="w-3 h-3 text-emerald-600 shrink-0" />;
      if (tierKey === 'CONTRACT_PARTNER') return <Handshake className="w-3 h-3 text-amber-600 shrink-0" />;
      return <Tag className="w-3 h-3 text-slate-500 shrink-0" />;
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border font-bold text-[10px] ${activeClass}`}>
        {renderIcon()}
        <span>{label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Lightbox Modal */}
      {lightbox && (
        <CustomerLightbox
          src={lightbox.src}
          title={lightbox.title}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Receipt Modal */}
      {receiptOrder && (
        <CustomerReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
          formatLAK={formatLAK}
          currentLang={currentLang}
          t={t}
        />
      )}

      {/* Blocked Single Delete Modal */}
      {blockedDeleteModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-red-100 shadow-2xl animate-scale-up">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-slate-900">
                {currentLang === 'lo' ? 'ບໍ່ສາມາດລຶບລູກຄ້ານີ້ໄດ້!' : 'Cannot Delete Customer!'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                ລູກຄ້າ <span className="font-extrabold text-slate-900">"{blockedDeleteModal.customerName}"</span> ມີປະຫວັດການສັ່ງຊື້ທັງໝົດ{' '}
                <span className="font-extrabold text-red-600 font-sans">{blockedDeleteModal.orderCount}</span> ອໍເດີ ໃນລະບົບ
              </p>
              <div className="p-3 bg-red-50/70 border border-red-100 rounded-xl text-left text-[11px] text-red-700 font-medium space-y-1">
                <p className="font-black flex items-center gap-1 text-red-800">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  ນະໂຍບາຍ Block Delete (ປ້ອງກັນຂໍ້ມູນສູນຫາຍ):
                </p>
                <p>
                  ເພື່ອຮັກສາຄວາມຖືກຕ້ອງຂອງບັນຊີ, ປະຫວັດການຕັດສະຕັອກ, ແລະໃບກຳກັບພາສີ ທ່ານຕ້ອງລຶບອໍເດີທັງໝົດຂອງລູກຄ້ານີ້ອອກກ່ອນ ຈຶ່ງຈະສາມາດລຶບຂໍ້ມູນລູກຄ້າໄດ້
                </p>
              </div>
            </div>
            <button
              onClick={() => setBlockedDeleteModal(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs transition"
            >
              {currentLang === 'lo' ? 'ຮັບຊາບ ແລະ ປິດໜ້າຕ່າງ' : 'Acknowledge & Close'}
            </button>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal (Block Delete Policy) */}
      {bulkDeleteModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-slate-100 shadow-2xl animate-scale-up max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {currentLang === 'lo' ? 'ຢືນຢັນການລຶບລູກຄ້າແບບກຸ່ມ' : 'Bulk Delete Customers'}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    ກວດສອບນະໂຍບາຍ Block Delete ອັດຕະໂນມັດ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBulkDeleteModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              {/* Blocked Section */}
              {bulkDeleteModal.blocked.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-red-700 font-black">
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      <span>ບໍ່ສາມາດລຶບໄດ້ ({bulkDeleteModal.blocked.length} ຄົນ - ມີອໍເດີຄ້າງ):</span>
                    </span>
                  </div>
                  <div className="bg-red-50/50 border border-red-100 rounded-xl divide-y divide-red-100/60 max-h-36 overflow-y-auto">
                    {bulkDeleteModal.blocked.map(({ customer, orderCount }) => (
                      <div key={customer.id} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900">{customer.name}</span>
                          <span className="text-slate-400 font-mono text-[10px] ml-1.5">({customer.id})</span>
                        </div>
                        <span className="font-black text-red-600 font-sans px-2 py-0.5 bg-red-100 rounded-md text-[10px]">
                          {orderCount} ອໍເດີ
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 italic">
                    * ລູກຄ້າເຫຼົ່ານີ້ຈະບໍ່ຖືກລຶບ ເນື່ອງຈາກຍັງມີປະຫວັດອໍເດີຄ້າງຢູ່
                  </p>
                </div>
              )}

              {/* Eligible Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-emerald-700 font-black">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ພ້ອມລຶບ ({bulkDeleteModal.eligible.length} ຄົນ - ບໍ່ມີອໍເດີ):</span>
                  </span>
                </div>
                {bulkDeleteModal.eligible.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-slate-400 font-bold">
                    ບໍ່ມີລູກຄ້າທີ່ພ້ອມລຶບ (ທຸກຄົນທີ່ເລືອກມີປະຫວັດອໍເດີ)
                  </div>
                ) : (
                  <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl divide-y divide-emerald-100/60 max-h-36 overflow-y-auto">
                    {bulkDeleteModal.eligible.map((customer) => (
                      <div key={customer.id} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900">{customer.name}</span>
                          <span className="text-slate-400 font-mono text-[10px] ml-1.5">({customer.id})</span>
                        </div>
                        <span className="text-emerald-700 font-bold text-[10px] bg-emerald-100/70 px-2 py-0.5 rounded-md">
                          0 ອໍເດີ (ປອດໄພ)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t flex items-center justify-end gap-2.5">
              <button
                onClick={() => setBulkDeleteModal(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition"
              >
                {currentLang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                disabled={bulkDeleteModal.eligible.length === 0}
                className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
                  bulkDeleteModal.eligible.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {currentLang === 'lo'
                    ? `ລຶບສະເພາະລາຍການທີ່ພ້ອມລຶບ (${bulkDeleteModal.eligible.length} ຄົນ)`
                    : `Delete Eligible (${bulkDeleteModal.eligible.length})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. MAIN DIRECTORY PAGE (Full-width list view) */}
      {!selectedDetailCustomerId ? (
        <div className="space-y-6">
          
          {/* Top 4 KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Customers */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  {currentLang === 'lo' ? 'ລູກຄ້າທັງໝົດ' : 'Total Customers'}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center text-accent-sky">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl lg:text-3xl font-black font-sans text-slate-900">
                  {directorySummary.totalCustomers}
                  <span className="text-xs font-bold text-slate-400 ml-1.5 font-sans">
                    {currentLang === 'lo' ? 'ຄົນ' : 'clients'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {(customerCategories || []).slice(0, 4).map((cat: any) => {
                    const colorClasses: Record<string, string> = {
                      sky: 'bg-sky-50 text-sky-700',
                      violet: 'bg-violet-50 text-violet-700',
                      emerald: 'bg-emerald-50 text-emerald-700',
                      amber: 'bg-amber-50 text-amber-800',
                      rose: 'bg-rose-50 text-rose-700',
                      indigo: 'bg-indigo-50 text-indigo-700',
                      slate: 'bg-slate-100 text-slate-700',
                    };
                    const colorCls = colorClasses[cat.color || 'sky'] || colorClasses.sky;
                    const shortName = (cat.name || '').split(' ')[0] || cat.name;
                    return (
                      <span key={cat.id} className={`text-[10px] px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1 ${colorCls}`}>
                        {cat.id === 'RETAIL' && <Store className="w-2.5 h-2.5" />}
                        {cat.id === 'ONLINE' && <Globe className="w-2.5 h-2.5" />}
                        {cat.id === 'CORPORATE' && <Building2 className="w-2.5 h-2.5" />}
                        {cat.id === 'CONTRACT_PARTNER' && <Handshake className="w-2.5 h-2.5" />}
                        {!['RETAIL', 'ONLINE', 'CORPORATE', 'CONTRACT_PARTNER'].includes(cat.id) && <Tag className="w-2.5 h-2.5" />}
                        <span>{shortName}: {directorySummary.categoryCounts[cat.id] || 0}</span>
                      </span>
                    );
                  })}
                  {customerCategories.length > 4 && (
                    <button
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold hover:bg-slate-200"
                    >
                      +{customerCategories.length - 4}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Total Revenue */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  {currentLang === 'lo' ? 'ຍອດຊື້ສະສົມລວມ' : 'Total Revenue'}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl lg:text-3xl font-black font-sans text-slate-900 truncate" title={formatLAK(directorySummary.totalRevenue)}>
                  {formatLAK(directorySummary.totalRevenue)}
                </div>
              </div>
            </div>

            {/* 3. Total Outstanding / AR */}
            <div className={`p-5 rounded-3xl border shadow-sm flex flex-col justify-between transition ${directorySummary.totalOutstanding > 0 ? 'bg-amber-50/40 border-amber-200/60' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  {currentLang === 'lo' ? 'ຍອດໜີ້ຄ້າງຊຳລະ (AR)' : 'Total Outstanding'}
                </span>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${directorySummary.totalOutstanding > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400'}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className={`text-xl lg:text-2xl font-black font-sans truncate ${directorySummary.totalOutstanding > 0 ? 'text-red-600' : 'text-slate-900'}`} title={formatLAK(directorySummary.totalOutstanding)}>
                  {formatLAK(directorySummary.totalOutstanding)}
                </div>
                <div className="text-xs text-slate-500 font-semibold mt-1.5">
                  {directorySummary.totalOutstanding > 0 ? (
                    <span className="text-amber-700 font-bold inline-flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{currentLang === 'lo' ? 'ມີຍອດຄ້າງຊຳລະທີ່ຕ້ອງຕິດຕາມ' : 'Outstanding balance requires follow-up'}</span>
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-bold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{currentLang === 'lo' ? 'ບໍ່ມີຍອດຄ້າງຊຳລະ' : 'All accounts settled'}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Active Clients */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  {currentLang === 'lo' ? 'ລູກຄ້າທີ່ມີການສັ່ງຊື້' : 'Active Ordering Clients'}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl lg:text-3xl font-black font-sans text-slate-900">
                  {directorySummary.activeClientsCount}
                  <span className="text-xs font-bold text-slate-400 ml-1.5 font-sans">
                    / {directorySummary.totalCustomers} ຄົນ
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${directorySummary.totalCustomers > 0 ? Math.round((directorySummary.activeClientsCount / directorySummary.totalCustomers) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Actions Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={currentLang === 'lo' ? 'ຄົ້ນຫາຊື່, ເບີໂທ, Tax ID, ຫຼື ຊ່ອງທາງຕິດຕໍ່...' : 'Search name, phone, tax ID, or social...'}
                  className="w-full min-h-[44px] pl-10 pr-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-accent-sky text-xs font-semibold text-slate-700 transition"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Manage Categories button */}
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="min-h-[44px] px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Tag className="w-4 h-4 text-accent-sky" />
                  <span>{currentLang === 'lo' ? 'ຈັດການໝວດໝູ່' : 'Categories'}</span>
                </button>

                {/* Register button */}
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="min-h-[44px] px-5 bg-accent-sky hover:bg-sky-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>{currentLang === 'lo' ? 'ເພີ່ມລູກຄ້າໃໝ່' : 'Register Customer'}</span>
                </button>
              </div>
            </div>

            {/* Filter Dropdowns & Sorter */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[11px] mr-1">
                <Filter className="w-3.5 h-3.5" />
                <span>{currentLang === 'lo' ? 'ຕົວກອງ:' : 'Filters:'}</span>
              </div>

              {/* Tier Filter */}
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-xs focus:outline-none"
              >
                <option value="ALL">{currentLang === 'lo' ? 'ທຸກປະເພດລູກຄ້າ (All Types)' : 'All Customer Types'}</option>
                {customerCategories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* Debt Filter */}
              <select
                value={debtFilter}
                onChange={(e) => setDebtFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-xs focus:outline-none"
              >
                <option value="ALL">{currentLang === 'lo' ? 'ສະຖານະໜີ້ສິນ: ທັງໝົດ' : 'Debt: All'}</option>
                <option value="HAS_DEBT">{currentLang === 'lo' ? 'ມີຍອດຄ້າງຊຳລະ' : 'Has Outstanding Debt'}</option>
                <option value="CLEAR">{currentLang === 'lo' ? 'ຊຳລະຄົບແລ້ວ' : 'Fully Settled'}</option>
              </select>

              {/* Order Activity Filter */}
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-xs focus:outline-none"
              >
                <option value="ALL">{currentLang === 'lo' ? 'ປະຫວັດການສັ່ງຊື້: ທັງໝົດ' : 'Orders: All'}</option>
                <option value="HAS_ORDERS">{currentLang === 'lo' ? 'ເຄີຍມີອໍເດີແລ້ວ' : 'Has Orders'}</option>
                <option value="NEW_CLIENTS">{currentLang === 'lo' ? 'ລູກຄ້າໃໝ່ (ຍັງບໍ່ມີອໍເດີ)' : 'New / No Orders'}</option>
              </select>

              {/* Sort By */}
              <div className="ml-auto flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-xs focus:outline-none"
                >
                  <option value="DEFAULT">{currentLang === 'lo' ? 'ຈັດຮຽງ: ຄ່າເລີ່ມຕົ້ນ' : 'Sort: Default'}</option>
                  <option value="SPENT_DESC">{currentLang === 'lo' ? 'ຍອດຊື້: ສູງຫາຕ່ຳ' : 'Spent: High to Low'}</option>
                  <option value="SPENT_ASC">{currentLang === 'lo' ? 'ຍອດຊື້: ຕ່ຳຫາສູງ' : 'Spent: Low to High'}</option>
                  <option value="ORDERS_DESC">{currentLang === 'lo' ? 'ຈຳນວນອໍເດີ: ຫຼາຍຫາໜ້ອຍ' : 'Orders: Most to Least'}</option>
                  <option value="NAME_ASC">{currentLang === 'lo' ? 'ຊື່: ກ-ຮ / A-Z' : 'Name: A-Z'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sticky/Floating Bulk Action Bar */}
          {selectedCustomerIds.length > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl animate-fade-in border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-accent-sky text-white flex items-center justify-center font-bold text-xs">
                  {selectedCustomerIds.length}
                </span>
                <span className="text-xs font-bold text-slate-200">
                  {currentLang === 'lo'
                    ? `ເລືອກແລ້ວ ${selectedCustomerIds.length} ລາຍການ`
                    : `Selected ${selectedCustomerIds.length} customers`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCustomerIds([])}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  {currentLang === 'lo' ? 'ຍົກເລີກການເລືອກ' : 'Deselect All'}
                </button>
                <button
                  onClick={handleOpenBulkDelete}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{currentLang === 'lo' ? `ລຶບທີ່ເລືອກ (${selectedCustomerIds.length})` : `Delete Selected (${selectedCustomerIds.length})`}</span>
                </button>
              </div>
            </div>
          )}

          {/* Full Width Table with Multi-Select */}
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-4.5 px-4 text-center w-12">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 rounded text-accent-sky focus:ring-0 cursor-pointer"
                        title={isAllSelected ? 'Deselect All' : 'Select All'}
                      />
                    </th>
                    <th className="py-4.5 px-4">ID & Tier</th>
                    <th className="py-4.5 px-6">{currentLang === 'lo' ? 'ຊື່ລູກຄ້າ' : 'Customer Name'}</th>
                    <th className="py-4.5 px-6">{currentLang === 'lo' ? 'ເບີໂທ' : 'Phone'}</th>
                    <th className="py-4.5 px-6">{currentLang === 'lo' ? 'ທີ່ຢູ່ & ຂົນສົ່ງ' : 'Shipping & Courier'}</th>
                    <th className="py-4.5 px-6 text-center">{currentLang === 'lo' ? 'ຈຳນວນອໍເດີ' : 'Total Orders'}</th>
                    <th className="py-4.5 px-6 text-right">{currentLang === 'lo' ? 'ຍອດຊື້ສະສົມ' : 'Total Spent'}</th>
                    <th className="py-4.5 px-6 text-center">{currentLang === 'lo' ? 'ຈັດການ' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                        No customer records found.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map(c => {
                      const stats = getCustomerStats(c.name, c.id, c.totalOrdersCount);
                      const isSelected = selectedCustomerIds.includes(c.id);
                      const hasOrders = stats.totalOrders > 0;

                      return (
                        <tr key={c.id} className={`hover:bg-slate-50/50 transition ${isSelected ? 'bg-sky-50/40' : ''}`}>
                          {/* Checkbox */}
                          <td className="py-4.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectRow(c.id)}
                              className="w-4 h-4 rounded text-accent-sky focus:ring-0 cursor-pointer"
                            />
                          </td>
                          {/* ID & Tier */}
                          <td className="py-4.5 px-4 font-mono text-xs text-slate-400 uppercase">
                            <span className="block font-bold text-slate-700">{c.id}</span>
                            <div className="mt-1">
                              {getTierBadge(c.tier)}
                            </div>
                          </td>
                          {/* Name & details */}
                          <td className="py-4.5 px-6 font-extrabold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="block">{c.name}</span>
                              {c.taxId && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 font-bold text-[9px]" title={`Tax ID: ${c.taxId}`}>
                                  TAX
                                </span>
                              )}
                            </div>
                          </td>
                          {/* Phone */}
                          <td className="py-4.5 px-6 font-sans">
                            {c.phone || '-'}
                          </td>
                          {/* Address & Courier */}
                          <td className="py-4.5 px-6 truncate max-w-[240px] text-slate-500 text-xs" title={c.address}>
                            <span className="block truncate">{c.address || '-'}</span>
                            {c.preferredCourier && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px]">
                                <Truck className="w-3 h-3 text-slate-400" />
                                <span>{c.preferredCourier}</span>
                              </span>
                            )}
                          </td>
                          {/* Total Orders & Safety indicator */}
                          <td className="py-4.5 px-6 text-center">
                            <span className="font-sans font-extrabold text-slate-800 text-sm block">
                              {stats.totalOrders}
                            </span>
                            {hasOrders ? (
                              <span className="text-[10px] text-red-500 font-bold block" title="ນະໂຍບາຍ Block Delete: ຕ້ອງລຶບອໍເດີກ່ອນ">
                                ຕິດອໍເດີ (ລັອກ)
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-bold block">
                                ພ້ອມລຶບ (0 ອໍເດີ)
                              </span>
                            )}
                          </td>
                          {/* Total Spent */}
                          <td className="py-4.5 px-6 font-sans font-black text-slate-900 text-right">
                            <span className="block">{formatLAK(stats.totalSpent)}</span>
                            {stats.outstanding > 0 && (
                              <span className="text-[11px] text-red-500 font-sans font-bold block">
                                ຄ້າງ: {formatLAK(stats.outstanding)}
                              </span>
                            )}
                          </td>
                          {/* Actions */}
                          <td className="py-4.5 px-6">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setSelectedDetailCustomerId(c.id)}
                                title="ເບິ່ງລາຍລະອຽດ"
                                className="p-2 bg-slate-50 hover:bg-accent-sky hover:text-white rounded-xl text-slate-500 transition shadow-sm"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(c)}
                                title="ແກ້ໄຂ"
                                className="p-2 bg-slate-50 hover:bg-amber-500 hover:text-white rounded-xl text-slate-500 transition shadow-sm"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(c.id, c.name)}
                                title={hasOrders ? 'ບໍ່ສາມາດລຶບໄດ້ (ມີອໍເດີຄ້າງ)' : 'ລຶບ'}
                                className={`p-2 rounded-xl transition shadow-sm ${
                                  hasOrders
                                    ? 'bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500'
                                    : 'bg-slate-50 hover:bg-red-500 hover:text-white text-slate-500'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* 2. DEDICATED CUSTOMER DETAIL SUB-VIEW */
        <div className="space-y-8">
          {/* Back Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 sm:px-8 sm:py-6 rounded-3xl border border-slate-100 shadow-sm">
            <button
              onClick={() => setSelectedDetailCustomerId(null)}
              className="flex items-center gap-2.5 text-sm sm:text-base font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 sm:py-3 sm:px-6 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl w-fit"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{currentLang === 'lo' ? 'ກັບຄືນ' : 'Back to Directory'}</span>
            </button>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => handleOpenEditModal(selectedCustomerObj)}
                className="flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm sm:text-base font-black text-slate-600 transition"
              >
                <Edit3 className="w-5 h-5 text-accent-sky" />
                <span>{currentLang === 'lo' ? 'ແກ້ໄຂຂໍ້ມູນ' : 'Edit Profile'}</span>
              </button>
              <button
                onClick={() => handleDeleteCustomer(selectedCustomerObj.id, selectedCustomerObj.name)}
                className="flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl text-sm sm:text-base font-black transition"
              >
                <Trash2 className="w-5 h-5" />
                <span>{currentLang === 'lo' ? 'ລຶບລູກຄ້າ' : 'Delete Customer'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
            {/* Part A: Profile Info Card (Bright/Light Theme Redesign) */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-6 sm:p-8 text-center border-b border-slate-100 relative">
                  {/* Large User Avatar Icon instead of initials */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-sky-50 text-accent-sky rounded-full flex items-center justify-center mx-auto border-2 border-sky-100 shadow-inner">
                    <User className="w-10 h-10 sm:w-12 sm:h-12" />
                  </div>
                  <h4 className="font-black text-2xl sm:text-3xl text-slate-900 mt-5 leading-tight">{selectedCustomerObj.name}</h4>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-xs text-slate-400 font-mono tracking-wider uppercase font-bold">
                      ID: {selectedCustomerObj.id}
                    </span>
                    {getTierBadge(selectedCustomerObj.tier)}
                  </div>

                  {/* Financial Statistics (Clean Light Highlight) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 sm:p-4 text-center">
                      <span className="text-xs text-slate-400 block font-black uppercase tracking-wider">{currentLang === 'lo' ? 'ຍອດຊື້ສະສົມ' : 'Total Spent'}</span>
                      <span className="text-sm sm:text-base font-black font-sans text-slate-900 mt-1 block">{formatLAK(activeStats.totalSpent)}</span>
                    </div>
                    <div className={`border rounded-2xl p-3.5 sm:p-4 text-center transition ${activeStats.outstanding > 0 ? 'bg-red-50/50 border-red-100 text-red-700' : 'bg-slate-50 border-slate-100 text-slate-900'}`}>
                      <span className="text-xs text-slate-400 block font-black uppercase tracking-wider">{currentLang === 'lo' ? 'ຍອດຄ້າງຊຳລະ' : 'Outstanding'}</span>
                      <span className="text-sm sm:text-base font-black font-sans mt-1 block">{formatLAK(activeStats.outstanding)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-5 sm:space-y-6">
                  {/* Phone */}
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-black uppercase tracking-wider block">ເບີໂທລະສັບ</span>
                      <span className="font-sans font-bold text-slate-700 text-base">{selectedCustomerObj.phone || '-'}</span>
                    </div>
                  </div>

                  {/* Shipping Address & Preferred Courier */}
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-black uppercase tracking-wider block">ທີ່ຢູ່ຈັດສົ່ງ</span>
                      <span className="font-bold text-slate-700 leading-relaxed text-sm lg:text-base block break-words">{selectedCustomerObj.address || '-'}</span>
                      {selectedCustomerObj.preferredCourier && (
                        <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-100 font-bold text-xs">
                          <Truck className="w-3.5 h-3.5 text-amber-600" />
                          <span>ຂົນສົ່ງປະຈຳ: {selectedCustomerObj.preferredCourier}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tax Profile (if available) */}
                  {(selectedCustomerObj.taxId || selectedCustomerObj.branchCode) && (
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                        <Building2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-black uppercase tracking-wider block">ຂໍ້ມູນຜູ້ເສຍພາສີ (Tax Profile)</span>
                        <div className="space-y-0.5 mt-0.5">
                          {selectedCustomerObj.taxId && (
                            <span className="font-mono font-bold text-slate-800 text-sm block">Tax ID: {selectedCustomerObj.taxId}</span>
                          )}
                          {selectedCustomerObj.branchCode && (
                            <span className="text-xs text-slate-500 font-semibold block">ສາຂາ: {selectedCustomerObj.branchCode}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes (if available) */}
                  {selectedCustomerObj.notes && (
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-black uppercase tracking-wider block">ໝາຍເຫດ (Notes)</span>
                        <p className="text-slate-700 text-xs sm:text-sm font-semibold mt-0.5 leading-relaxed break-words">
                          {selectedCustomerObj.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button: Place Order */}
              <div className="p-6 sm:p-8 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => handleCreateOrderRedirect(selectedCustomerObj.name)}
                  className="w-full min-h-[50px] sm:min-h-[56px] bg-accent-sky hover:bg-sky-600 text-white rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-sky-600/10 hover:shadow-sky-600/20 transition active:scale-95 py-3 px-4 sm:py-3.5 sm:px-6"
                >
                  <Plus className="w-5 h-5" />
                  <span>{currentLang === 'lo' ? 'ສ້າງອໍເດີໃໝ່ໃຫ້ລູກຄ່ານີ້' : 'Create New Order'}</span>
                </button>
              </div>
            </div>

            {/* Part B: History & Orders Section (Spacious Redesign) */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8 flex flex-col justify-between min-h-[500px] lg:min-h-[750px] w-full">
              <div className="space-y-6">
                <div className="flex items-center gap-2 sm:gap-3 pb-3 sm:pb-4 border-b border-slate-100">
                  <ClipboardList className="w-6 h-6 text-slate-400" />
                  <h5 className="text-sm font-black uppercase text-slate-600 tracking-wider">
                    {currentLang === 'lo' ? 'ປະຫວັດການສັ່ງຊື້ທັງໝົດ' : 'Billing & Order History Log'} ({activeStats.totalOrders})
                  </h5>
                </div>

                {activeStats.custOrders.length === 0 ? (
                  <div className="py-36 text-center space-y-3">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                      <Receipt className="w-7 h-7" />
                    </div>
                    <p className="text-sm text-slate-400 font-bold italic">ຍັງບໍ່ມີປະຫວັດການສັ່ງຊື້ສຳລັບລູກຄ່ານີ້</p>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50/70 text-xs lg:text-sm font-black uppercase text-slate-500 tracking-wider border-b border-slate-100">
                          <th className="px-4 py-4">Order ID / Date</th>
                          <th className="px-4 py-4">ລາຍການສັ່ງພິມ</th>
                          <th className="px-4 py-4">ການຊຳລະເງິນ</th>
                          <th className="px-4 py-4">ຫຼັກຖານ / ຟາຍ</th>
                          <th className="px-4 py-4 text-right">ຍອດລວມ (LAK)</th>
                          <th className="px-4 py-4 text-center">ບິນ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-base text-slate-700">
                        {activeStats.custOrders.map((o, idx) => {
                          const hasSlip = !!o.paymentSlipUrl;
                          return (
                            <tr key={o.id || idx} className="hover:bg-slate-50/30 transition">
                              {/* Order ID & Date */}
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="font-mono font-black text-slate-900 block text-sm lg:text-base">#{o.id}</span>
                                <span className="text-xs lg:text-sm text-slate-400 block font-sans mt-1">{o.date}</span>
                              </td>
                              {/* Items list */}
                              <td className="px-4 py-4 min-w-[200px] break-words">
                                <p className="font-bold text-slate-800 text-sm lg:text-base leading-snug break-words">
                                  {o.items.map(item => item.name).join(', ')}
                                </p>
                                {o.notes && (
                                  <p className="text-xs text-slate-400 font-semibold italic mt-1 break-words" title={o.notes}>
                                    {o.notes}
                                  </p>
                                )}
                              </td>
                              {/* Payment details */}
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-[8px] text-[10px] sm:text-xs lg:text-sm font-extrabold uppercase border ${
                                  o.paymentStatus === 'Fully Paid'
                                    ? 'bg-green-50 text-green-700 border-green-100'
                                    : o.paymentStatus === 'Deposit Paid'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                    : 'bg-red-50 text-red-700 border-red-100'
                                }`}>
                                  {o.paymentStatus === 'Fully Paid' ? 'ຊຳລະແລ້ວ' : o.paymentStatus === 'Deposit Paid' ? 'ມັດຈຳ' : 'ລໍຖ້າຈ່າຍ'}
                                </span>
                                <span className="block text-xs text-slate-400 font-sans font-bold mt-2">
                                  {o.paymentMethod} {o.bankName ? `(${o.bankName})` : ''}
                                </span>
                              </td>
                              {/* Document & Slip thumbnails */}
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1.5">
                                  {o.artworkLink && (
                                    <button
                                      onClick={() => setLightbox({ src: o.artworkLink, title: `Artwork File: #${o.id}` })}
                                      className="flex items-center justify-center gap-2 text-xs lg:text-sm font-black text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-100 px-3 py-1.5 rounded-lg transition w-fit"
                                    >
                                      <ImageIcon className="w-4 h-4 shrink-0" />
                                      <span>Artwork</span>
                                    </button>
                                  )}
                                  {hasSlip ? (
                                    <button
                                      onClick={() => setLightbox({ src: o.paymentSlipUrl, title: `Payment Slip: #${o.id}` })}
                                      className="flex items-center justify-center gap-2 text-xs lg:text-sm font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 px-3 py-1.5 rounded-lg transition w-fit"
                                    >
                                      <Receipt className="w-4 h-4 shrink-0" />
                                      <span>Slip View</span>
                                    </button>
                                  ) : (
                                    <span className="text-xs text-slate-300 italic block pl-1">ບໍ່ມີສລິບ</span>
                                  )}
                                </div>
                              </td>
                              {/* Price charged */}
                              <td className="px-4 py-4 text-right font-sans font-black text-slate-900 whitespace-nowrap">
                                <span className="block text-base lg:text-lg">{formatLAK(o.totalPriceCharged)}</span>
                                {o.remainingUnpaidBalance > 0 && (
                                  <span className="text-xs font-sans font-bold text-red-500 block mt-1.5">
                                    ຄ້າງ: {formatLAK(o.remainingUnpaidBalance)}
                                  </span>
                                )}
                              </td>
                              {/* View Invoice Receipt */}
                              <td className="px-4 py-4 text-center">
                                <button
                                  onClick={() => setReceiptOrder(o)}
                                  className="p-3 bg-slate-50 hover:bg-slate-100 hover:text-slate-800 text-slate-400 rounded-xl transition border border-slate-100 shadow-sm"
                                  title="ເບິ່ງໃບບິນ"
                                >
                                  <Receipt className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Universal Customer Form Modal (Add & Edit) ───────────────────────────── */}
      <CustomerFormModal
        isOpen={isAddModalOpen || Boolean(editingCustomer)}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCustomer(null);
        }}
        customer={editingCustomer}
        onOpenManageCategories={() => setIsCategoryModalOpen(true)}
      />

      {/* ─── Universal Customer Category Modal ────────────────────────────────────── */}
      <CustomerCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </div>
  );
}
