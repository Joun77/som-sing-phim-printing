import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PrintArtworkVisualizer,
  type GrommetMode,
} from './PrintArtworkVisualizer.tsx';
import {
  UploadCloud,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ShoppingBag,
  Sliders,
  Ruler,
  ShieldAlert,
} from 'lucide-react';

export interface ProductPricingTemplateItem {
  id: string;
  name: string;
  material_id: string;
  baseline_coverage_percent: number;
  coverage_surcharge_multiplier: number;
  min_order_quantity: number;
  min_total_price: number;
  addon_rates?: Record<string, any>;
  is_active: boolean;
}

export interface AddonItemBreakdown {
  name: string;
  type: string;
  quantity: number;
  unit_price: number;
  total_cost: number;
}

export interface DynamicPriceBreakdown {
  template_id: string;
  template_name: string;
  material_id: string;
  material_name: string;
  quantity: number;
  min_order_quantity: number;
  area_m2: number;
  perimeter_m: number;
  base_unit_price: number;
  base_material_cost: number;
  baseline_coverage_percent: number;
  actual_coverage_percent: number;
  coverage_delta_percent: number;
  coverage_surcharge_multiplier: number;
  coverage_surcharge: number;
  addon_cost: number;
  itemized_addons?: AddonItemBreakdown[];
  subtotal: number;
  min_total_price: number;
  min_price_applied: boolean;
  final_price: number;
  final_unit_price: number;
}

export interface OrderCustomizerFormProps {
  onAddToCart?: (customItem: any) => void;
  className?: string;
}

