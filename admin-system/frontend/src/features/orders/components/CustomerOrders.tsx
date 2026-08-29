import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '@store/AppContext';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Activity, 
  Layers, 
  Calculator,
  Check,
  X,
  Search,
  Calendar,
  Filter,
  Truck,
  CreditCard,
  RotateCcw,
  DollarSign,
  Wallet,
  ArrowUpDown,
  ChevronDown,
  Download,
  FileSpreadsheet,
  CheckSquare,
  Printer
} from 'lucide-react';
import OrdersTable from './OrdersTable';
import CreateOrderPage from './CreateOrderPage';
import OrderDetailsPage from './OrderDetailsPage';
import OrderReceptionPage from './OrderReceptionPage';
import ProductionTrackingPage from './ProductionTrackingPage';
import OrderDeliveryPage from './OrderDeliveryPage';
import OrderCompletedSummaryPage from './OrderCompletedSummaryPage';
import Lightbox from './Lightbox';
import OrderDetailsModal from './OrderDetailsModal';
import { QuotationManager } from '@features/pricing';
import { ProductionBoard } from '@features/production';
import SubmitQuotationModal from './SubmitQuotationModal';
import QuickTrackingModal from './QuickTrackingModal';
import ShippingLabelModal from './modals/ShippingLabelModal';
import ArtworkViewerModal from './modals/ArtworkViewerModal';
import EditOrderModal from './modals/EditOrderModal';

