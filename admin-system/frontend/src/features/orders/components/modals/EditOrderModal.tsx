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
  FileCheck2,
  Download,
  ExternalLink
} from 'lucide-react';
import { FormModalTemplate } from '../../../../components/common/FormModalTemplate';
import ItemSpecConfigurator, { calculateItemCosting } from '../ItemSpecConfigurator';
import { PreflightItemCreationModal } from '../../../../components/PreflightItemCreationModal';
import { mapOrderToFormSpecs } from '../../../../utils/orderDataMapper';
import { useApp } from '@store/AppContext';
import { LAO_LOCATIONS, getDistrictsForProvince } from '../../../../data/laoLocations';
import type { PreflightResult } from '../../types';

export const formatProfitBadge = (profit: number, marginPercent: number) => {
  const isPositive = profit >= 0;
  const absVal = Math.abs(profit).toLocaleString('en-US', { minimumFractionDigits: 2 });
  return {
    text: `${isPositive ? '+' : '-'} LAK ${absVal}`,
    percentText: `${isPositive ? '+' : ''}${marginPercent.toFixed(0)}%`,
    colorClass: isPositive ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'
  };
};

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
  const { offcuts = [], couriers = [], customerCategories = [], customers = [], updateCustomer } = useApp();
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeJobIndex, setActiveJobIndex] = useState<number>(0);

  // Preflight & Color Analyzer Modal State
  const [isPreflightModalOpen, setIsPreflightModalOpen] = useState<boolean>(false);
  const [preflightTargetIndex, setPreflightTargetIndex] = useState<number | null>(null);
  
  // STEP 1: Customer & Delivery State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerTier, setCustomerTier] = useState<string>('RETAIL');
  const [province, setProvince] = useState<string>('ນະຄອນຫຼວງວຽງຈັນ');
  const [district, setDistrict] = useState<string>('');
  const [village, setVillage] = useState<string>('');

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
  const [depositPercent, setDepositPercent] = useState<number>(50);
  const [isRoundDepositToThousand, setIsRoundDepositToThousand] = useState<boolean>(true);

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

      const matchedCust = customers.find(c => 
        (order.customerId && (c.id === order.customerId || (c as any).customer_id === order.customerId)) || 
        c.name === (order.customerName || order.customer_name)
      );

      const initialTier = order.customerTier || order.customer_tier || order.tier || matchedCust?.tier || 'RETAIL';
      setCustomerTier(initialTier);

      const initProv = order.province || matchedCust?.province || 'ນະຄອນຫຼວງວຽງຈັນ';
      const initDist = order.district || matchedCust?.district || '';
      const initVill = order.village || matchedCust?.village || '';

      setProvince(initProv);
      setDistrict(initDist);
      setVillage(initVill);
      
      const delMethod = (order.deliveryMethod === 'Courier' || order.courier || order.trackingNumber || order.trackingNo) ? 'Courier' : 'Pickup';
      setDeliveryMethod(delMethod);
      setCourierName(order.courier || order.courierName || matchedCust?.preferredCourier || (couriers[0]?.name || 'Anousith Express'));
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

      const normalizedItems = mapOrderToFormSpecs(order, inventory, equipment);
      setItems(normalizedItems);
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

  const availableDistricts = useMemo(() => getDistrictsForProvince(province), [province]);
  const buildFullAddress = (v = village, d = district, p = province) => {
    const parts = [
      v ? `ບ້ານ ${v.trim()}` : '',
      d ? `ເມືອງ ${d.trim()}` : '',
      p ? (p.startsWith('ແຂວງ') || p.startsWith('ນະຄອນຫຼວງ') ? p.trim() : `ແຂວງ ${p.trim()}`) : ''
    ].filter(Boolean);
    return parts.join(', ');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('ກະລຸນາໃສ່ຊື່ລູກຄ້າ');
      return;
    }

    const finalFullAddress = buildFullAddress() || customerAddress.trim();

    const updatedOrder = {
      ...order,
      customerName: customerName.trim(),
      customer_name: customerName.trim(),
      customerPhone: customerPhone.trim(),
      phone: customerPhone.trim(),
      customerAddress: finalFullAddress,
      address: finalFullAddress,
      province,
      district,
      village,
      customerTier,
      customer_tier: customerTier,
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
        const itemArtworkUrl = it.artwork?.file_url || it.fileUrl || it.artworkUrl || '';
        const itemArtworkFileName = it.artwork?.file_name || it.fileName || it.artworkFileName || (itemArtworkUrl ? itemArtworkUrl.split('/').pop()?.split('?')[0] : '');
        const itemArtworkFileSize = it.artwork?.file_size_bytes || it.fileSize || it.artworkFileSize || 0;
        const itemPageCount = Number(it.pagesPerBook || it.page_count || 1);

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
          artworkUrl: itemArtworkUrl,
          artwork_url: itemArtworkUrl,
          artworkFileName: itemArtworkFileName,
          artwork_file_name: itemArtworkFileName,
          artworkFileSize: itemArtworkFileSize,
          artwork_file_size: itemArtworkFileSize,
          artwork: {
            file_url: itemArtworkUrl,
            file_name: itemArtworkFileName,
            file_size_bytes: itemArtworkFileSize,
            preview_thumbnail_url: itemArtworkUrl,
            page_count: itemPageCount
          },
          specifications: {
            ...(it.specifications || it.specs || {}),
            paper_id: it.paperId,
            color_mode: it.colorPrintMode || it.colorMode,
            printer_id: it.printerId,
            binding: it.bindingMethod,
            coating: it.coating,
            pages: itemPageCount
          }
        };
      })
    };

    // Option A: Auto-sync updated customer tier, address, phone & courier to CRM profile
    if (updateCustomer) {
      const matchedCust = customers.find(c => 
        (order.customerId && (c.id === order.customerId || (c as any).customer_id === order.customerId)) || 
        c.name === customerName.trim()
      );
      if (matchedCust) {
        updateCustomer(matchedCust.id, {
          tier: customerTier,
          province,
          district,
          village,
          address: finalFullAddress,
          phone: customerPhone.trim() || matchedCust.phone,
          preferredCourier: deliveryMethod === 'Courier' ? courierName : matchedCust.preferredCourier,
        });
      }
    }

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
      maxWidthClass="w-[99vw] max-w-[1800px] max-h-[97vh]"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-600" />
                      <span>ໝວດໝູ່ / ປະເພດລູກຄ້າ (Customer Category) *</span>
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold">CRM Sync</span>
                  </label>
                  <select
                    value={customerTier}
                    onChange={(e) => setCustomerTier(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 transition"
                  >
                    {customerCategories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>ເບີໂທຕິດຕໍ່ *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="020 xxxx xxxx"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:border-blue-500 transition"
                  />
                </div>

                {/* Structured Shipping Address: ບ້ານ, ເມືອງ, ແຂວງ */}
                <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                  <span className="font-black text-slate-800 flex items-center gap-1.5 text-xs">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>ທີ່ຢູ່ຈັດສົ່ງສິນຄ້າ (ບ້ານ / ເມືອງ / ແຂວງ)</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* ແຂວງ */}
                    <div className="space-y-1">
                      <label className="text-slate-500 uppercase block text-[10px] font-bold">
                        ແຂວງ (Province)
                      </label>
                      <select
                        value={province}
                        onChange={(e) => {
                          setProvince(e.target.value);
                          setDistrict('');
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                      >
                        {LAO_LOCATIONS.map((prov) => (
                          <option key={prov.name} value={prov.label}>
                            {prov.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* ເມືອງ */}
                    <div className="space-y-1">
                      <label className="text-slate-500 uppercase block text-[10px] font-bold">
                        ເມືອງ (District)
                      </label>
                      {availableDistricts.length > 0 ? (
                        <select
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                        >
                          <option value="">-- ເລືອກເມືອງ --</option>
                          {availableDistricts.map((d) => (
                            <option key={d.name} value={d.name}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          placeholder="ລະບຸເມືອງ"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        />
                      )}
                    </div>

                    {/* ບ້ານ */}
                    <div className="space-y-1">
                      <label className="text-slate-500 uppercase block text-[10px] font-bold">
                        ບ້ານ (Village)
                      </label>
                      <input
                        type="text"
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        placeholder="e.g. ໂພນສະຫວັນ"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
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
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                        <span>ບໍລິສັດຂົນສົ່ງ (Courier) *</span>
                        <span className="text-[10px] text-blue-600 font-bold">ດຶງຈາກຖານຂໍ້ມູນ</span>
                      </label>
                      <select
                        value={courierName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCourierName(val);
                          const cur = couriers.find(c => c.name === val || c.id === val);
                          if (cur && cur.fee && !shippingFee) {
                            setShippingFee(cur.fee);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 transition"
                      >
                        {couriers && couriers.length > 0 ? (
                          couriers.map((c: any) => (
                            <option key={c.id} value={c.name}>
                              {c.name} {c.shortName ? `(${c.shortName})` : ''} - ຄ່າສົ່ງ {c.fee?.toLocaleString()} LAK
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="Anousith Express">Anousith Express (ອານຸສິດ)</option>
                            <option value="HAL Logistics">HAL Logistics (ຮຸ່ງອາລຸນ)</option>
                            <option value="Mixay Express">Mixay Express (ມີໄຊ)</option>
                            <option value="Flash Express">Flash Express (ແຟລຊ)</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">ສາຂາປາຍທາງ (Branch Code / Name)</label>
                      <input
                        type="text"
                        value={courierBranch}
                        onChange={(e) => setCourierBranch(e.target.value)}
                        placeholder="ຕົວຢ່າງ: ສາຂາດົງໂດກ / ສາຂາປາກເຊ"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">ເລກຕິດຕາມພັດສະດຸ (Tracking No.)</label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="ANS-88992200"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:border-blue-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">ຄ່າຈັດສົ່ງສິນຄ້າ (Shipping Fee LAK)</label>
                      <input
                        type="number"
                        min="0"
                        value={shippingFee}
                        onChange={(e) => setShippingFee(Number(e.target.value))}
                        placeholder="0"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans font-bold focus:bg-white focus:border-blue-500 transition"
                      />
                    </div>
                  </>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ກຳນົດສົ່ງມອບສິນຄ້າ (Promised Date)</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-500 transition"
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
              <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200 text-sky-950 text-xs flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block font-black">ອໍເດີນີ້ສັ່ງພິມ ແລະ ຕັດສະຕັອກແລ້ວ (In-Production Stock Guard)</strong>
                    <span className="text-[11px] text-sky-700">
                      ບໍ່ສາມາດແກ້ໄຂສະເປກວັດຖຸດິບ (ເຈ້ຍ, ໝຶກ, ຈຳນວນ) ເພື່ອປ້ອງກັນຂໍ້ມູນສະຕັອກຜິດພາດ.
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl bg-sky-200/80 text-sky-900 font-mono font-black text-[10px]">
                  LOCKED
                </span>
              </div>
            )}

            {/* Combined Cost Summary Bar across all Jobs with Safe Profit Formatter */}
            {(() => {
              const profitBadge = formatProfitBadge(combinedCostSummary.netProfit, combinedCostSummary.overallMargin);
              return (
                <div className="bg-sky-50 rounded-3xl p-5 text-slate-900 shadow-xs border border-sky-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-sky-700 tracking-wider block">Live Cost & Pricing Breakdown</span>
                        <h4 className="text-sm font-black text-slate-900">
                          Job #{activeJobIndex + 1}: {items[activeJobIndex]?.name || 'Custom Print'} <span className="text-sky-600 font-mono">x{items[activeJobIndex]?.quantity || 1}</span> {items.length > 1 && `(ທັງໝົດ ${items.length} Jobs)`}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block font-bold">ມູນຄ່າສັ່ງພິມລວມ (Subtotal)</span>
                      <span className="text-lg font-black font-mono text-sky-700">
                        {formatCurrency(combinedCostSummary.totalSellingPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-500 block">ຕົ້ນທຶນເຈ້ຍ (Paper):</span>
                      <strong className="text-slate-800 font-mono text-xs">{formatCurrency(combinedCostSummary.totalPaperCost)}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-500 block">ຕົ້ນທຶນໝຶກ (Ink):</span>
                      <strong className="text-slate-800 font-mono text-xs">{formatCurrency(combinedCostSummary.totalInkCost)}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-500 block">ຄ່າແປຮູບ (Finishing):</span>
                      <strong className="text-slate-800 font-mono text-xs">{formatCurrency(combinedCostSummary.totalFinishingCost)}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-500 block">ຕົ້ນທຶນລວມ (Cost):</span>
                      <strong className="text-slate-800 font-mono text-xs">{formatCurrency(combinedCostSummary.totalDirectCost)}</strong>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${combinedCostSummary.netProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                      <span className="text-[10px] text-slate-600 block font-bold">ກຳໄລລວມ ({profitBadge.percentText}):</span>
                      <strong className={`font-mono text-xs font-black ${combinedCostSummary.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {profitBadge.text}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })()}

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

            {/* Two-Column Split Layout for Tab 2: 30% Left (Jobs) & 70% Right (Configurator) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              
              {/* LEFT COLUMN: 30-33% Width (xl:col-span-4) - Job Items Table / List with Attached Artwork */}
              <div className="xl:col-span-4 lg:col-span-5 space-y-3">
                <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        ລາຍການສັ່ງພິມ ({items.length} Jobs)
                      </h4>
                    </div>
                    {!isInProduction && (
                      <button
                        type="button"
                        onClick={handleAddJob}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs active:scale-95 transition flex items-center gap-1 cursor-pointer border-none"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ ເພີ່ມ Job ໃໝ່</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                    {items.map((job, idx) => {
                      const isSelected = activeJobIndex === idx;
                      const jobCosting = calculateItemCosting(job, inventory, equipment);
                      const jobPrice = job.totalPrice !== undefined ? Number(job.totalPrice) : jobCosting.finalPrice;
                      
                      const artUrl = job.artwork?.file_url || job.fileUrl || job.artworkUrl || '';
                      const artName = job.artwork?.file_name || job.fileName || job.artworkFileName || (artUrl ? artUrl.split('/').pop()?.split('?')[0] : '');
                      const isPdf = artName.toLowerCase().endsWith('.pdf') || artUrl.toLowerCase().includes('.pdf');
                      const isImg = /\.(jpe?g|png|webp|gif|svg)$/i.test(artName) || /\.(jpe?g|png|webp|gif|svg)/i.test(artUrl);

                      const sizeText = job.jobWidth && job.jobHeight ? `${job.jobWidth}×${job.jobHeight}mm (${job.paperSize || 'Custom'})` : (job.paperSize || 'A4');
                      const paperObj = inventory.find(p => p.id === job.paperId);
                      const paperName = paperObj?.name || job.paperId || 'Standard Paper';
                      const colorModeText = job.colorPrintMode === 'MONO_K' || job.colorMode === 'Monochrome' ? 'ຂາວດຳ (Mono K)' : 'ສີ (CMYK)';

                      return (
                        <div
                          key={job.id || idx}
                          onClick={() => setActiveJobIndex(idx)}
                          className={`p-3.5 rounded-2xl border transition cursor-pointer relative ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-500/30'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                          }`}
                        >
                          {/* Row Header: Job Index & Action Toolbar */}
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black ${
                                isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                Job {idx + 1} of {items.length}
                              </span>
                              <span className="font-mono font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[10px]">
                                {job.quantity || 1} ຊຸດ
                              </span>
                            </div>

                            {!isInProduction && (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateJob(idx)}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                  title="Duplicate this job"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                {items.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveJob(idx)}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Delete this job"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Job Title */}
                          <h5 className="text-xs font-black text-slate-900 line-clamp-1">
                            {job.name || `Job #${idx + 1}`}
                          </h5>

                          {/* Compact Specs Badges */}
                          <div className="flex flex-wrap gap-1 mt-1.5 text-[10px] font-bold text-slate-500">
                            <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200">
                              {sizeText}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 truncate max-w-[140px]" title={paperName}>
                              {paperName}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200">
                              {colorModeText}
                            </span>
                          </div>

                          {/* Attached Artwork Thumbnail & Quick Actions */}
                          {artUrl ? (
                            <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-[10.5px]">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {isImg ? (
                                  <img
                                    src={artUrl}
                                    alt={artName}
                                    className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-mono font-black text-[9px] flex items-center justify-center shrink-0 border border-purple-200">
                                    {isPdf ? 'PDF' : 'ART'}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <span className="block font-mono font-bold text-slate-700 truncate text-[10px]" title={artName}>
                                    {artName || 'Artwork File'}
                                  </span>
                                  <span className="block text-[9px] text-slate-400">Attached Artwork</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    try {
                                      const link = document.createElement('a');
                                      link.href = artUrl;
                                      link.download = artName || 'artwork.pdf';
                                      link.target = '_blank';
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    } catch {
                                      window.open(artUrl, '_blank');
                                    }
                                  }}
                                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded-md border border-slate-200 transition"
                                  title="Download File"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => window.open(artUrl, '_blank')}
                                  className="p-1 text-blue-600 hover:text-blue-700 hover:bg-white rounded-md border border-blue-200 transition"
                                  title="View File"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 py-1.5 px-2 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-800 text-[10px] flex items-center justify-between">
                              <span>ຍັງບໍ່ມີໄຟລ໌ອັດແນບ</span>
                              {!isInProduction && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenPreflightForJob(idx);
                                  }}
                                  className="text-blue-700 font-bold underline hover:text-blue-900"
                                >
                                  + ອັບໂຫຼດ / Preflight
                                </button>
                              )}
                            </div>
                          )}

                          {/* Job Subtotal Price */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold text-[10px]">ລາຄາ Job ນີ້ (Subtotal):</span>
                            <strong className="font-mono font-black text-amber-700">
                              {formatCurrency(jobPrice)}
                            </strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: 67-70% Width (xl:col-span-8) - Product Template & 6 Cost Modules */}
              <div className="xl:col-span-8 lg:col-span-7 space-y-4">
                {items[activeJobIndex] ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-3 sm:p-5 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider block">Active Job Costing Configurator</span>
                        <h4 className="text-sm font-black text-slate-900">
                          {items[activeJobIndex]?.name || `Job #${activeJobIndex + 1}`}
                        </h4>
                      </div>

                      {!isInProduction && (
                        <button
                          type="button"
                          onClick={() => handleOpenPreflightForJob(activeJobIndex)}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Scan customer artwork for CMYK coverage, page count, and dimensions"
                        >
                          <Palette className="w-3.5 h-3.5 text-purple-600" />
                          <span>ກວດຄ່າສີ & Preflight</span>
                        </button>
                      )}
                    </div>

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
                ) : (
                  <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs font-bold">
                    ກະລຸນາເລືອກ Job ຈາກລາຍການດ້ານຊ້າຍ
                  </div>
                )}
              </div>

            </div>

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

              {/* Deposit Quick Buttons & Dynamic % with 1,000 LAK Rounding */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-slate-700">
                    ຕັ້ງຄ່າຍອດມັດຈຳ (Financial Deposit Configuration)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isRoundDepositToThousand}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsRoundDepositToThousand(checked);
                        const raw = (totalPrice * depositPercent) / 100;
                        const finalDep = checked ? Math.round(raw / 1000) * 1000 : Math.round(raw);
                        setDepositAmount(finalDep);
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>ປັດເປັນຕົວເລກຖ້ວນ (ຫຼັກພັນກີບ)</span>
                  </label>
                </div>

                {/* Preset Buttons & Custom % */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400">ອັດຕາສ່ວນ (%):</span>
                  {[30, 50, 70, 100].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setDepositPercent(pct);
                        const raw = (totalPrice * pct) / 100;
                        const finalDep = isRoundDepositToThousand ? Math.round(raw / 1000) * 1000 : Math.round(raw);
                        setDepositAmount(finalDep);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                        depositPercent === pct
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}

                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={depositPercent}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                        setDepositPercent(val);
                        const raw = (totalPrice * val) / 100;
                        const finalDep = isRoundDepositToThousand ? Math.round(raw / 1000) * 1000 : Math.round(raw);
                        setDepositAmount(finalDep);
                      }}
                      className="w-16 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-center"
                      placeholder="%"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>

                {/* Direct Kip Deposit Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    ຍອດເງິນມັດຈຳຕົວຈິງ (Deposit Amount in Kip) — ສາມາດພິມແກ້ໄຂໄດ້ໂດຍກົງ:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={totalPrice}
                      value={depositAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setDepositAmount(val);
                        if (totalPrice > 0) {
                          setDepositPercent(Math.round((val / totalPrice) * 100));
                        }
                      }}
                      className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-black text-emerald-700"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setDepositPercent(0);
                        setDepositAmount(0);
                      }}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      ຍັງບໍ່ຈ່າຍ (0%)
                    </button>
                  </div>
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