export const OrderCustomizerForm: React.FC<OrderCustomizerFormProps> = ({
  onAddToCart,
  className = '',
}) => {
  // Template State
  const [templates, setTemplates] = useState<ProductPricingTemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);

  // Job Parameters State
  const [widthCm, setWidthCm] = useState<number>(100);
  const [heightCm, setHeightCm] = useState<number>(200);
  const [quantity, setQuantity] = useState<number>(1);
  const [artworkUrl, setArtworkUrl] = useState<string>('');
  const [artworkFileName, setArtworkFileName] = useState<string>('');
  const [actualCoverage, setActualCoverage] = useState<number>(15);

  // Addon Options State
  const [grommetMode, setGrommetMode] = useState<GrommetMode>('FOUR_CORNERS');
  const [laminationType, setLaminationType] = useState<'NONE' | 'GLOSS' | 'MATTE'>('NONE');
  const [hasHemming, setHasHemming] = useState<boolean>(true);

  // Pricing State
  const [priceBreakdown, setPriceBreakdown] = useState<DynamicPriceBreakdown | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isAddedToast, setIsAddedToast] = useState<boolean>(false);

  // 1. Fetch Templates on Mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingTemplates(true);
        const res = await fetch('/api/v1/pricing/templates').then((r) => r.json());
        if (mounted && res.status === 'success' && Array.isArray(res.data) && res.data.length > 0) {
          setTemplates(res.data);
          setSelectedTemplateId(res.data[0].id);
        } else {
          // Fallback defaults
          const defaults: ProductPricingTemplateItem[] = [
            {
              id: 'tpl_vinyl_outdoor',
              name: 'ໄວນິວ Outdoor Hi-Res 440g',
              material_id: 'mat_vinyl_440',
              baseline_coverage_percent: 15,
              coverage_surcharge_multiplier: 1.25,
              min_order_quantity: 1,
              min_total_price: 35000,
              is_active: true,
            },
            {
              id: 'tpl_canvas_cotton',
              name: 'ຜ້າໃບແຄນວາສ Premium Cotton 380g',
              material_id: 'mat_canvas_380',
              baseline_coverage_percent: 20,
              coverage_surcharge_multiplier: 1.5,
              min_order_quantity: 1,
              min_total_price: 80000,
              is_active: true,
            },
          ];
          if (mounted) {
            setTemplates(defaults);
            setSelectedTemplateId(defaults[0].id);
          }
        }
      } catch {
        if (mounted) setLoadingTemplates(false);
      } finally {
        if (mounted) setLoadingTemplates(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || templates[0];
  }, [templates, selectedTemplateId]);

  // Adjust quantity if below template MOQ
  useEffect(() => {
    if (activeTemplate && quantity < (activeTemplate.min_order_quantity || 1)) {
      setQuantity(activeTemplate.min_order_quantity || 1);
    }
  }, [activeTemplate, quantity]);

  // Calculate grommet count based on selection
  const computedGrommetsCount = useMemo(() => {
    if (grommetMode === 'NONE') return 0;
    if (grommetMode === 'FOUR_CORNERS') return 4;
    const segX = Math.max(1, Math.round(widthCm / 50));
    const segY = Math.max(1, Math.round(heightCm / 50));
    return (segX + 1) * 2 + Math.max(0, segY - 1) * 2;
  }, [grommetMode, widthCm, heightCm]);

  // 2. Realtime Price Calculation
  const runCalculation = useCallback(async () => {
    if (!selectedTemplateId) return;
    try {
      setIsCalculating(true);
      setErrorMessage('');

      const res = await fetch('/api/v1/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplateId,
          quantity,
          actual_coverage: actualCoverage,
          width_mm: Math.round(widthCm * 10),
          height_mm: Math.round(heightCm * 10),
          grommets_count: computedGrommetsCount,
          lamination_type: laminationType,
          edge_folding: hasHemming,
        }),
      }).then((r) => r.json());

      if (res.status === 'success' && res.data) {
        setPriceBreakdown(res.data);
      } else {
        throw new Error(res.message || 'Calculation error');
      }
    } catch (err: any) {
      // Local fallback calculation
      const qty = Math.max(1, quantity);
      const widthM = widthCm / 100;
      const heightM = heightCm / 100;
      const areaM2 = Math.round(widthM * heightM * 10000) / 10000;
      const perimeterM = Math.round((widthM + heightM) * 2 * 10000) / 10000;
      const baseCost = Math.round(45000 * areaM2 * qty);
      const baseline = activeTemplate?.baseline_coverage_percent || 15;
      let surcharge = 0;
      let delta = 0;
      if (actualCoverage > baseline) {
        delta = actualCoverage - baseline;
        surcharge = Math.round(baseCost * (delta / baseline) * 1.25);
      }
      let addonCost = 0;
      const addons: AddonItemBreakdown[] = [];
      if (computedGrommetsCount > 0) {
        const gCost = computedGrommetsCount * qty * 500;
        addons.push({
          name: `ຕອກຕາໄກ່ (${computedGrommetsCount} ຈຸດ)`,
          type: 'grommets',
          quantity: computedGrommetsCount * qty,
          unit_price: 500,
          total_cost: gCost,
        });
        addonCost += gCost;
      }
      if (laminationType !== 'NONE') {
        const lCost = Math.round(areaM2 * qty * 15000);
        addons.push({
          name: `ເຄືອບຜິວ (${laminationType})`,
          type: 'lamination',
          quantity: areaM2 * qty,
          unit_price: 15000,
          total_cost: lCost,
        });
        addonCost += lCost;
      }
      if (hasHemming) {
        const fCost = Math.round(perimeterM * qty * 3000);
        addons.push({
          name: 'ພັບຂອບຮອບດ້ານ',
          type: 'folding',
          quantity: perimeterM * qty,
          unit_price: 3000,
          total_cost: fCost,
        });
        addonCost += fCost;
      }
      const subtotal = baseCost + surcharge + addonCost;
      const minPrice = activeTemplate?.min_total_price || 35000;
      const minApplied = subtotal < minPrice;
      const finalPrice = minApplied ? minPrice : subtotal;

      setPriceBreakdown({
        template_id: selectedTemplateId,
        template_name: activeTemplate?.name || 'ໄວນິວ Outdoor Hi-Res',
        material_id: 'mat_default',
        material_name: 'ໄວນິວ 440g',
        quantity: qty,
        min_order_quantity: activeTemplate?.min_order_quantity || 1,
        area_m2: areaM2,
        perimeter_m: perimeterM,
        base_unit_price: Math.round(baseCost / qty),
        base_material_cost: baseCost,
        baseline_coverage_percent: baseline,
        actual_coverage_percent: actualCoverage,
        coverage_delta_percent: delta,
        coverage_surcharge_multiplier: 1.25,
        coverage_surcharge: surcharge,
        addon_cost: addonCost,
        itemized_addons: addons,
        subtotal,
        min_total_price: minPrice,
        min_price_applied: minApplied,
        final_price: finalPrice,
        final_unit_price: Math.round(finalPrice / qty),
      });
    } finally {
      setIsCalculating(false);
    }
  }, [
    selectedTemplateId,
    quantity,
    actualCoverage,
    widthCm,
    heightCm,
    computedGrommetsCount,
    laminationType,
    hasHemming,
    activeTemplate,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      runCalculation();
    }, 180);
    return () => clearTimeout(timer);
  }, [runCalculation]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArtworkFileName(file.name);
    setArtworkUrl(URL.createObjectURL(file));
  };

  const applyPresetSize = (w: number, h: number) => {
    setWidthCm(w);
    setHeightCm(h);
  };

  const handleAddToCart = () => {
    if (!priceBreakdown) return;
    const customItem = {
      templateId: selectedTemplateId,
      templateName: activeTemplate?.name || 'Custom Banner Print',
      widthCm,
      heightCm,
      quantity,
      actualCoverage,
      grommetMode,
      grommetsCount: computedGrommetsCount,
      laminationType,
      hasHemming,
      artworkUrl,
      artworkFileName,
      priceBreakdown,
      finalPrice: priceBreakdown.final_price,
    };

    if (onAddToCart) {
      onAddToCart(customItem);
    }

    setIsAddedToast(true);
    setTimeout(() => setIsAddedToast(false), 3500);
  };

  return (
    <div className={`w-full max-w-7xl mx-auto ${className}`}>
      {isAddedToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-2xl animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">ເພີ່ມສິນຄ້າສັ່ງພິມຮຽບຮ້ອຍແລ້ວ!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 2D Canvas Visualizer */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-24">
          <PrintArtworkVisualizer
            widthCm={widthCm}
            heightCm={heightCm}
            artworkUrl={artworkUrl}
            grommetPositions={grommetMode}
            hasHemming={hasHemming}
            className="w-full"
          />

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-emerald-400" />
              <span>ຂະໜາດມາດຕະຖານຍອດນິຍົມ</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPresetSize(100, 200)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border transition-all ${
                  widthCm === 100 && heightCm === 200
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                100 × 200 cm
              </button>
              <button
                type="button"
                onClick={() => applyPresetSize(120, 240)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border transition-all ${
                  widthCm === 120 && heightCm === 240
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                120 × 240 cm
              </button>
              <button
                type="button"
                onClick={() => applyPresetSize(60, 160)}
                className={`px-2.5 py-1.5 text-xs rounded-xl border transition-all ${
                  widthCm === 60 && heightCm === 160
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                60 × 160 cm
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Customizer Form */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <span>ກຳນົດສະເປັກງານພິມ (Print-on-Demand)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                ລະບົບຄຳນວນລາຄາແບບ Real-time ພ້ອມຊົດເຊີຍຄ່າໝຶກຕາມຄ່າ Coverage ຈິງ ແລະ ຕົວເລືອກເສີມ
              </p>
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                1. ເລືອກວັດສະດຸ ແລະ ເທັມເພລດລາຄາ
              </label>
              {loadingTemplates ? (
                <div className="h-12 rounded-xl bg-slate-800 animate-pulse" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates.map((tpl) => {
                    const isSelected = tpl.id === selectedTemplateId;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-500 shadow-lg shadow-emerald-950/30'
                            : 'bg-slate-800/50 border-slate-700/80 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-sm text-white">{tpl.name}</div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            Baseline: {tpl.baseline_coverage_percent}%
                          </div>
                        </div>
                        {tpl.min_order_quantity > 1 && (
                          <div className="mt-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 inline-block self-start">
                            MOQ: {tpl.min_order_quantity} ອັນ
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dimensions & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ຄວາມກວ້າງ (Width - cm)
                </label>
                <input
                  type="number"
                  min={10}
                  max={5000}
                  value={widthCm}
                  onChange={(e) => setWidthCm(Math.max(10, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ຄວາມສູງ (Height - cm)
                </label>
                <input
                  type="number"
                  min={10}
                  max={5000}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Math.max(10, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ຈຳນວນພິມ (Quantity)
                </label>
                <input
                  type="number"
                  min={activeTemplate?.min_order_quantity || 1}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.max(activeTemplate?.min_order_quantity || 1, Number(e.target.value))
                    )
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Artwork Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                2. อัปโหลดไฟล์อาร์ตเวิร์ก (Artwork File)
              </label>
              <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500/80 rounded-2xl p-4 transition-all bg-slate-800/30 flex flex-col items-center justify-center text-center cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-8 h-8 text-emerald-400 mb-2" />
                <div className="text-sm font-medium text-slate-200">
                  {artworkFileName ? artworkFileName : 'คลิกหรือลากไฟล์ภาพ/PDF มาวางที่นี่'}
                </div>
              </div>
            </div>

            {/* Ink Coverage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  3. ความหนาแน่นของหมึก (Ink Coverage %):{' '}
                  <span className="text-emerald-400 font-bold text-sm">{actualCoverage}%</span>
                </label>
                <span className="text-xs text-slate-400">
                  Baseline: {activeTemplate?.baseline_coverage_percent || 15}%
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={1}
                value={actualCoverage}
                onChange={(e) => setActualCoverage(Number(e.target.value))}
                className="w-full accent-emerald-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Add-ons */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                2. ອັບໂຫຼດໄຟລ໌ອາດເວີກ (Artwork File)
              </label>
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700 text-center text-xs text-slate-400">
                {artworkFileName ? artworkFileName : 'ຄລິກ ຫຼື ລາກໄຟລ໌ຮູບ/PDF ມາວາງທີ່ນີ້'}
              </div>
            </div>

            {/* Coverage % */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                3. ຄວາມໜາແໜ້ນຂອງໝຶກ (Ink Coverage %): {coveragePercent}%
              </label>
              <input
                type="range"
                min={5}
                max={100}
                value={coveragePercent}
                onChange={(e) => setCoveragePercent(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Add-ons */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                4. ອອບຊັນເສີມ (Add-on Services)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">ການຕອກຕາໄກ່ (Eyelets)</label>
                  <select
                    value={grommetMode}
                    onChange={(e) => setGrommetMode(e.target.value as GrommetMode)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="NONE">ບໍ່ຕອກຕາໄກ່ (None)</option>
                    <option value="FOUR_CORNERS">ຕອກຕາໄກ່ 4 ມຸມ (4 Corners)</option>
                    <option value="EVERY_50CM">ຕອກຕາໄກ່ທຸກໆ 50 cm (Every 50cm)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">ການເຄືອບຜິວ (Lamination)</label>
                  <select
                    value={laminationType}
                    onChange={(e) => setLaminationType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="NONE">ບໍ່ເຄືອບ (None)</option>
                    <option value="GLOSS">ເຄືອບເງົາ (Glossy)</option>
                    <option value="MATTE">ເຄືອບດ້ານ (Matte)</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                <div>
                  <div className="text-sm font-medium text-white">ພັບຂອບຫຍິບເສີມຄວາມແຂງແຮງ</div>
                  <div className="text-xs text-slate-400">ປ້ອງກັນຂອບຫຼຸ້ຍ ເພີ່ມຄວາມທົນທານກາງແຈ້ງ</div>
                </div>
                <input
                  type="checkbox"
                  checked={hasHemming}
                  onChange={(e) => setHasHemming(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Pricing Breakdown Card */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>ສະຫຼຸບລາຄາ ແລະ ຄ່າບໍລິການ (Price Breakdown)</span>
              </h3>
              {isCalculating && (
                <span className="text-xs text-slate-400 animate-pulse">ກຳລັງຄຳນວນລາຄາ...</span>
              )}
            </div>

            {priceBreakdown && (
              <div className="flex flex-col gap-2.5 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">
                    ຄ່າວັດສະດຸ ແລະ ພິມພື້ນຖານ ({priceBreakdown.area_m2} m² × {quantity} ອັນ)
                  </span>
                  <span className="font-semibold text-white">
                    ₭ {Math.round(priceBreakdown.base_material_cost).toLocaleString()}
                  </span>
                </div>

                {priceBreakdown.coverage_surcharge > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-800/80 text-amber-300">
                    <span>
                      ຄ່າຊົດເຊີຍໝຶກສ່ວນເກີນ (+{priceBreakdown.coverage_delta_percent}% Coverage)
                    </span>
                    <span className="font-semibold">
                      +₭ {Math.round(priceBreakdown.coverage_surcharge).toLocaleString()}
                    </span>
                  </div>
                )}

                {priceBreakdown.itemized_addons && priceBreakdown.itemized_addons.length > 0 && (
                  <div className="flex flex-col gap-1 py-1 border-b border-slate-800/80">
                    {priceBreakdown.itemized_addons.map((addon, idx) => (
                      <div key={idx} className="flex justify-between text-slate-400">
                        <span>• {addon.name}</span>
                        <span className="text-white">+₭ {Math.round(addon.total_cost).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {priceBreakdown.min_price_applied && (
                  <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[11px] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>
                      ປັບໃຊ້ຍອດສັ່ງພິມຂັ້ນຕ່ຳ (Min Price Floor): ₭ {Math.round(priceBreakdown.min_total_price).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="pt-3 flex items-baseline justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-400">ຍອດລວມທັງໝົດ</div>
                    <div className="text-xs text-slate-500">
                      ສະເລ່ຍອັນລະ ₭ {Math.round(priceBreakdown.final_unit_price).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                      ₭ {Math.round(priceBreakdown.final_price).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isCalculating || !priceBreakdown}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>ສັ່ງພິມ ແລະ ໃສ່ໃນກະຕ່າ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