export default function CustomerOrders({ initialSubTab = 'orders' }) {
  const { 
    orders, 
    updateOrderStatus,
    updateOrderDetails,
    startOrderProduction,
    updateOrderTracking,
    couriers,
    updateOrderPaymentStatus,
    settleOrderBalance, 
    deleteOrder, 
    updatePreflightCheck,
    updateProductionStep,
    inventory,
    equipment,
    showToast,
    askConfirmation,
    focusOrderId,
    setFocusOrderId,
    addOrder,
    customers,
    addCustomer,
    prefilledOrderSpecs,
    setPrefilledOrderSpecs,
    addSpoilageLog,
    formatCurrency
  } = useApp();

  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  if (initialSubTab === 'production') {
    return (
      <ProductionBoard showToast={showToast} formatLAK={formatCurrency} />
    );
  }

  const [showQuotation, setShowQuotation] = useState(initialSubTab === 'quotation');
  const [filterStatus, setFilterStatus] = useState(
    initialSubTab === 'production' ? 'Printing' : initialSubTab === 'deliveries' ? 'Ready' : 'All'
  );
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeOrderStep, setActiveOrderStep] = useState(1);
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(initialSubTab === 'create_order');
  const [lightbox, setLightbox] = useState(null);
  const [quoteModalOrder, setQuoteModalOrder] = useState(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState(null);
  const [shippingLabelOrder, setShippingLabelOrder] = useState(null);
  const [artworkModalOrder, setArtworkModalOrder] = useState(null);
  const [editModalOrder, setEditModalOrder] = useState(null);
  const focusRef = useRef(null);

  useEffect(() => {
    if (selectedOrder) {
      if (selectedOrder.status === 'Delivered' || selectedOrder.status === 'COMPLETED' || initialSubTab === 'completed') {
        setActiveOrderStep(4);
      } else if (selectedOrder.status === 'Ready' || selectedOrder.status === 'READY_FOR_PICKUP' || initialSubTab === 'deliveries') {
        setActiveOrderStep(3);
      } else if (['Printing', 'Cutting', 'IN_PRODUCTION'].includes(selectedOrder.status) || initialSubTab === 'production') {
        setActiveOrderStep(2);
      } else {
        setActiveOrderStep(1);
      }
    }
  }, [selectedOrder?.id, initialSubTab]);

  useEffect(() => {
    if (initialSubTab === 'create_order') {
      setIsAddOrderOpen(true);
      setShowQuotation(false);
    } else if (initialSubTab === 'production') {
      setFilterStatus('Printing');
      setIsAddOrderOpen(false);
      setShowQuotation(false);
    } else if (initialSubTab === 'deliveries') {
      setFilterStatus('Ready');
      setIsAddOrderOpen(false);
      setShowQuotation(false);
    } else if (initialSubTab === 'orders') {
      setIsAddOrderOpen(false);
      setShowQuotation(false);
    } else if (initialSubTab === 'quotation') {
      setIsAddOrderOpen(false);
      setShowQuotation(true);
    }
  }, [initialSubTab]);

  // Settle Balance Wizard states
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [settleStep, setSettleStep] = useState(1);
  const [settleAmount, setSettleAmount] = useState(0);
  const [settleMethod, setSettleMethod] = useState('BCEL One');
  const [settleSlip, setSettleSlip] = useState('');

  // Auto-open modal when quote converted to order
  useEffect(() => {
    if (prefilledOrderSpecs && prefilledOrderSpecs.isConvertedFromQuote) {
      setIsAddOrderOpen(true);
      setShowQuotation(false);
    }
  }, [prefilledOrderSpecs]);

  // Auto-select order when navigated from CRM
  useEffect(() => {
    if (focusOrderId) {
      const target = orders.find(o => o.id === focusOrderId);
      if (target) {
        setFilterStatus('All');
        setSelectedOrder(target);
        setTimeout(() => focusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
      }
      setFocusOrderId(null);
    }
  }, [focusOrderId, orders, setFocusOrderId]);

  // Multi-currency formatter from context (prop name kept as formatLAK for downstream components)
  const formatLAK = formatCurrency;

  const statuses = [
    { id: 'All', labelLo: 'ທັງໝົດ', labelEn: 'All' },
    { id: 'Received', labelLo: 'ຮັບອໍເດີ', labelEn: 'Received' },
    { id: 'Printing', labelLo: 'ຂັ້ນຕອນການພິມ', labelEn: 'Printing' },
    { id: 'Ready', labelLo: 'ຂັ້ນຕອນການຈັດສົ່ງ', labelEn: 'Delivery' },
    { id: 'Delivered', labelLo: 'ສຳເລັດທັງໝົດ', labelEn: 'Completed' },
    { id: 'Cancelled', labelLo: 'ຍົກເລີກ', labelEn: 'Cancelled' },
  ];

  const handleStatusChange = useCallback((orderId, targetOrCurrentStatus) => {
    let nextStatus = targetOrCurrentStatus;
    let paymentUpdate = null;

    if (targetOrCurrentStatus === 'Received') nextStatus = 'Printing';
    else if (targetOrCurrentStatus === 'Printing') nextStatus = 'Cutting';
    else if (targetOrCurrentStatus === 'Cutting') nextStatus = 'Ready';
    else if (targetOrCurrentStatus === 'Ready') nextStatus = 'Delivered';
    else if (targetOrCurrentStatus === 'PREPRESS_CHECK') {
      nextStatus = 'PREPRESS_CHECK';
      paymentUpdate = 'Paid';
    } else if (targetOrCurrentStatus === 'PENDING') {
      nextStatus = 'Pending';
      paymentUpdate = 'Unpaid';
    } else if (targetOrCurrentStatus === 'IN_PRODUCTION') {
      nextStatus = 'Printing';
    }

    updateOrderStatus(orderId, nextStatus);
    
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: nextStatus,
          paymentStatus: paymentUpdate || prev.paymentStatus
        };
      });
    }
  }, [selectedOrder, updateOrderStatus]);

  const handlePreflightToggle = useCallback((field, value) => {
    if (!selectedOrder) return;
    updatePreflightCheck(selectedOrder.id, field, value);
    showToast(currentLang === 'lo' ? 'ອັບເດດສະຖານະປຼູຟສຳເລັດ!' : 'Pre-flight updated!', 'success');
    
    const updated = orders.find(o => o.id === selectedOrder.id);
    if (updated) setSelectedOrder(updated);
  }, [selectedOrder, updatePreflightCheck, showToast, currentLang, orders]);

  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'Received': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'Printing': return <Activity className="w-4 h-4 text-purple-600 animate-pulse" />;
      case 'Cutting': return <Layers className="w-4 h-4 text-amber-600" />;
      case 'Ready': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'Delivered': return <CheckCircle2 className="w-4 h-4 text-slate-500" />;
      default: return <Clock className="w-4 h-4 text-slate-500" />;
    }
  }, []);

  const getStatusBadgeClass = useCallback((status) => {
    switch (status) {
      case 'Received': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Printing': return 'bg-purple-50 text-purple-700 border-purple-100 animate-pulse';
      case 'Cutting': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Ready': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Delivered': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-50 text-slate-700';
    }
  }, []);

  const getPaymentStatusIcon = useCallback((status) => {
    switch (status) {
      case 'Paid':
      case 'Fully Paid':
      case 'PAID':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Deposit':
      case 'Deposit Paid':
        return <Clock className="w-3.5 h-3.5 text-amber-600" />;
      case 'Pending':
      case 'Unpaid':
        return <Clock className="w-3.5 h-3.5 text-rose-500" />;
      case 'Overdue':
        return <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-bounce" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  }, []);

  const getPaymentStatusBadge = useCallback((status) => {
    switch (status) {
      case 'Paid':
      case 'Fully Paid':
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-extrabold';
      case 'Deposit':
      case 'Deposit Paid':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
      case 'Pending':
      case 'Unpaid':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-medium';
      case 'Overdue':
        return 'bg-red-100 text-red-800 border-red-200 font-extrabold animate-bounce';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }, []);

  const handleSettleSubmit = (e) => {
    e.preventDefault();
    if (!selectedOrder || settleAmount <= 0) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາປ້ອນຈຳນວນເງິນຊຳຣະ!' : 'Enter settlement amount!', 'warning');
      return;
    }

    fetch(`http://localhost:8080/api/orders/${selectedOrder.id}/deposit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deposit_amount: Number(settleAmount) })
    })
    .then(res => {
      if (!res.ok) throw new Error('Deposit failed');
      return res.json();
    })
    .then(updatedOrder => {
      settleOrderBalance(selectedOrder.id, Number(settleAmount), settleMethod, settleSlip);
      showToast(currentLang === 'lo' ? 'ຊຳຣະລ້ຽງໜີ້ສຳເລັດ!' : 'Balance settled successfully!', 'success');
      const updated = orders.find(o => o.id === selectedOrder.id);
      if (updated) {
        setSelectedOrder({
          ...updated,
          status: updatedOrder.status === 'PREPRESS_CHECK' ? 'Prepress' : updated.status,
          depositAmountPaid: updatedOrder.deposit_amount
        });
      }
    })
    .catch(err => {
      console.error(err);
      settleOrderBalance(selectedOrder.id, Number(settleAmount), settleMethod, settleSlip);
      showToast(currentLang === 'lo' ? 'ຊຳຣະລ້ຽງໜີ້ສຳເລັດ!' : 'Balance settled successfully!', 'success');
      const updated = orders.find(o => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    })
    .finally(() => {
      setIsSettleOpen(false);
      setSettleAmount(0);
      setSettleSlip('');
      setSettleStep(1);
    });
  };

  const applySettlePreset = (pct) => {
    if (selectedOrder) {
      if (pct === 100) setSettleAmount(selectedOrder.remainingUnpaidBalance);
      else if (pct === 50) setSettleAmount(Math.round(selectedOrder.remainingUnpaidBalance / 2));
    }
  };

  // Advanced Search & Multi-Criteria Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'unpaid' | 'deposit' | 'paid'>('all');
  const [courierFilter, setCourierFilter] = useState<string>('all');
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false);

  const isWithinDatePreset = useCallback((orderDateStr: string) => {
    if (datePreset === 'all') return true;
    if (!orderDateStr) return false;

    let orderDate: Date;
    if (orderDateStr.includes('/')) {
      const parts = orderDateStr.split('/');
      if (parts.length === 3) {
        orderDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      } else {
        orderDate = new Date(orderDateStr);
      }
    } else {
      orderDate = new Date(orderDateStr);
    }

    if (isNaN(orderDate.getTime())) return true;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (datePreset === 'today') {
      return orderDate >= todayStart && orderDate <= todayEnd;
    }

    if (datePreset === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return orderDate >= monday && orderDate <= sunday;
    }

    if (datePreset === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return orderDate >= startOfMonth && orderDate <= endOfMonth;
    }

    if (datePreset === 'custom') {
      let pass = true;
      if (customStartDate) {
        const start = new Date(customStartDate + 'T00:00:00');
        if (orderDate < start) pass = false;
      }
      if (customEndDate) {
        const end = new Date(customEndDate + 'T23:59:59');
        if (orderDate > end) pass = false;
      }
      return pass;
    }

    return true;
  }, [datePreset, customStartDate, customEndDate]);

  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      // 1. Tab / Lifecycle status filter
      if (initialSubTab === 'completed') {
        if (ord.status !== 'Delivered' && ord.status !== 'COMPLETED') return false;
      } else if (initialSubTab === 'cancelled') {
        if (ord.status !== 'Cancelled' && ord.status !== 'CANCELLED') return false;
      } else if (filterStatus === 'All') {
        if (ord.status === 'Cancelled' || ord.status === 'CANCELLED') return false;
      } else if (filterStatus === 'Received') {
        if (!['Received', 'Pending', 'PREPRESS_CHECK', 'QUOTATION'].includes(ord.status)) return false;
      } else if (filterStatus === 'Printing') {
        if (!['Printing', 'Cutting', 'IN_PRODUCTION'].includes(ord.status)) return false;
      } else if (filterStatus === 'Ready') {
        if (!['Ready', 'READY_FOR_PICKUP'].includes(ord.status)) return false;
      } else if (filterStatus === 'Delivered') {
        if (!['Delivered', 'COMPLETED'].includes(ord.status)) return false;
      } else if (filterStatus === 'Cancelled') {
        if (!['Cancelled', 'CANCELLED'].includes(ord.status)) return false;
      } else {
        if (ord.status !== filterStatus) return false;
      }

      // 2. Search query matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const anyOrd = ord as any;
        const idMatch = String(ord.id || '').toLowerCase().includes(q) || String(anyOrd.orderNo || '').toLowerCase().includes(q);
        const nameMatch = String(ord.customerName || anyOrd.customer_name || anyOrd.customer || '').toLowerCase().includes(q);
        const phoneMatch = String(ord.customerPhone || anyOrd.phone || anyOrd.customer_phone || '').toLowerCase().includes(q);
        const trackingMatch = String(ord.trackingNumber || anyOrd.trackingNo || '').toLowerCase().includes(q);
        const addressMatch = String(anyOrd.address || anyOrd.delivery_address || '').toLowerCase().includes(q);
        const itemsMatch = Array.isArray(ord.items) && ord.items.some((it: any) => 
          String(it.name || it.job_name || '').toLowerCase().includes(q)
        );

        if (!idMatch && !nameMatch && !phoneMatch && !trackingMatch && !addressMatch && !itemsMatch) {
          return false;
        }
      }

      // 3. Date range matching
      const anyOrd = ord as any;
      if (!isWithinDatePreset(ord.createdTime || anyOrd.date || anyOrd.createdDate || '')) {
        return false;
      }

      // 4. Payment status filter
      if (paymentFilter !== 'all') {
        const pStatus = ord.paymentStatus || 'Pending';
        const isPaid = ['Paid', 'Fully Paid', 'PAID'].includes(pStatus) || ord.remainingUnpaidBalance === 0;
        const isDeposit = ['Deposit', 'Deposit Paid'].includes(pStatus) || (ord.depositAmountPaid > 0 && ord.remainingUnpaidBalance > 0);
        const isUnpaid = ['Unpaid', 'Pending', 'PENDING', 'Overdue'].includes(pStatus) && !isPaid && !isDeposit;

        if (paymentFilter === 'paid' && !isPaid) return false;
        if (paymentFilter === 'deposit' && !isDeposit) return false;
        if (paymentFilter === 'unpaid' && !isUnpaid) return false;
      }

      // 5. Courier / Delivery method filter
      if (courierFilter !== 'all') {
        const anyOrd = ord as any;
        const m = (ord.deliveryMethod || anyOrd.shippingCourier || ord.courier || '').toLowerCase();
        if (courierFilter === 'pickup') {
          if (!m.includes('pickup') && !m.includes('ຮັບເອງ')) return false;
        } else {
          if (!m.includes(courierFilter.toLowerCase())) return false;
        }
      }

      return true;
    });
  }, [orders, initialSubTab, filterStatus, searchQuery, isWithinDatePreset, paymentFilter, courierFilter]);

  const summaryMetrics = useMemo(() => {
    const totalCount = filteredOrders.length;
    const pendingCount = filteredOrders.filter(o => ['Received', 'Pending', 'PREPRESS_CHECK', 'QUOTATION'].includes(o.status)).length;
    const inProdCount = filteredOrders.filter(o => ['Printing', 'Cutting', 'IN_PRODUCTION'].includes(o.status)).length;
    const readyCount = filteredOrders.filter(o => ['Ready', 'READY_FOR_PICKUP'].includes(o.status)).length;
    const completedCount = filteredOrders.filter(o => ['Delivered', 'COMPLETED'].includes(o.status)).length;
    const totalRevenue = filteredOrders.reduce((sum, o: any) => sum + Number(o.totalPriceCharged || o.totalAmount || 0), 0);
    const totalUnpaid = filteredOrders.reduce((sum, o) => sum + Number(o.remainingUnpaidBalance || 0), 0);

    return {
      totalCount,
      pendingCount,
      inProdCount,
      readyCount,
      completedCount,
      totalRevenue,
      totalUnpaid
    };
  }, [filteredOrders]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDatePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setPaymentFilter('all');
    setCourierFilter('all');
    if (initialSubTab === 'orders') setFilterStatus('All');
  };

  const isAnyFilterActive = searchQuery !== '' || datePreset !== 'all' || paymentFilter !== 'all' || courierFilter !== 'all' || (filterStatus !== 'All' && initialSubTab === 'orders');

  // Batch Operations State & Methods
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkShippingOrders, setBulkShippingOrders] = useState<any[] | null>(null);

  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleToggleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleBulkStatusChange = (newStatus: string) => {
    if (selectedOrderIds.length === 0) return;
    selectedOrderIds.forEach(id => {
      updateOrderStatus(id, newStatus);
    });
    showToast(`ອັບເດດສະຖານະ ${selectedOrderIds.length} ອໍເດີເປັນ [${newStatus}] ສຳເລັດແລ້ວ!`, 'success');
    setSelectedOrderIds([]);
  };

  const handleExportCSV = (customList?: any[]) => {
    const list = customList || (selectedOrderIds.length > 0 
      ? orders.filter(o => selectedOrderIds.includes(o.id))
      : filteredOrders);

    if (!list || list.length === 0) {
      showToast('ບໍ່ມີຂໍ້ມູນອໍເດີສຳລັບສົ່ງອອກ', 'warning');
      return;
    }

    const headers = [
      'Order ID',
      'Date',
      'Customer Name',
      'Phone',
      'Delivery Method',
      'Tracking Number',
      'Total Amount (LAK)',
      'Deposit Paid (LAK)',
      'Remaining Balance (LAK)',
      'Payment Status',
      'Production Status',
      'Items Summary',
      'Notes'
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = list.map(ord => {
      const itemsText = Array.isArray(ord.items) 
        ? ord.items.map((it: any) => `${it.name || it.job_name || 'Item'} x${it.quantity || 1}`).join('; ')
        : ord.product_name || 'Custom Print';

      return [
        escapeCSV(ord.orderNo || ord.id),
        escapeCSV(ord.date || ord.createdDate || ''),
        escapeCSV(ord.customerName || ord.customer_name || ''),
        escapeCSV(ord.phone || ord.customer_phone || ''),
        escapeCSV(ord.deliveryMethod || ord.shippingCourier || 'Pickup'),
        escapeCSV(ord.trackingNumber || ord.trackingNo || ''),
        escapeCSV(Number(ord.totalPriceCharged || ord.totalAmount || 0)),
        escapeCSV(Number(ord.depositAmountPaid || 0)),
        escapeCSV(Number(ord.remainingUnpaidBalance || 0)),
        escapeCSV(ord.paymentStatus || 'Pending'),
        escapeCSV(ord.status || 'Pending'),
        escapeCSV(itemsText),
        escapeCSV(ord.notes || ord.productionNotes || '')
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `som-sing-orders-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`ສົ່ງອອກລາຍງານ ${list.length} ອໍເດີເປັນ CSV ສຳເລັດ!`, 'success');
  };

  const handleBulkPrintShipping = () => {
    const selectedOrdersList = orders.filter(o => selectedOrderIds.includes(o.id));
    if (selectedOrdersList.length === 0) {
      showToast('ກະລຸນາເລືອກອໍເດີທີ່ຕ້ອງການພິມໃບປະໜ້າ', 'warning');
      return;
    }
    setBulkShippingOrders(selectedOrdersList);
  };

  const handleToggleDeliveryStatus = (orderId, currentStatus) => {
    const nextStatus = currentStatus === 'Delivered' ? 'Ready' : 'Delivered';
    updateOrderStatus(orderId, nextStatus);
    showToast(`ອັບເດດສະຖານະການຈັດສົ່ງເປັນ: ${nextStatus === 'Delivered' ? 'ສົ່ງມອບແລ້ວ (Delivered)' : 'ກຳລັງຂົນສົ່ງ (In Transit)'}`, 'success');
  };

  if (showQuotation) {
    return (
      <QuotationManager 
        prefilledSpecs={prefilledOrderSpecs}
        onConvertToOrder={(specs) => {
          setPrefilledOrderSpecs({ ...specs, isConvertedFromQuote: true });
          setIsAddOrderOpen(true);
          setShowQuotation(false);
        }} 
        onBack={() => setShowQuotation(false)}
      />
    );
  }

  if (isAddOrderOpen) {
    return (
      <CreateOrderPage
        onBack={() => { setIsAddOrderOpen(false); setPrefilledOrderSpecs(null); }}
        inventory={inventory}
        equipment={equipment}
        customers={customers}
        addCustomer={addCustomer}
        addOrder={addOrder}
        showToast={showToast}
        formatLAK={formatLAK}
        currentLang={currentLang}
        t={t}
        prefilledSpecs={prefilledOrderSpecs}
      />
    );
  }

  if (selectedOrder) {
    const currentOrder = orders.find(o => o.id === selectedOrder.id || (o as any).orderNo === (selectedOrder as any).orderNo) || selectedOrder;

    return (
      <>
        {lightbox && (
          <Lightbox
            src={lightbox.src}
            title={lightbox.title}
            onClose={() => setLightbox(null)}
          />
        )}
        {editModalOrder && (
          <EditOrderModal
            isOpen={!!editModalOrder}
            onClose={() => setEditModalOrder(null)}
            order={editModalOrder}
            inventory={inventory}
            equipment={equipment}
            formatCurrency={formatLAK}
            onSave={(updated) => {
              if (updateOrderDetails) {
                updateOrderDetails(updated.id, updated);
              }
              setSelectedOrder(updated);
              setEditModalOrder(null);
              showToast(currentLang === 'lo' ? 'ອັບເດດລາຍລະອຽດອໍເດີສຳເລັດ!' : 'Order details updated successfully!', 'success');
            }}
          />
        )}
        {activeOrderStep === 1 && (
          <OrderReceptionPage
            order={currentOrder}
            onBack={() => setSelectedOrder(null)}
            onSelectStep={(step) => setActiveOrderStep(step)}
            formatLAK={formatLAK}
            currentLang={currentLang}
            handleStatusChange={handleStatusChange}
            onUpdatePayment={updateOrderPaymentStatus}
            onUpdateOrder={(updated) => {
              if (updateOrderDetails) {
                updateOrderDetails(updated.id, updated);
              }
              setSelectedOrder(updated);
            }}
            showToast={showToast}
            setLightbox={setLightbox}
            onEditOrder={(ord) => setEditModalOrder(ord)}
          />
        )}
        {activeOrderStep === 2 && (
          <ProductionTrackingPage
            order={currentOrder}
            onBack={() => setSelectedOrder(null)}
            onSelectStep={(step) => setActiveOrderStep(step)}
            formatLAK={formatLAK}
            t={t}
            currentLang={currentLang}
            handleStatusChange={handleStatusChange}
            deleteOrder={deleteOrder}
            showToast={showToast}
            askConfirmation={askConfirmation}
            getStatusBadgeClass={getStatusBadgeClass}
            getStatusIcon={getStatusIcon}
            getPaymentStatusBadge={getPaymentStatusBadge}
            getPaymentStatusIcon={getPaymentStatusIcon}
            setLightbox={setLightbox}
            onEditOrder={(ord) => setEditModalOrder(ord)}
            onUpdateOrder={(updated) => {
              if (updateOrderDetails) {
                updateOrderDetails(updated.id, updated);
              }
              setSelectedOrder(updated);
            }}
          />
        )}
        {activeOrderStep === 3 && (
          <OrderDeliveryPage
            order={currentOrder}
            onBack={() => setSelectedOrder(null)}
            onSelectStep={(step) => setActiveOrderStep(step)}
            formatLAK={formatLAK}
            currentLang={currentLang}
            handleStatusChange={handleStatusChange}
            onUpdatePayment={updateOrderPaymentStatus}
            showToast={showToast}
            setLightbox={setLightbox}
            onEditOrder={(ord) => setEditModalOrder(ord)}
          />
        )}
        {activeOrderStep === 4 && (
          <OrderCompletedSummaryPage
            order={currentOrder}
            onBack={() => setSelectedOrder(null)}
            onSelectStep={(step) => setActiveOrderStep(step)}
            formatLAK={formatLAK}
            currentLang={currentLang}
            setLightbox={setLightbox}
            onEditOrder={(ord) => setEditModalOrder(ord)}
          />
        )}
      </>
    );
  }


  return (
    <div className="space-y-8 animate-fade-in print:hidden text-slate-800 w-full">
      {/* Dynamic Header Card based on subTab */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-primary-navy tracking-tight font-sans">
            {initialSubTab === 'production' && 'ຕິດຕາມການຜະລິດ (Production Tracker)'}
            {initialSubTab === 'deliveries' && 'ຕິດຕາມການຈັດສົ່ງ & ຊຳຣະເງິນ (Deliveries & Payment)'}
            {initialSubTab === 'completed' && 'ລາຍການຈັດສົ່ງສໍາເລັດ (Completed Orders)'}
            {initialSubTab === 'cancelled' && 'ລາຍການຍົກເລີກ (Cancelled Orders)'}
            {initialSubTab === 'orders' && t('orders.title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
            {initialSubTab === 'production' && 'ກວດສອບຈຳນວນຜະລິດ, ຄວາມຄືບໜ້າແຕ່ລະຂັ້ນຕອນ ແລະ ອັບເດດສະຖານະແທ່ນພິມ'}
            {initialSubTab === 'deliveries' && 'ຕິດຕາມການສົ່ງມອບສິນຄ້າ, ຊຳຣະຍອດຄ້າງ ແລະ ແຈ້ງອັບເດດສະຖານະການຂົນສົ່ງ'}
            {initialSubTab === 'completed' && 'ປະຫວັດອໍເດີທີ່ສົ່ງມອບສິນຄ້າ ແລະ ຊຳຣະເງິນຄົບ 100% ສຳເລັດແລ້ວ'}
            {initialSubTab === 'cancelled' && 'ລາຍການອໍເດີທີ່ຖືກຍົກເລີກ ພ້ອມໝາຍເຫດເຫດຜົນ'}
            {initialSubTab === 'orders' && t('orders.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={() => handleExportCSV()}
            className="flex items-center gap-2 px-4 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs sm:text-sm font-extrabold shadow-md transition active:scale-95 cursor-pointer"
            title="Export filtered orders to CSV / Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ສົ່ງອອກ CSV' : 'Export CSV'}</span>
          </button>
          {initialSubTab === 'orders' && (
            <button
              onClick={() => setShowQuotation(true)}
              className="flex items-center gap-2 px-5 py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-xs sm:text-sm font-extrabold shadow-md transition active:scale-95 cursor-pointer"
            >
              <Calculator className="w-4 h-4 animate-pulse" />
              <span>{currentLang === 'lo' ? 'ເຮັດໃບສະເໜີລາຄາ' : 'Create Quotation'}</span>
            </button>
          )}
          <button
            onClick={() => setIsAddOrderOpen(true)}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-accent-sky hover:bg-sky-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-sky-600/10 transition active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>{currentLang === 'lo' ? 'ເພີ່ມອໍເດີໃໝ່' : 'Add New Order'}</span>
          </button>
        </div>
      </div>

      {/* 1. Summary Metric KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Orders Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">{currentLang === 'lo' ? 'ອໍເດີທັງໝົດ' : 'Total Orders'}</span>
            <span className="p-1.5 rounded-xl bg-slate-100 text-slate-700"><Layers className="w-3.5 h-3.5" /></span>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">{summaryMetrics.totalCount}</span>
            <span className="text-[10px] text-slate-400 font-bold block">{currentLang === 'lo' ? 'ລາຍການໃນລະບົບ' : 'Filtered Items'}</span>
          </div>
        </div>

        {/* Pending / Received */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-600 uppercase">{currentLang === 'lo' ? 'ລໍຖ້າຮັບ/ກວດ' : 'Reception'}</span>
            <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600"><Clock className="w-3.5 h-3.5" /></span>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-blue-700 font-mono">{summaryMetrics.pendingCount}</span>
            <span className="text-[10px] text-slate-400 font-bold block">{currentLang === 'lo' ? 'ລໍຖ້າກວດໄຟລ໌/ມັດຈຳ' : 'Pending Slip'}</span>
          </div>
        </div>

        {/* In Production */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-600 uppercase">{currentLang === 'lo' ? 'ກຳລັງຜະລິດ' : 'In Production'}</span>
            <span className="p-1.5 rounded-xl bg-purple-50 text-purple-600"><Activity className="w-3.5 h-3.5 animate-pulse" /></span>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-purple-700 font-mono">{summaryMetrics.inProdCount}</span>
            <span className="text-[10px] text-slate-400 font-bold block">{currentLang === 'lo' ? 'ແທ່ນພິມ & ແປຮູບ' : 'Press & Finish'}</span>
          </div>
        </div>

        {/* Ready for Delivery */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase">{currentLang === 'lo' ? 'ລໍຖ້າຈັດສົ່ງ' : 'Ready'}</span>
            <span className="p-1.5 rounded-xl bg-amber-50 text-amber-700"><Truck className="w-3.5 h-3.5" /></span>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-amber-800 font-mono">{summaryMetrics.readyCount}</span>
            <span className="text-[10px] text-slate-400 font-bold block">{currentLang === 'lo' ? 'ແພັກແລ້ວ/ຂົນສົ່ງ' : 'Logistics Queue'}</span>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase">{currentLang === 'lo' ? 'ສົ່ງມອບສຳເລັດ' : 'Completed'}</span>
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /></span>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">{summaryMetrics.completedCount}</span>
            <span className="text-[10px] text-slate-400 font-bold block">{currentLang === 'lo' ? 'ຊຳຣະຄົບ 100%' : '100% Settled'}</span>
          </div>
        </div>

        {/* Total Revenue & Unpaid */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-amber-400 uppercase">{currentLang === 'lo' ? 'ຍອດຂາຍລວມ' : 'Revenue'}</span>
            <span className="p-1.5 rounded-xl bg-slate-800 text-amber-400"><Wallet className="w-3.5 h-3.5" /></span>
          </div>
          <div>
            <span className="text-base sm:text-lg font-black text-white font-mono block truncate">{formatLAK(summaryMetrics.totalRevenue)}</span>
            {summaryMetrics.totalUnpaid > 0 && (
              <span className="text-[10px] text-red-400 font-black block mt-0.5">
                ຄ້າງຊຳຣະ: {formatLAK(summaryMetrics.totalUnpaid)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Instant Search & Multi-Criteria Filter Controls */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        {/* Search row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={currentLang === 'lo' ? 'ຄົ້ນຫາຕາມ Order ID, ຊື່ລູກຄ້າ, ເບີໂທ, Tracking No, ຊື່ສິນຄ້າ...' : 'Search by Order ID, Customer, Phone, Tracking #, Item...'}
              className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-accent-sky focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition cursor-pointer border ${
              isFilterExpanded || (datePreset !== 'all' || paymentFilter !== 'all' || courierFilter !== 'all')
                ? 'bg-sky-50 text-sky-800 border-sky-200 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Filter className="w-4 h-4 text-sky-600" />
            <span>{currentLang === 'lo' ? 'ຕົວກັ່ນຕອງລະອຽດ' : 'Advanced Filters'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFilterExpanded ? 'rotate-180' : ''}`} />
          </button>

          {isAnyFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center justify-center gap-1.5 px-4 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-2xl text-xs sm:text-sm font-black transition active:scale-95 cursor-pointer"
              title="Reset all search and filter conditions"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{currentLang === 'lo' ? 'ລ້າງຕົວກັ່ນຕອງ' : 'Reset'}</span>
            </button>
          )}
        </div>

        {/* Expandable Advanced Filter Panel */}
        {isFilterExpanded && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in text-xs">
            {/* Date Presets & Custom Picker */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-600 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentLang === 'lo' ? 'ຊ່ວງວັນທີ (Date Range)' : 'Date Range'}</span>
              </label>
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'all', lo: 'ທັງໝົດ', en: 'All' },
                  { id: 'today', lo: 'ມື້ນີ້', en: 'Today' },
                  { id: 'this_week', lo: 'ອາທິດນີ້', en: 'This Week' },
                  { id: 'this_month', lo: 'ເດືອນນີ້', en: 'This Month' },
                  { id: 'custom', lo: 'ກຳນົດເອງ', en: 'Custom' },
                ].map(dp => (
                  <button
                    key={dp.id}
                    type="button"
                    onClick={() => setDatePreset(dp.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                      datePreset === dp.id 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {currentLang === 'lo' ? dp.lo : dp.en}
                  </button>
                ))}
              </div>

              {datePreset === 'custom' && (
                <div className="grid grid-cols-2 gap-2 pt-1 animate-fade-in">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block mb-0.5">ຈາກວັນທີ (From):</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block mb-0.5">ເຖິງວັນທີ (To):</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Payment Filter */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-600 uppercase flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentLang === 'lo' ? 'ສະຖານະການເງິນ (Payment)' : 'Payment Status'}</span>
              </label>
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'all', lo: 'ທັງໝົດ', en: 'All' },
                  { id: 'unpaid', lo: 'ຍັງບໍ່ຈ່າຍ', en: 'Unpaid' },
                  { id: 'deposit', lo: 'ມັດຈຳແລ້ວ', en: 'Deposit' },
                  { id: 'paid', lo: 'ຊຳຣະຄົບ 100%', en: 'Paid' },
                ].map(pf => (
                  <button
                    key={pf.id}
                    type="button"
                    onClick={() => setPaymentFilter(pf.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                      paymentFilter === pf.id 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {currentLang === 'lo' ? pf.lo : pf.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Logistics / Courier Filter */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-600 uppercase flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentLang === 'lo' ? 'ການຈັດສົ່ງ (Courier / Logistics)' : 'Logistics'}</span>
              </label>
              <select
                value={courierFilter}
                onChange={(e) => setCourierFilter(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:bg-white transition cursor-pointer"
              >
                <option value="all">{currentLang === 'lo' ? '-- ທຸກຊ່ອງທາງຈັດສົ່ງ --' : '-- All Couriers --'}</option>
                <option value="pickup">{currentLang === 'lo' ? 'ຮັບເອງທີ່ຮ້ານ (Store Pickup)' : 'Store Pickup'}</option>
                <option value="Anousith">Anousith Express</option>
                <option value="HAL">HAL Logistics</option>
                <option value="Menglong">Menglong Express</option>
                <option value="Mixay">Mixay Express</option>
                <option value="Kerry">Kerry Lao</option>
                {couriers && couriers.map((c: any) => (
                  <option key={c.id || c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Filter tab bar only on 'orders' tab */}
      {initialSubTab === 'orders' && (
        <div className="flex flex-wrap gap-1.5 p-1 bg-white rounded-2xl border border-slate-100 shadow-xs max-w-4xl">
          {statuses.map(st => {
            const isActive = filterStatus === st.id;
            const label = currentLang === 'lo' ? st.labelLo : st.labelEn;

            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setFilterStatus(st.id)}
                className={`
                  px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all min-h-[44px] cursor-pointer
                  ${isActive 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Delivery Custom Actions Table when in 'deliveries' tab */}
      {initialSubTab === 'deliveries' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
            ລາຍການຕິດຕາມການຈັດສົ່ງ & ຮັບເງິນມັດຈຳ (Delivery & Payment Tracker)
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-black uppercase border-b">
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">ລູກຄ້າ</th>
                  <th className="px-4 py-3 text-center">ສະຖານະຈັດສົ່ງ</th>
                  <th className="px-4 py-3 text-right">ຍອດຄ້າງຊຳຣະ</th>
                  <th className="px-4 py-3 text-center">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                {filteredOrders.map(ord => (
                  <tr key={ord.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3.5 font-mono font-black text-slate-900">#{ord.id}</td>
                    <td className="px-4 py-3.5">
                      <span className="block font-bold text-slate-900">{ord.customerName}</span>
                      <span className="block text-[10px] text-slate-400 font-sans">{ord.phone}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleDeliveryStatus(ord.id, ord.status)}
                        className={`px-3 py-1.5 rounded-xl font-black text-[11px] transition shadow-sm border flex items-center justify-center gap-1 mx-auto ${
                          ord.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        {ord.status === 'Delivered' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>ສົ່ງມອບແລ້ວ (Delivered)</span>
                          </>
                        ) : (
                          <span>ກຳລັງຂົນສົ່ງ (In Transit)</span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right font-sans">
                      {ord.remainingUnpaidBalance > 0 ? (
                        <span className="text-red-600 font-black">{formatLAK(ord.remainingUnpaidBalance)}</span>
                      ) : (
                        <span className="text-emerald-600 font-black inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>ຊຳຣະຄົບແລ້ວ</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center flex items-center justify-center gap-2">
                      {ord.remainingUnpaidBalance > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(ord);
                            setSettleAmount(ord.remainingUnpaidBalance);
                            setSettleStep(1);
                            setIsSettleOpen(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[11px] transition shadow-sm"
                        >
                          ຊຳຣະຍອດຄ້າງ
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(ord)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-[11px] transition"
                      >
                        ເບິ່ງລາຍລະອຽດ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Table Component */}
      {initialSubTab !== 'deliveries' && (
        <OrdersTable
          filteredOrders={filteredOrders}
          selectedOrder={selectedOrder}
          selectedOrderIds={selectedOrderIds}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleSelectOrder={handleToggleSelectOrder}
          focusRef={focusRef}
          currentLang={currentLang}
          formatLAK={formatLAK}
          t={t}
          getStatusBadgeClass={getStatusBadgeClass}
          getStatusIcon={getStatusIcon}
          getPaymentStatusBadge={getPaymentStatusBadge}
          getPaymentStatusIcon={getPaymentStatusIcon}
          onViewDetails={setSelectedOrder}
          onPrintShippingLabel={(ord) => setShippingLabelOrder(ord)}
          onEditOrder={(ord) => setEditModalOrder(ord)}
          onDeleteOrder={(ord) => {
            if (askConfirmation) {
              askConfirmation(
                `ທ່ານຕ້ອງການລົບອໍເດີ #${ord.orderNo || ord.id} ອອກຈາກລະບົບແທ້ບໍ? ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.`,
                () => deleteOrder(ord.id)
              );
            } else if (window.confirm(`ທ່ານຕ້ອງການລົບອໍເດີ #${ord.orderNo || ord.id} ແທ້ບໍ?`)) {
              deleteOrder(ord.id);
            }
          }}
          onResetFilters={handleResetFilters}
        />
      )}

      {/* Floating Batch / Bulk Action Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-6 py-3.5 rounded-3xl shadow-2xl border border-slate-700/60 flex items-center gap-4 animate-fade-in flex-wrap justify-center">
          <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
            <CheckSquare className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-black">
              {currentLang === 'lo' ? `ເລືອກແລ້ວ ${selectedOrderIds.length} ອໍເດີ` : `${selectedOrderIds.length} Orders Selected`}
            </span>
          </div>

          {/* Bulk Shipping Print */}
          <button
            type="button"
            onClick={handleBulkPrintShipping}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black transition active:scale-95 cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{currentLang === 'lo' ? 'ພິມໃບປະໜ້າລວມ' : 'Bulk Print Labels'}</span>
          </button>

          {/* Batch Status Update Select */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold uppercase">{currentLang === 'lo' ? 'ປ່ຽນສະຖານະ:' : 'Status:'}</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatusChange(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="bg-transparent text-xs font-bold text-sky-300 focus:outline-none cursor-pointer"
            >
              <option value="" disabled className="bg-slate-900 text-slate-400">-- ເລືອກສະຖານະ --</option>
              <option value="PREPRESS_CHECK" className="bg-slate-900 text-white">Pre-Press Check (ກວດໄຟລ໌)</option>
              <option value="Printing" className="bg-slate-900 text-white">Printing / In Prod (ກຳລັງພິມ)</option>
              <option value="Ready" className="bg-slate-900 text-white">Ready (ພ້ອມຈັດສົ່ງ)</option>
              <option value="Delivered" className="bg-slate-900 text-white">Delivered (ສົ່ງມອບແລ້ວ)</option>
              <option value="Cancelled" className="bg-slate-900 text-red-400">Cancelled (ຍົກເລີກ)</option>
            </select>
          </div>

          {/* Bulk Export */}
          <button
            type="button"
            onClick={() => handleExportCSV()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{currentLang === 'lo' ? 'Export CSV' : 'Export CSV'}</span>
          </button>

          {/* Clear Selection */}
          <button
            type="button"
            onClick={() => setSelectedOrderIds([])}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition hover:bg-slate-800 cursor-pointer"
            title="Clear Selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit Order Specs & Info Modal */}
      {editModalOrder && (
        <EditOrderModal
          isOpen={!!editModalOrder}
          onClose={() => setEditModalOrder(null)}
          order={editModalOrder}
          inventory={inventory}
          equipment={equipment}
          formatCurrency={formatLAK}
          onSave={(updated) => {
            if (updateOrderDetails) {
              updateOrderDetails(updated.id, updated);
            }
            if (selectedOrder && (selectedOrder.id === updated.id || selectedOrder.orderNo === updated.orderNo)) {
              setSelectedOrder(updated);
            }
            setEditModalOrder(null);
            showToast(currentLang === 'lo' ? 'ອັບເດດລາຍລະອຽດອໍເດີສຳເລັດ!' : 'Order details updated successfully!', 'success');
          }}
        />
      )}

      {/* Artwork Viewer & Download per Job Modal */}
      {artworkModalOrder && (
        <ArtworkViewerModal
          isOpen={!!artworkModalOrder}
          onClose={() => setArtworkModalOrder(null)}
          order={artworkModalOrder}
          currentLang={currentLang}
          showToast={showToast}
        />
      )}

      {/* Shipping Label Modal (Single & Bulk) */}
      {(shippingLabelOrder || bulkShippingOrders) && (
        <ShippingLabelModal
          isOpen={!!shippingLabelOrder || !!bulkShippingOrders}
          onClose={() => {
            setShippingLabelOrder(null);
            setBulkShippingOrders(null);
          }}
          orders={bulkShippingOrders || (shippingLabelOrder ? [shippingLabelOrder] : [])}
        />
      )}

      {/* Quick Tracking Modal */}
      {trackingModalOrder && (
        <QuickTrackingModal
          isOpen={!!trackingModalOrder}
          onClose={() => setTrackingModalOrder(null)}
          order={trackingModalOrder}
          couriers={couriers}
          onSaveTracking={(orderId, courierName, trackingNum, fee, branchCode) => {
            if (updateOrderTracking) {
              updateOrderTracking(orderId, courierName, trackingNum, fee, branchCode);
            }
          }}
        />
      )}

      {/* Submit Quotation Modal */}
      {quoteModalOrder && (
        <SubmitQuotationModal
          order={quoteModalOrder}
          isOpen={!!quoteModalOrder}
          onClose={() => setQuoteModalOrder(null)}
          onSubmitQuotation={(orderId, amount, notes) => {
            const target = orders.find(o => o.id === orderId);
            if (target) {
              target.totalPriceCharged = amount;
              target.remainingUnpaidBalance = amount - (target.depositAmountPaid || 0);
              showToast(`ສົ່ງໃບສະເໜີລາຄາຈຳນວນ ${formatLAK(amount)} ຮຽບຮ້ອຍແລ້ວ!`, 'success');
            }
          }}
          formatCurrency={formatLAK}
        />
      )}

      {/* Lightbox Modal */}
      {lightbox && (
        <Lightbox
          src={lightbox.src}
          title={lightbox.title}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Order Details Interactive Modal Overlay */}
      {selectedOrder && (
        <OrderDetailsModal 
          order={orders.find(o => o.id === selectedOrder.id) || selectedOrder} 
          onBack={() => setSelectedOrder(null)} 
          formatLAK={formatLAK}
          t={t}
          currentLang={currentLang}
          handleStatusChange={handleStatusChange}
          handlePreflightToggle={handlePreflightToggle}
          deleteOrder={deleteOrder}
          showToast={showToast}
          askConfirmation={askConfirmation}
          setLightbox={setLightbox}
          setIsSettleOpen={setIsSettleOpen}
          setSettleAmount={setSettleAmount}
          setSettleStep={setSettleStep}
          getStatusBadgeClass={getStatusBadgeClass}
          getStatusIcon={getStatusIcon}
          getPaymentStatusBadge={getPaymentStatusBadge}
          getPaymentStatusIcon={getPaymentStatusIcon}
          viewMode={initialSubTab}
          updateProductionStep={updateProductionStep}
          addSpoilageLog={addSpoilageLog}
          inventory={inventory}
          onEditOrder={(ord) => setEditModalOrder(ord)}
        />
      )}

      {/* STEP-BY-STEP BALANCE SETTLEMENT DIALOG */}
      {isSettleOpen && selectedOrder && (
        <dialog
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-transparent outline-none border-none w-full h-full"
          open
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsSettleOpen(false)} />
          
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 z-10 border border-slate-100 animate-fade-in flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b pb-4 mb-5">
                <div>
                  <span className="text-xs uppercase font-extrabold text-emerald-600 tracking-wider font-sans">
                    {t('orders.step')} {settleStep} {t('orders.of')} 2
                  </span>
                  <h3 className="text-lg font-black text-primary-navy mt-1">
                    {t('orders.settle_title')}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsSettleOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2 mb-6">
                {[1, 2].map(st => (
                  <div 
                    key={st} 
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${st <= settleStep ? 'bg-emerald-500' : 'bg-slate-100'}`}
                  />
                ))}
              </div>

              <form onSubmit={handleSettleSubmit} className="space-y-4 text-xs sm:text-sm">
                {settleStep === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('orders.unpaid_balance')}</label>
                      <p className="text-lg font-black text-red-600 font-sans bg-red-50/50 p-4 rounded-2xl border border-red-100">
                        {formatLAK(selectedOrder.remainingUnpaidBalance)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('orders.amount_to_pay')} *</label>
                      <input
                        type="number"
                        required
                        min="1000"
                        max={selectedOrder.remainingUnpaidBalance}
                        value={settleAmount}
                        onChange={(e) => setSettleAmount(Number(e.target.value))}
                        className="w-full min-h-[50px] px-4 py-3 border-2 rounded-2xl focus:outline-none text-base font-black font-sans text-slate-900"
                      />

                      <div className="flex gap-2 pt-1.5">
                        <button
                          type="button"
                          onClick={() => applySettlePreset(50)}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border rounded-xl text-xs font-bold transition active:scale-95"
                        >
                          {t('orders.pay_50')}
                        </button>
                        <button
                          type="button"
                          onClick={() => applySettlePreset(100)}
                          className="px-4 py-2.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition active:scale-95"
                        >
                          {t('orders.pay_100')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {settleStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('orders.payment_method')}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['BCEL One', 'Cash', 'Transfer'].map(method => {
                          const active = settleMethod === method;
                          return (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setSettleMethod(method)}
                              className={`p-3 border-2 rounded-xl font-bold text-xs transition flex flex-col items-center justify-center gap-1.5 ${
                                active 
                                  ? 'border-accent-sky bg-blue-50/50 text-primary-navy shadow-sm' 
                                  : 'border-slate-200 hover:border-slate-300 text-slate-500 bg-white'
                              }`}
                            >
                              <span>{method}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Slip Reference Note</label>
                      <input
                        type="text"
                        value={settleSlip}
                        onChange={(e) => setSettleSlip(e.target.value)}
                        placeholder="Note or reference..."
                        className="w-full px-3 py-2 border-2 rounded-xl focus:outline-none text-xs font-bold"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  {settleStep === 2 && (
                    <button
                      type="button"
                      onClick={() => setSettleStep(1)}
                      className="px-4 py-2 border rounded-xl text-slate-500 hover:bg-slate-50 text-xs font-bold transition"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsSettleOpen(false)}
                    className="px-4 py-2 border rounded-xl text-slate-400 hover:bg-slate-50 text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  {settleStep === 1 ? (
                    <button
                      type="button"
                      onClick={() => setSettleStep(2)}
                      className="px-5 py-2 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition shadow-md"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                    >
                      Settle Balance
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
