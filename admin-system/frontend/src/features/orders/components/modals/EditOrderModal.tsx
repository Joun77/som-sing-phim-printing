import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Link as LinkIcon, 
  FileText, 
  Printer, 
  DollarSign, 
  Save, 
  Sparkles, 
  Layers, 
  CreditCard,
  Plus,
  Trash2,
  AlertCircle,
  ShieldCheck,
  Truck,
  Store,
  CheckCircle2,
  Clock,
  Lock,
  Tag,
  Scissors,
  Percent,
  Check,
  Copy,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Coins,
  Palette,
  Eye,
  FileCheck2
} from 'lucide-react';
import { FormModalTemplate } from '../../../../components/common/FormModalTemplate';
import ItemSpecConfigurator, { calculateItemCosting } from '../ItemSpecConfigurator';
import { PreflightItemCreationModal } from '../../../../components/PreflightItemCreationModal';
import { useApp } from '@store/AppContext';
import type { PreflightResult } from '../../types';

export interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSave: (updatedOrder: any) => void;
  inventory?: any[];
  equipment?: any[];
  formatCurrency?: (val: number) => string;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onSave,
  inventory = [],
  equipment = [],
  formatCurrency = (v) => `${Number(v || 0).toLocaleString()} ₭`
}) => {
  const { offcuts = [] } = useApp();
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeJobIndex, setActiveJobIndex] = useState<number>(0);

  // Preflight & Color Analyzer Modal State
  const [isPreflightModalOpen, setIsPreflightModalOpen] = useState<boolean>(false);
  const [preflightTargetIndex, setPreflightTargetIndex] = useState<number | null>(null);
  
  // STEP 1: Customer & Delivery State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<'Pickup' | 'Courier'>('Pickup');
  const [courierName, setCourierName] = useState<string>('Anousith Express');
  const [courierBranch, setCourierBranch] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [artworkLink, setArtworkLink] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');

  // STEP 2: Items & Specs State
  const [items, setItems] = useState<any[]>([]);

  // STEP 3: Financial & Status State
  const [status, setStatus] = useState<string>('Received');
  const [paymentStatus, setPaymentStatus] = useState<string>('Unpaid');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(0);

  // In-Production Stock Guard Detection
  const isInProduction = useMemo(() => {
    if (!order) return false;
    const currentStatus = order.status || order.overall_status || '';
    return (
      order.stockDeducted === true ||
      ['IN_PRODUCTION', 'Printing', 'Cutting', 'READY_FOR_PICKUP', 'Ready', 'DELIVERED', 'Delivered', 'COMPLETED'].includes(currentStatus)
    );
  }, [order]);

  useEffect(() => {
    if (order) {
      setCustomerName(order.customerName || order.customer_name || order.customer || '');
      setCustomerPhone(order.phone || order.customer_phone || order.customerPhone || '');
      setCustomerAddress(order.customerAddress || order.address || '');
      
      const delMethod = (order.deliveryMethod === 'Courier' || order.courier || order.trackingNumber || order.trackingNo) ? 'Courier' : 'Pickup';
      setDeliveryMethod(delMethod);
      setCourierName(order.courier || order.courierName || 'Anousith Express');
      setCourierBranch(order.courierBranch || order.courierBranchCode || order.branchCode || '');
      setTrackingNumber(order.trackingNumber || order.trackingNo || '');
      setDeliveryDate(order.promisedDeliveryDate || order.delivery_date || order.dueDate || '');
      setArtworkLink(order.artworkLink || order.google_drive_link || order.driveLink || '');
      setOrderNotes(order.notes || order.orderNotes || '');

      setStatus(order.status || order.overall_status || 'Received');
      setPaymentStatus(order.paymentStatus || order.payment_status || 'Unpaid');
      
      const discount = Number(order.discountAmount || order.discount || 0);
      const shipFee = Number(order.shippingFee || order.deliveryFee || 0);
      const total = Number(order.totalPriceCharged || order.totalAmount || order.total_amount_lak || order.total_price || 0);
      const deposit = Number(order.depositAmountPaid || order.deposit_amount || order.deposit_lak || 0);

      setDiscountAmount(discount);
      setShippingFee(shipFee);
      setTotalPrice(total);
      setDepositAmount(deposit);

      if (Array.isArray(order.items) && order.items.length > 0) {
        setItems(order.items.map((it: any, idx: number) => {
          const qty = Number(it.quantity || it.printVolume || 1);
          const costing = calculateItemCosting(it, inventory, equipment);
          return {
            ...it,
            id: it.id || `item-${idx + 1}`,
            name: it.name || it.item_name || it.job_name || `Job #${idx + 1}`,
            quantity: qty,
            jobWidth: Number(it.jobWidth || it.width_mm || 210),
            jobHeight: Number(it.jobHeight || it.height_mm || 297),
            paperSize: it.paperSize || it.paper_size || 'A4',
            paperId: it.paperId || it.paperSku || (inventory.length > 0 ? inventory[0].id : 'paper-a4-plain-70g'),
            colorMode: it.colorMode || (it.colorPrintMode === 'MONO_K' ? 'Monochrome' : 'Color CMYK'),
            colorPrintMode: it.colorPrintMode || 'COLOR_CMYK',
            printerId: it.printerId || it.printer || (equipment.length > 0 ? equipment[0].id : 'KM-C6085'),
            bindingMethod: it.bindingMethod || it.binding_type || 'none',
            coating: it.coating || it.lamination || 'none',
            unitPrice: it.unitPrice !== undefined ? Number(it.unitPrice) : costing.unitPrice,
            totalPrice: it.totalPrice !== undefined ? Number(it.totalPrice) : costing.finalPrice,
            targetMarginPercent: it.targetMarginPercent || it.profitMargin || 35,
            profitMargin: it.profitMargin || it.targetMarginPercent || 35,
          };
        }));
      } else {
        const defaultItem = {
          id: 'item-1',
          name: order.jobName || order.product_name || 'ງານພິມດິຈິຕອນ (Print Job)',
          quantity: Number(order.quantity || 1),
          jobWidth: 210,
          jobHeight: 297,
          paperSize: 'A4',
          paperId: inventory.length > 0 ? inventory[0].id : 'paper-a4-plain-70g',
          colorMode: 'Color CMYK',
          colorPrintMode: 'COLOR_CMYK',
          printerId: equipment.length > 0 ? equipment[0].id : 'KM-C6085',
          bindingMethod: 'none',
          coating: 'none',
          unitPrice: total || 15000,
          totalPrice: total || 15000,
          targetMarginPercent: 35,
          profitMargin: 35,
        };
        setItems([defaultItem]);
      }
      setActiveJobIndex(0);
      setActiveStep(1);
    }
  }, [order, isOpen]);

  // Handle updates from ItemSpecConfigurator for the active job
  const handleActiveJobConfigChange = (updatedJob: any) => {
    if (isInProduction) return;
    setItems(prev => {
      const next = [...prev];
      const costing = calculateItemCosting(updatedJob, inventory, equipment);
      next[activeJobIndex] = {
        ...updatedJob,
        unitPrice: costing.unitPrice,
        totalPrice: costing.finalPrice,
        costingDetails: costing
      };
      return next;
    });
  };

  const handleAddJob = () => {
    if (isInProduction) return;
    const newJobIndex = items.length;
    const newItem = {
      id: `job-${Date.now().toString().slice(-4)}`,
      name: `Job #${newJobIndex + 1}: ງານພິມໃໝ່`,
      quantity: 100,
      jobWidth: 210,
      jobHeight: 297,
      paperSize: 'A4',
      paperId: inventory.length > 0 ? inventory[0].id : 'paper-a4-plain-70g',
      colorMode: 'Color CMYK',
      colorPrintMode: 'COLOR_CMYK',
      printerId: equipment.length > 0 ? equipment[0].id : 'KM-C6085',
      bindingMethod: 'none',
      coating: 'none',
      targetMarginPercent: 35,
      profitMargin: 35,
      unitPrice: 2500,
      totalPrice: 250000
    };
    setItems(prev => [...prev, newItem]);
    setActiveJobIndex(newJobIndex);
  };

  const handleDuplicateJob = (index: number) => {
    if (isInProduction) return;
    const source = items[index];
    if (!source) return;
    const cloned = {
      ...source,
      id: `job-${Date.now().toString().slice(-4)}`,
      name: `${source.name || 'Job'} (ສຳເນົາ)`
    };
    setItems(prev => [...prev, cloned]);
    setActiveJobIndex(items.length);
  };

  const handleRemoveJob = (index: number) => {
    if (isInProduction || items.length <= 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
    setActiveJobIndex(prev => Math.max(0, prev - 1));
  };

  // Open Preflight Color Analyzer Modal for specific job or new job
  const handleOpenPreflightForJob = (targetIndex: number | null) => {
    if (isInProduction) return;
    setPreflightTargetIndex(targetIndex);
    setIsPreflightModalOpen(true);
  };

  // Apply Preflight Color Analysis Results to Job
  const handleConfirmPreflight = (pfResult: PreflightResult) => {
    const rawName = pfResult.file_name ? pfResult.file_name.replace(/\.[^/.]+$/, '') : `Job #${items.length + 1}`;
    const cleanName = rawName.replace(/_+/g, ' ');

    const isMonoOnly = (pfResult.color_pages_count || 0) === 0 && (pfResult.mono_pages_count || 0) > 0;
    const detectedColorMode = isMonoOnly ? 'MONO_K' : 'COLOR_CMYK';
    const totalPages = pfResult.total_pages || 1;
    const colorPages = pfResult.color_pages_count || (isMonoOnly ? 0 : totalPages);
    const monoPages = pfResult.mono_pages_count || (isMonoOnly ? totalPages : 0);

    const cCov = pfResult.color_pages_avg_c || pfResult.avg_cov_c || 5;
    const mCov = pfResult.color_pages_avg_m || pfResult.avg_cov_m || 5;
    const yCov = pfResult.color_pages_avg_y || pfResult.avg_cov_y || 5;
    const kCov = (pfResult.color_pages_count || 0) > 0 ? (pfResult.color_pages_avg_k || 15) : (pfResult.mono_pages_avg_k || pfResult.avg_cov_k || 10);
    const totalInkCov = Math.round(cCov + mCov + yCov + kCov);

    if (preflightTargetIndex !== null && items[preflightTargetIndex]) {
      // Update existing Job with scanned color values & specs
      setItems(prev => {
        const next = [...prev];
        const current = next[preflightTargetIndex];
        const updated = {
          ...current,
          name: current.name?.startsWith('Job #') ? cleanName : current.name,
          fileName: pfResult.file_name,
          fileUrl: pfResult.file_url || current.fileUrl,
          pagesPerBook: totalPages,
          colorPages,
          bwPages: monoPages,
          jobWidth: pfResult.target_width_mm || current.jobWidth || 210,
          jobHeight: pfResult.target_height_mm || current.jobHeight || 297,
          paperSize: pfResult.target_paper_size || current.paperSize || 'A4',
          colorPrintMode: detectedColorMode,
          colorMode: isMonoOnly ? 'Monochrome' : 'Color CMYK',
          cCoverage: cCov,
          mCoverage: mCov,
          yCoverage: yCov,
          kCoverage: kCov,
          inkCoverage: totalInkCov,
        };
        const costing = calculateItemCosting(updated, inventory, equipment);
        next[preflightTargetIndex] = {
          ...updated,
          unitPrice: costing.unitPrice,
          totalPrice: costing.finalPrice,
          costingDetails: costing
        };
        return next;
      });
      setActiveJobIndex(preflightTargetIndex);
    } else {
      // Add new Job from preflight
      const newJobIndex = items.length;
      const newItem = {
        id: `job-${Date.now().toString().slice(-4)}`,
        name: cleanName,
        fileName: pfResult.file_name,
        fileUrl: pfResult.file_url,
        quantity: 100,
        pagesPerBook: totalPages,
        colorPages,
        bwPages: monoPages,
        jobWidth: pfResult.target_width_mm || 210,
        jobHeight: pfResult.target_height_mm || 297,
        paperSize: pfResult.target_paper_size || 'A4',
        paperId: inventory.length > 0 ? inventory[0].id : 'paper-a4-plain-70g',
        colorMode: isMonoOnly ? 'Monochrome' : 'Color CMYK',
        colorPrintMode: detectedColorMode,
        cCoverage: cCov,
        mCoverage: mCov,
        yCoverage: yCov,
        kCoverage: kCov,
        inkCoverage: totalInkCov,
        printerId: equipment.length > 0 ? equipment[0].id : 'KM-C6085',
        bindingMethod: 'none',
        coating: 'none',
        targetMarginPercent: 35,
        profitMargin: 35,
        unitPrice: 2500,
        totalPrice: 250000
      };
      const costing = calculateItemCosting(newItem, inventory, equipment);
      newItem.unitPrice = costing.unitPrice;
      newItem.totalPrice = costing.finalPrice;

      setItems(prev => [...prev, newItem]);
      setActiveJobIndex(newJobIndex);
    }

    setIsPreflightModalOpen(false);
  };

  // Recalculate Combined Items Subtotal & Direct Costs
  const combinedCostSummary = useMemo(() => {
    let totalSellingPrice = 0;
    let totalDirectCost = 0;
    let totalPaperCost = 0;
    let totalInkCost = 0;
    let totalFinishingCost = 0;
    let totalMachineOverhead = 0;

    items.forEach(it => {
      const costing = calculateItemCosting(it, inventory, equipment);
      totalDirectCost += costing.directCost || costing.netCost || 0;
      totalPaperCost += costing.totalPaperCost || 0;
      totalInkCost += costing.totalInkCost || 0;
      totalFinishingCost += costing.totalFinishingCost || 0;
      totalMachineOverhead += costing.overheadCost || 0;
      totalSellingPrice += it.totalPrice !== undefined ? Number(it.totalPrice) : costing.finalPrice;
    });

    const netProfit = totalSellingPrice - totalDirectCost;
    const overallMargin = totalSellingPrice > 0 ? Math.round((netProfit / totalSellingPrice) * 100) : 0;

    return {
      totalSellingPrice,
      totalDirectCost,
      totalPaperCost,
      totalInkCost,
      totalFinishingCost,
      totalMachineOverhead,
      netProfit,
      overallMargin
    };
  }, [items, inventory, equipment]);

  // Update total price when items, shipping, or discount changes
  useEffect(() => {
    const grand = Math.max(0, combinedCostSummary.totalSellingPrice + shippingFee - discountAmount);
    setTotalPrice(grand);
  }, [combinedCostSummary.totalSellingPrice, shippingFee, discountAmount]);

  const remainingBalance = Math.max(0, totalPrice - depositAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('ກະລຸນາໃສ່ຊື່ລູກຄ້າ');
      return;
    }

    const updatedOrder = {
      ...order,
      customerName: customerName.trim(),
      customer_name: customerName.trim(),
      customerPhone: customerPhone.trim(),
      phone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      address: customerAddress.trim(),
      deliveryMethod,
      courier: deliveryMethod === 'Courier' ? courierName : 'Pickup',
      courierName: deliveryMethod === 'Courier' ? courierName : 'Pickup',
      courierBranch: deliveryMethod === 'Courier' ? courierBranch : '',
      trackingNumber: deliveryMethod === 'Courier' ? trackingNumber : '',
      trackingNo: deliveryMethod === 'Courier' ? trackingNumber : '',
      promisedDeliveryDate: deliveryDate,
      delivery_date: deliveryDate,
      artworkLink: artworkLink.trim(),
      google_drive_link: artworkLink.trim(),
      notes: orderNotes.trim(),
      orderNotes: orderNotes.trim(),
      status,
      overall_status: status,
      paymentStatus,
      payment_status: paymentStatus,
      discountAmount: Number(discountAmount) || 0,
      discount: Number(discountAmount) || 0,
      shippingFee: Number(shippingFee) || 0,
      deliveryFee: Number(shippingFee) || 0,
      subtotalAmount: combinedCostSummary.totalSellingPrice,
      totalPriceCharged: totalPrice,
      totalAmount: totalPrice,
      total_amount_lak: totalPrice,
      total_price: totalPrice,
      depositAmountPaid: Number(depositAmount) || 0,
      deposit_amount: Number(depositAmount) || 0,
      remainingUnpaidBalance: remainingBalance,
      items: items.map(it => {
        const costing = calculateItemCosting(it, inventory, equipment);
        return {
          ...it,
          unitPrice: it.unitPrice || costing.unitPrice,
          totalPrice: it.totalPrice || costing.finalPrice,
          unit_price_lak: it.unitPrice || costing.unitPrice,
          total_price_lak: it.totalPrice || costing.finalPrice,
          directCost: costing.directCost,
          paperCost: costing.totalPaperCost,
          inkCost: costing.totalInkCost,
          finishingCost: costing.totalFinishingCost,
        };
      })
    };

    onSave(updatedOrder);
    onClose();
  };

  if (!isOpen || !order) return null;

  const orderIdDisplay = order.orderNo || order.order_no || order.orderNumber || order.id || 'ORDER';

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<FileText className="w-6 h-6" />}
      title="ແກ້ໄຂຂໍ້ມູນອໍເດີ & ສະເປກລາຄາ (Edit Order & Pricing Specs)"
      subtitle={`Order #${orderIdDisplay} • ${customerName || 'Customer'}`}
      badgeText={isInProduction ? 'IN PRODUCTION (LOCKED)' : 'EDITABLE'}
      maxWidthClass="max-w-6xl"
      footerActions={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {activeStep > 1 && (
              <button
                type="button"
                onClick={() => setActiveStep(p => p - 1)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>ຍ້ອນກັບ (Back)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer"
            >
              ປິດ (Close)
            </button>

            {activeStep < 3 ? (
              <button
                type="button"
                onClick={() => setActiveStep(p => p + 1)}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer border-none"
              >
                <span>ຕໍ່ໄປ (Next Step)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer border-none"
              >
                <Save className="w-4 h-4" />
                <span>ບັນທຶກການແກ້ໄຂອໍເດີ (Save Changes)</span>
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        
        {/* 3-Step Navigation Bar */}
        <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              activeStep === 1 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>1. ຂໍ້ມູນລູກຄ້າ & ຈັດສົ່ງ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              activeStep === 2 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. ລາຍການສິນຄ້າ & ສະເປກລາຄາ ({items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              activeStep === 3 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>3. ສະຫຼຸບການເງິນ & ສະຖານະ</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: CUSTOMER & DELIVERY CONFIGURATION                                  */}
        {/* ========================================================================= */}
        {activeStep === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="w-4 h-4 text-blue-600" />
                <span>ຂໍ້ມູນຜູ້ສັ່ງຊື້ (Customer Profile)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ຊື່ລູກຄ້າ / ຊື່ບໍລິສັດ *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="ຕົວຢ່າງ: ທ່ານ ສົມສັກ ຫຼື ບໍລິສັດ ABC"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ເບີໂທຕິດຕໍ່ *</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="020 xxxx xxxx"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:border-blue-500 transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ສະຖານທີ່ຈັດສົ່ງ / ທີ່ຢູ່ລູກຄ້າ</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="ບ້ານ, ເມືອງ, ແຂວງ"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Delivery & Logistics */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Truck className="w-4 h-4 text-amber-600" />
                <span>ຮູບແບບການຈັດສົ່ງ & ກຳນົດສົ່ງ (Delivery Logistics)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ວິທີການຈັດສົ່ງ</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('Pickup')}
                      className={`p-3 rounded-2xl border text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                        deliveryMethod === 'Pickup'
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Store className="w-4 h-4" />
                      <span>ຮັບເອງທີ່ຮ້ານ (Pickup)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('Courier')}
                      className={`p-3 rounded-2xl border text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                        deliveryMethod === 'Courier'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      <span>ຈັດສົ່ງຜ່ານຂົນສົ່ງ (Courier)</span>
                    </button>
                  </div>
                </div>

                {deliveryMethod === 'Courier' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">ບໍລິສັດຂົນສົ່ງ</label>
                      <input
                        type="text"
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                        placeholder="Anousith Express, HAL, Menglong, etc."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">ສາຂາປາຍທາງ (Branch)</label>
                      <input
                        type="text"
                        value={courierBranch}
                        onChange={(e) => setCourierBranch(e.target.value)}
                        placeholder="ຕົວຢ່າງ: ສາຂາດົງໂດກ / ສາຂາປາກເຊ"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-500 transition"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">ເລກຕິດຕາມພັດສະດຸ (Tracking No.)</label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="ANS-88992200"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:border-blue-500 transition"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ກຳນົດສົ່ງມອບສິນຄ້າ (Promised Date)</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ລິ້ງໄຟລ໌ງານພິມ (Artwork Link)</label>
                  <input
                    type="url"
                    value={artworkLink}
                    onChange={(e) => setArtworkLink(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:border-blue-500 transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ໝາຍເຫດອໍເດີ (Order Notes)</label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="ລາຍລະອຽດເພີ່ມເຕີມສຳລັບຝ່າຍຜະລິດ..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: MULTI-JOB PRINT ITEMS & DEEP PRICING ENGINE (QUOTATION GRADE)     */}
        {/* ========================================================================= */}
        {activeStep === 2 && (
          <div className="space-y-5 animate-fade-in">
            
            {/* In-Production Stock Guard Alert */}
            {isInProduction && (
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block font-black">ອໍເດີນີ້ສັ່ງພິມ ແລະ ຕັດສະຕັອກແລ້ວ (In-Production Stock Guard)</strong>
                    <span className="text-[11px] text-purple-700">
                      ບໍ່ສາມາດແກ້ໄຂສະເປກວັດຖຸດິບ (ເຈ້ຍ, ໝຶກ, ຈຳນວນ) ເພື່ອປ້ອງກັນຂໍ້ມູນສະຕັອກຜິດພາດ.
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl bg-purple-200/80 text-purple-900 font-mono font-black text-[10px]">
                  LOCKED
                </span>
              </div>
            )}

            {/* Combined Cost Summary Bar across all Jobs */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 text-white shadow-md border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">Live Cost & Pricing Breakdown</span>
                    <h4 className="text-sm font-black text-slate-100">
                      ສະຫຼຸບຕົ້ນທຶນ & ລາຄາຂາຍລວມ ({items.length} Jobs)
                    </h4>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold">ມູນຄ່າສັ່ງພິມລວມ (Subtotal)</span>
                  <span className="text-lg font-black font-mono text-amber-400">
                    {formatCurrency(combinedCostSummary.totalSellingPrice)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">ຕົ້ນທຶນເຈ້ຍ (Paper):</span>
                  <strong className="text-slate-200 font-mono text-xs">{formatCurrency(combinedCostSummary.totalPaperCost)}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">ຕົ້ນທຶນໝຶກ (Ink):</span>
                  <strong className="text-slate-200 font-mono text-xs">{formatCurrency(combinedCostSummary.totalInkCost)}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">ຄ່າແປຮູບ (Finishing):</span>
                  <strong className="text-slate-200 font-mono text-xs">{formatCurrency(combinedCostSummary.totalFinishingCost)}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">ຕົ້ນທຶນລວມ (Cost):</span>
                  <strong className="text-slate-300 font-mono text-xs">{formatCurrency(combinedCostSummary.totalDirectCost)}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 block font-bold">ກຳໄລລວມ ({combinedCostSummary.overallMargin}%):</span>
                  <strong className="text-emerald-300 font-mono text-xs font-black">+{formatCurrency(combinedCostSummary.netProfit)}</strong>
                </div>
              </div>
            </div>

            {/* Multi-Job Tabs & Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 overflow-x-auto pb-1">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {items.map((job, idx) => (
                  <button
                    key={job.id || idx}
                    type="button"
                    onClick={() => setActiveJobIndex(idx)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shrink-0 ${
                      activeJobIndex === idx
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Job #{idx + 1}: {job.name || `Job #${idx + 1}`}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      activeJobIndex === idx ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
                    }`}>
                      x{job.quantity || 1}
                    </span>
                  </button>
                ))}
              </div>

              {!isInProduction && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Preflight & Color Analyzer Quick Trigger */}
                  <button
                    type="button"
                    onClick={() => handleOpenPreflightForJob(activeJobIndex)}
                    className="px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Scan customer artwork for CMYK coverage, page count, and dimensions"
                  >
                    <Palette className="w-3.5 h-3.5 text-purple-600" />
                    <span>ກວດຄ່າສີ & Preflight</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicateJob(activeJobIndex)}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Duplicate active job"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>ສຳເນົາ</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddJob}
                    className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-black transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ເພີ່ມ Job ໃໝ່</span>
                  </button>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveJob(activeJobIndex)}
                      className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs transition cursor-pointer"
                      title="Delete active job"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Smart Offcut Reclaim Suggestion Banner */}
            {(() => {
              const activeJob = items[activeJobIndex];
              if (!activeJob) return null;
              const jobW = Number(activeJob.jobWidth || (activeJob.paperSize === 'A5' ? 148 : activeJob.paperSize === 'A6' ? 105 : 210));
              const jobH = Number(activeJob.jobHeight || (activeJob.paperSize === 'A5' ? 210 : activeJob.paperSize === 'A6' ? 148 : 297));
              const jobQty = Number(activeJob.quantity || 1);

              const matchedOffcut = (offcuts || []).find((off: any) => {
                const offW = Number(off.specs?.widthMm || off.widthMm || 0);
                const offH = Number(off.specs?.heightMm || off.heightMm || 0);
                const offQty = Number(off.stockQty || off.qty || 0);
                const fits = (offW >= jobW && offH >= jobH) || (offW >= jobH && offH >= jobW);
                return fits && offQty >= Math.min(5, Math.ceil(jobQty * 0.1));
              });

              const savedCostLAK = Math.round(jobQty * 450);

              if (activeJob.useOffcut) {
                return (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold">
                        ນຳໃຊ້ເສດເຈ້ຍຈາກສາງ: <strong>{activeJob.offcutName || 'Offcut Stock'}</strong> (ຕັດຍອດຈາກ offcut_inventory ອັດຕະໂນມັດ — ປະຢັດຕົ້ນທຶນ {formatCurrency(activeJob.offcutSavings || savedCostLAK)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleActiveJobConfigChange({
                          ...activeJob,
                          useOffcut: false,
                          offcutId: undefined,
                          offcutName: undefined,
                          offcutSavings: undefined
                        });
                      }}
                      className="text-xs text-slate-500 hover:text-red-600 font-bold underline cursor-pointer shrink-0"
                    >
                      ຍົກເລີກ
                    </button>
                  </div>
                );
              }

              if (matchedOffcut) {
                return (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-700 shrink-0">
                        <Scissors className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                          <span>ມີເສດເຈ້ຍ {matchedOffcut.name || matchedOffcut.specs?.paperType || 'Art Card'} ພ້ອມໃຊ້ {matchedOffcut.stockQty || matchedOffcut.qty} ແຜ່ນ</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 text-[10px] font-bold">
                            ປະຢັດຕົ້ນທຶນ ~{formatCurrency(savedCostLAK)}
                          </span>
                        </h4>
                        <p className="text-xs text-emerald-800 font-medium mt-0.5">
                          ຂະໜາດເສດເຈ້ຍ {matchedOffcut.specs?.widthMm || matchedOffcut.widthMm}×{matchedOffcut.specs?.heightMm || matchedOffcut.heightMm} mm ສາມາດຮອງຮັບງານພິມ Job #{activeJobIndex + 1} ໄດ້ໂດຍບໍ່ຕ້ອງຕັດແຜ່ນໃຫຍ່
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleActiveJobConfigChange({
                          ...activeJob,
                          useOffcut: true,
                          offcutId: matchedOffcut.id,
                          offcutName: matchedOffcut.name || 'Offcut Stock',
                          offcutSavings: savedCostLAK
                        });
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>ນຳໃຊ້ເສດເຈ້ຍ (Use Offcut)</span>
                    </button>
                  </div>
                );
              }
              return null;
            })()}

            {/* Embedded Quotation-Grade ItemSpecConfigurator for Active Job */}
            {items[activeJobIndex] && (
              <div className="bg-white rounded-3xl border border-slate-200 p-2 sm:p-4 shadow-sm">
                <ItemSpecConfigurator
                  item={items[activeJobIndex]}
                  itemIndex={activeJobIndex}
                  allItems={items}
                  inventory={inventory}
                  equipment={equipment}
                  formatLAK={formatCurrency}
                  embeddedMode={true}
                  mode="order"
                  onChange={handleActiveJobConfigChange}
                  onSave={handleActiveJobConfigChange}
                  customerData={{
                    name: customerName,
                    phone: customerPhone,
                    address: customerAddress,
                    deliveryMethod
                  }}
                />
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: FINANCIAL LEDGER, DEPOSIT, AND WORKFLOW STATUSES                   */}
        {/* ========================================================================= */}
        {activeStep === 3 && (
          <div className="space-y-5 animate-fade-in">
            
            {/* Financial Ledger Calculation Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>ສະຫຼຸບການເງິນ & ໃບບິນ (Financial Settlement)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-xs">
                  <div className="flex justify-between text-slate-600 font-bold">
                    <span>ຍອດລວມຄ່າພິມທຸກ Job ({items.length} Jobs):</span>
                    <span className="font-mono text-slate-900">{formatCurrency(combinedCostSummary.totalSellingPrice)}</span>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">ສ່ວນຫຼຸດພິເສດ (Discount LAK)</label>
                    <input
                      type="number"
                      min="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">ຄ່າຈັດສົ່ງ (Shipping Fee LAK)</label>
                    <input
                      type="number"
                      min="0"
                      value={shippingFee}
                      onChange={(e) => setShippingFee(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">ມູນຄ່າສັ່ງຜະລິດສຸດທິ (Grand Total)</span>
                    <strong className="text-2xl font-black font-mono text-amber-400 block mt-1">
                      {formatCurrency(totalPrice)}
                    </strong>
                  </div>

                  <div className="border-t border-slate-800 pt-3 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>ຍອດຮັບຊຳລະແລ້ວ (ມັດຈຳ):</span>
                      <span className="font-mono text-emerald-400 font-bold">{formatCurrency(depositAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-100 font-black border-t border-slate-800 pt-1.5">
                      <span>ຍອດຄ້າງຊຳລະປັດຈຸບັນ:</span>
                      <span className={`font-mono ${remainingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {formatCurrency(remainingBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deposit Quick Buttons */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700">ຕັ້ງຄ່າຍອດມັດຈຳ (Deposit Amount Paid)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={totalPrice}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value) || 0)}
                    className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-emerald-700"
                  />
                  <button
                    type="button"
                    onClick={() => setDepositAmount(Math.round(totalPrice * 0.5))}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    ມັດຈຳ 50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositAmount(totalPrice)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    ຈ່າຍເຕັມ 100%
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositAmount(0)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    ຍັງບໍ່ຈ່າຍ (0%)
                  </button>
                </div>
              </div>
            </div>

            {/* Workflow & Payment Status Selectors */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>ສະຖານະອໍເດີ & ການຊຳລະເງິນ (Workflow Status)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ສະຖານະການຜະລິດ (Order Status)</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-500 transition"
                  >
                    <option value="QUOTATION">QUOTATION (ໃບສະເໜີລາຄາ)</option>
                    <option value="Received">Received / PENDING (ລໍຖ້າກວດສະລິບ)</option>
                    <option value="PREPRESS_CHECK">PREPRESS_CHECK (ກວດໄຟລ໌ພິມ)</option>
                    <option value="IN_PRODUCTION">IN_PRODUCTION (ກຳລັງຜະລິດ & ຕັດສະຕັອກ)</option>
                    <option value="READY_FOR_PICKUP">READY_FOR_PICKUP (ຜະລິດສຳເລັດ ພ້ອມສົ່ງ)</option>
                    <option value="Dispatched">Dispatched (ມອບໃຫ້ຂົນສົ່ງແລ້ວ)</option>
                    <option value="Delivered">Delivered / COMPLETED (ສຳເລັດສົມບູນ)</option>
                    <option value="Cancelled">Cancelled (ຍົກເລີກ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ສະຖານະການຊຳລະເງິນ (Payment Status)</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-500 transition"
                  >
                    <option value="Unpaid">Unpaid (ຍັງບໍ່ທັນຊຳລະ)</option>
                    <option value="Deposit">Deposit (ຊຳລະມັດຈຳບາງສ່ວນ)</option>
                    <option value="Paid">Paid (ຊຳລະຄົບ 100% ແລ້ວ)</option>
                    <option value="Refunded">Refunded (ຄືນເງິນ)</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Preflight & Color Analyzer Modal */}
      <PreflightItemCreationModal
        isOpen={isPreflightModalOpen}
        onClose={() => setIsPreflightModalOpen(false)}
        onConfirm={handleConfirmPreflight}
        onSkip={() => setIsPreflightModalOpen(false)}
        currentLang="lo"
      />
    </FormModalTemplate>
  );
};

export default EditOrderModal;
