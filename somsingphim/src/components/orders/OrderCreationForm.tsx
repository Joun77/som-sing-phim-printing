import React, { useState, useMemo, useCallback } from 'react';
import type { CreateOrderInput, OrderItemInput, PricingCalculationRequest, PricingResponse, CostBreakdown } from '../../types/order';
import { usePricingCalculator } from '../../hooks/usePricingCalculator';

interface OrderCreationFormProps {
  onSubmitOrder?: (order: CreateOrderInput) => Promise<void> | void;
  onCancel?: () => void;
  initialValues?: Partial<CreateOrderInput>;
}

// Memoized Cost Breakdown View
const CostBreakdownPanel = React.memo(function CostBreakdownPanel({
  pricing,
  loading,
}: {
  pricing: PricingResponse | null;
  loading: boolean;
}) {
  if (!pricing) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
        <p className="text-sm">ກະລຸນາເລືອກຈຳນວນ ແລະ ສະເປັກງານພິມເພື່ອຄິດໄລ່ລາຄາອັດຕະໂນມັດ</p>
      </div>
    );
  }

  const breakdown: CostBreakdown = pricing.cost_breakdown;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-amber-200/80 pb-3 mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Real-time Engine Calculation
          </span>
          <h4 className="text-base font-bold text-slate-900">
            {pricing.job_name} ({pricing.quantity.toLocaleString()} ຊິ້ນ)
          </h4>
        </div>
        {loading && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/70 px-2.5 py-0.5 text-xs font-medium text-amber-900 animate-pulse">
            Calculating...
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 mb-4">
        <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
          <span>ຕົ້ນທຶນກະດາດ (Paper Cost):</span>
          <span className="font-mono font-semibold text-slate-800">
            {breakdown.base_material_cost_lak.toLocaleString()} ₭
          </span>
        </div>
        <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
          <span>ຕົ້ນທຶນນ້ຳມຶກ (Ink Cost):</span>
          <span className="font-mono font-semibold text-slate-800">
            {breakdown.ink_usage_cost_lak.toLocaleString()} ₭
          </span>
        </div>
        <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
          <span>ຄ່າແຮງ & ເຂົ້າເລັ່ມ (Labor/Finishing):</span>
          <span className="font-mono font-semibold text-slate-800">
            {breakdown.labor_finishing_cost_lak.toLocaleString()} ₭
          </span>
        </div>
        <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
          <span>ຄ່າເສື່ອມເຄື່ອງ (Depreciation):</span>
          <span className="font-mono font-semibold text-slate-800">
            {breakdown.machine_depreciation_lak.toLocaleString()} ₭
          </span>
        </div>
        <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
          <span>ຕົ້ນທຶນພາຍໃນລວມ (Net Internal Cost):</span>
          <span className="font-mono font-bold text-indigo-900">
            {breakdown.net_internal_cost_lak.toLocaleString()} ₭
          </span>
        </div>
        <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
          <span>ກຳໄລສ່ວນເພີ່ມ (Markup):</span>
          <span className="font-mono font-bold text-emerald-700">
            +{breakdown.markup_amount_lak.toLocaleString()} ₭
          </span>
        </div>
      </div>

      {breakdown.ink_savings_lak && breakdown.ink_savings_lak > 0 ? (
        <div className="mb-4 rounded-lg bg-emerald-100/70 border border-emerald-300 p-2.5 text-xs text-emerald-900 flex justify-between items-center">
          <span>💡 ປະຢັດຕົ້ນທຶນມຶກທຽບ (Compatible Ink Savings):</span>
          <span className="font-bold font-mono">
            {breakdown.ink_savings_lak.toLocaleString()} ₭ ({breakdown.ink_savings_percent}%)
          </span>
        </div>
      ) : null}

      <div className="flex items-baseline justify-between rounded-lg bg-slate-900 p-3.5 text-white">
        <div>
          <span className="text-xs text-slate-400">ລາຄາຂາຍລວມ (Total Price LAK)</span>
          <div className="text-xl font-black text-amber-400">
            {pricing.total_price_lak.toLocaleString()} ₭
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">ລາຄາຕໍ່ໜ່ວຍ (Unit Price)</span>
          <div className="text-sm font-bold font-mono text-slate-200">
            {pricing.unit_price_lak.toLocaleString()} ₭ / ຊິ້ນ
          </div>
        </div>
      </div>
    </div>
  );
});

export const OrderCreationForm: React.FC<OrderCreationFormProps> = ({
  onSubmitOrder,
  onCancel,
  initialValues,
}) => {
  const [customerName, setCustomerName] = useState<string>(initialValues?.customer_name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(initialValues?.customer_phone || '');
  const [customerEmail, setCustomerEmail] = useState<string>(initialValues?.customer_email || '');
  const [deliveryDate, setDeliveryDate] = useState<string>(initialValues?.delivery_date || '');
  const [googleDriveLink, setGoogleDriveLink] = useState<string>(initialValues?.google_drive_link || '');
  const [depositLAK, setDepositLAK] = useState<number>(initialValues?.deposit_lak || 0);

  // Item Specs State
  const [jobName, setJobName] = useState<string>('ແຜ່ນພັບ A5 / Brochure A5');
  const [quantity, setQuantity] = useState<number>(100);
  const [paperCostPerUnit, setPaperCostPerUnit] = useState<number>(1200);
  const [unfoldedWidthMM, setUnfoldedWidthMM] = useState<number>(148);
  const [unfoldedHeightMM, setUnfoldedHeightMM] = useState<number>(210);
  const [inkCoveragePercent, setInkCoveragePercent] = useState<number>(20);
  const [useCompatibleInk, setUseCompatibleInk] = useState<boolean>(true);
  const [laminationType, setLaminationType] = useState<string>('GLOSS');
  const [laminationCostLAK, setLaminationCostLAK] = useState<number>(400);
  const [bindingType, setBindingType] = useState<string>('NONE');
  const [bindingCostLAK, setBindingCostLAK] = useState<number>(0);
  const [grommetsCount, setGrommetsCount] = useState<number>(0);
  const [edgeFolding, setEdgeFolding] = useState<boolean>(false);
  const [markupMarginPercent, setMarkupMarginPercent] = useState<number>(35);

  const [copiedTracking, setCopiedTracking] = useState<boolean>(false);

  // Generated tracking code preview
  const generatedTrackingCode = useMemo(() => {
    const d = new Date();
    const stamp = `${d.getFullYear().toString().slice(-2)}${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `SSP-${stamp}-${rand}`;
  }, []);

  // Request payload for pricing hook
  const pricingRequest: PricingCalculationRequest = useMemo(
    () => ({
      job_name: jobName,
      quantity,
      paper_cost_per_unit_lak: paperCostPerUnit,
      unfolded_width_mm: unfoldedWidthMM,
      unfolded_height_mm: unfoldedHeightMM,
      page_count: 1,
      ink_coverage_percent: inkCoveragePercent,
      ink_cost_per_ml_lak: 1800,
      use_compatible_ink: useCompatibleInk,
      compatible_ink_cost_per_ml_lak: 850,
      lamination_type: laminationType,
      lamination_cost_lak: laminationType !== 'NONE' ? laminationCostLAK : 0,
      binding_type: bindingType,
      binding_cost_lak: bindingCostLAK,
      grommets_count: grommetsCount,
      grommet_cost_lak: 500,
      edge_folding: edgeFolding,
      folding_cost_lak: 1000,
      labor_hours: 0.5,
      labor_rate_per_hour_lak: 40000,
      markup_margin_percent: markupMarginPercent,
      tax_rate_percent: 0,
    }),
    [
      jobName,
      quantity,
      paperCostPerUnit,
      unfoldedWidthMM,
      unfoldedHeightMM,
      inkCoveragePercent,
      useCompatibleInk,
      laminationType,
      laminationCostLAK,
      bindingType,
      bindingCostLAK,
      grommetsCount,
      edgeFolding,
      markupMarginPercent,
    ]
  );

  const { pricing, loading } = usePricingCalculator(pricingRequest, { debounceMs: 300 });

  const handleCopyTracking = useCallback(() => {
    navigator.clipboard.writeText(generatedTrackingCode);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  }, [generatedTrackingCode]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!customerName.trim()) {
        alert('ກະລຸນາປ້ອນຊື່ລູກຄ້າ');
        return;
      }

      const itemInput: OrderItemInput = {
        job_name: jobName,
        quantity,
        paper_cost_per_unit_lak: paperCostPerUnit,
        unfolded_width_mm: unfoldedWidthMM,
        unfolded_height_mm: unfoldedHeightMM,
        ink_coverage_percent: inkCoveragePercent,
        use_compatible_ink: useCompatibleInk,
        lamination_type: laminationType,
        lamination_cost_lak: laminationCostLAK,
        binding_cost_lak: bindingCostLAK,
        grommets_count: grommetsCount,
        edge_folding: edgeFolding,
        markup_margin_percent: markupMarginPercent,
        specs: {
          size: `${unfoldedWidthMM}x${unfoldedHeightMM} mm`,
          paper: `Art Paper (${paperCostPerUnit} ₭/sheet)`,
          finishing: laminationType !== 'NONE' ? laminationType : 'Normal',
          lamination: laminationType,
          binding: bindingType,
          width_mm: unfoldedWidthMM,
          height_mm: unfoldedHeightMM,
          grommets_count: grommetsCount,
          edge_folding: edgeFolding,
          ink_coverage_percent: inkCoveragePercent,
        },
      };

      const orderPayload: CreateOrderInput = {
        order_no: generatedTrackingCode,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        delivery_date: deliveryDate,
        google_drive_link: googleDriveLink.trim(),
        deposit_lak: depositLAK,
        items: [itemInput],
      };

      if (onSubmitOrder) {
        onSubmitOrder(orderPayload);
      }
    },
    [
      customerName,
      customerPhone,
      customerEmail,
      deliveryDate,
      googleDriveLink,
      depositLAK,
      generatedTrackingCode,
      jobName,
      quantity,
      paperCostPerUnit,
      unfoldedWidthMM,
      unfoldedHeightMM,
      inkCoveragePercent,
      useCompatibleInk,
      laminationType,
      laminationCostLAK,
      bindingType,
      bindingCostLAK,
      grommetsCount,
      edgeFolding,
      markupMarginPercent,
      onSubmitOrder,
    ]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">ສ້າງລາຍການສັ່ງພິມໃໝ່ (Create Order)</h2>
          <p className="text-xs text-slate-500">ຄຳນວນຕົ້ນທຶນແບບ Debounced 300ms ແລະ ສ້າງລະຫັດ Tracking ອັດຕະໂນມັດ</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-300">
            {generatedTrackingCode}
          </span>
          <button
            type="button"
            onClick={handleCopyTracking}
            className="text-xs font-medium text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            {copiedTracking ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">ຊື່ລູກຄ້າ *</label>
          <input
            type="text"
            required
            placeholder="ເຊັ່ນ: ທ່ານ ສົມສັກ"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">ເບີໂທລະສັບ / WhatsApp</label>
          <input
            type="text"
            placeholder="020 xxxxxxxx"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">ກຳນົດສົ່ງມອບ (Delivery Date)</label>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Item Specs & Production Parameters */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
        <h3 className="text-sm font-bold text-slate-800">ລາຍລະອຽດງານພິມ (Print Specification)</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">ຊື່ຊິ້ນງານ (Job Name)</label>
            <input
              type="text"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ຈຳນວນພິມ (Quantity)</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ກວ້າງ (Width mm)</label>
            <input
              type="number"
              value={unfoldedWidthMM}
              onChange={(e) => setUnfoldedWidthMM(parseFloat(e.target.value) || 0)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ສູງ (Height mm)</label>
            <input
              type="number"
              value={unfoldedHeightMM}
              onChange={(e) => setUnfoldedHeightMM(parseFloat(e.target.value) || 0)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ລາຄາກະດາດ (₭/ແຜ່ນ)</label>
            <input
              type="number"
              value={paperCostPerUnit}
              onChange={(e) => setPaperCostPerUnit(parseInt(e.target.value) || 0)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">% Coverage ນ້ຳມຶກ</label>
            <input
              type="number"
              value={inkCoveragePercent}
              onChange={(e) => setInkCoveragePercent(parseFloat(e.target.value) || 0)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ການເຄືອບ (Lamination)</label>
            <select
              value={laminationType}
              onChange={(e) => setLaminationType(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white"
            >
              <option value="NONE">ບໍ່ເຄືອບ (None)</option>
              <option value="GLOSS">ເຄືອບເງົາ (Gloss)</option>
              <option value="MATTE">ເຄືອບດ້ານ (Matte)</option>
              <option value="SOFT_TOUCH">ເຄືອບ Soft Touch</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ກຳໄລສ່ວນເພີ່ມ (Markup Margin %)</label>
            <input
              type="number"
              value={markupMarginPercent}
              onChange={(e) => setMarkupMarginPercent(parseFloat(e.target.value) || 0)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white"
            />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="useCompat"
              checked={useCompatibleInk}
              onChange={(e) => setUseCompatibleInk(e.target.checked)}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
            />
            <label htmlFor="useCompat" className="text-xs font-semibold text-slate-700 cursor-pointer">
              ໃຊ້ສູດມຶກທຽບ (Compatible Ink Pricing)
            </label>
          </div>
        </div>
      </div>

      {/* Live Cost Breakdown Panel */}
      <CostBreakdownPanel pricing={pricing} loading={loading} />

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            ຍົກເລີກ (Cancel)
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 text-sm font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'ກຳລັງຄິດໄລ່...' : 'ຢືນຢັນສ້າງອໍເດີ (Confirm & Create)'}
        </button>
      </div>
    </form>
  );
};
