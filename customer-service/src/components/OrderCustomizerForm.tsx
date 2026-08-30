import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PrintArtworkVisualizer,
  type GrommetMode,
} from './PrintArtworkVisualizer.tsx';
import {
  fetchPricingTemplates,
  calculateDynamicPrice,
  type ProductPricingTemplateItem,
  type DynamicPriceBreakdown,
} from '../api/client.ts';
import { useShop } from '../context/ShopContext.tsx';
import {
  UploadCloud,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ShoppingBag,
  Sliders,
  Layers,
  Ruler,
  Maximize2,
  ShieldAlert,
  Scissors,
} from 'lucide-react';

export interface OrderCustomizerFormProps {
  onAddToCart?: (customItem: any) => void;
  className?: string;
}

export const OrderCustomizerForm: React.FC<OrderCustomizerFormProps> = ({
  onAddToCart,
  className = '',
}) => {
  const { currency, convertTo, language } = useShop();

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
        const list = await fetchPricingTemplates();
        if (mounted && list.length > 0) {
          setTemplates(list);
          setSelectedTemplateId(list[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load pricing templates', err);
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

  // 2. Debounced Realtime Price Calculation
  const runCalculation = useCallback(async () => {
    if (!selectedTemplateId) return;
    try {
      setIsCalculating(true);
      setErrorMessage('');

      const res = await calculateDynamicPrice({
        template_id: selectedTemplateId,
        quantity,
        actual_coverage: actualCoverage,
        width_mm: Math.round(widthCm * 10),
        height_mm: Math.round(heightCm * 10),
        grommets_count: computedGrommetsCount,
        lamination_type: laminationType,
        edge_folding: hasHemming,
      });

      setPriceBreakdown(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error calculating price');
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
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      runCalculation();
    }, 180);
    return () => clearTimeout(timer);
  }, [runCalculation]);

  // File Upload Handler for Artwork
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArtworkFileName(file.name);
    const objectUrl = URL.createObjectURL(file);
    setArtworkUrl(objectUrl);
  };

  // Preset dimension buttons
  const applyPresetSize = (w: number, h: number) => {
    setWidthCm(w);
    setHeightCm(h);
  };

  // Submit & Add to Cart
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

  const formatPrice = (lakAmount: number) => {
    if (currency === 'THB') {
      const thb = convertTo(lakAmount);
      return `฿ ${thb.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;
    }
    return `₭ ${Math.round(lakAmount).toLocaleString('lo-LA')}`;
  };

  return (
    <div className={`w-full max-w-7xl mx-auto ${className}`}>
      {/* Toast Notification */}
      {isAddedToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-2xl animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">เพิ่มสินค้าสั่งพิมพ์ลงในตะกร้าเรียบร้อยแล้ว!</span>
        </div>
      )}

      {/* Grid Layout: Visualizer on Left, Configurator Form on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 2D Interactive Canvas Visualizer */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-24">
          <PrintArtworkVisualizer
            widthCm={widthCm}
            heightCm={heightCm}
            artworkUrl={artworkUrl}
            grommetPositions={grommetMode}
            hasHemming={hasHemming}
            className="w-full"
          />

          {/* Quick Preset Dimensions */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-emerald-400" />
              <span>ขนาดมาตรฐานยอดนิยม</span>
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

        {/* Right Column: Customizer Form & Realtime Cost Engine Breakdown */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Card: Configuration Form */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <span>กำหนดสเปกงานพิมพ์ (Print-on-Demand)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                ระบบคำนวณราคาแบบ Real-time พร้อมชดเชยค่าหมึกตามค่า Coverage จริงและตัวเลือกเสริม
              </p>
            </div>

            {/* 1. Template Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                1. เลือกวัสดุและเทมเพลตราคา
              </label>
              {loadingTemplates ? (
                <div className="h-12 rounded-xl bg-slate-800 animate-pulse" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                            MOQ: {tpl.min_order_quantity} ชิ้น
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Dimensions & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ความกว้าง (Width - cm)
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
                  ความสูง (Height - cm)
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
                  จำนวนพิมพ์ (Quantity)
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

            {/* 3. Artwork Upload */}
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
                <div className="text-xs text-slate-400 mt-1">
                  รองรับ JPG, PNG, WEBP, PDF (RGB/CMYK)
                </div>
              </div>
            </div>

            {/* 4. Ink Coverage Simulation */}
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
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>5% (ตัวหนังสือล้วน)</span>
                <span>15% (กราฟิกมาตรฐาน)</span>
                <span>50% (ภาพสีสด)</span>
                <span>100% (พื้นทึบเข้ม)</span>
              </div>
            </div>

            {/* 5. Add-ons & Finishing */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                4. ออปชันเสริม (Add-on Services)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Grommet Options */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">การตอกตาไก่ (Eyelets)</label>
                  <select
                    value={grommetMode}
                    onChange={(e) => setGrommetMode(e.target.value as GrommetMode)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="NONE">ไม่ตอกตาไก่ (None)</option>
                    <option value="FOUR_CORNERS">ตอกตาไก่ 4 มุม (4 Corners)</option>
                    <option value="EVERY_50CM">ตอกตาไก่ทุกๆ 50 cm (Every 50cm)</option>
                  </select>
                </div>

                {/* Lamination Options */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">การเคลือบผิว (Lamination)</label>
                  <select
                    value={laminationType}
                    onChange={(e) => setLaminationType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="NONE">ไม่เคลือบ (None)</option>
                    <option value="GLOSS">เคลือบเงา (Glossy)</option>
                    <option value="MATTE">เคลือบด้าน (Matte)</option>
                  </select>
                </div>
              </div>

              {/* Hemming Switch */}
              <div className="mt-4 flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-300 text-sm">
                    <Scissors className="w-4 h-4 text-rose-300" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">พับขอบเย็บเสริมความแข็งแรง</div>
                    <div className="text-xs text-slate-400">ป้องกันขอบรุ่ย เพิ่มความทนทานกลางแจ้ง</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasHemming}
                    onChange={(e) => setHasHemming(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              </div>
            </div>
          </div>

          {/* Card: Realtime Price Breakdown & Checkout Button */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>สรุปราคาและค่าบริการ (Price Breakdown)</span>
              </h3>
              {isCalculating && (
                <span className="text-xs text-slate-400 animate-pulse">กำลังคำนวณราคา...</span>
              )}
            </div>

            {errorMessage ? (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            ) : priceBreakdown ? (
              <div className="flex flex-col gap-2.5 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">
                    ค่าวัสดุและพิมพ์พื้นฐาน ({priceBreakdown.area_m2} m² × {quantity} ชิ้น)
                  </span>
                  <span className="font-semibold text-white">
                    {formatPrice(priceBreakdown.base_material_cost)}
                  </span>
                </div>

                {priceBreakdown.coverage_surcharge > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-800/80 text-amber-300">
                    <span>
                      ค่าชดเชยหมึกส่วนเกิน (+{priceBreakdown.coverage_delta_percent}% Coverage)
                    </span>
                    <span className="font-semibold">
                      +{formatPrice(priceBreakdown.coverage_surcharge)}
                    </span>
                  </div>
                )}

                {priceBreakdown.itemized_addons && priceBreakdown.itemized_addons.length > 0 && (
                  <div className="flex flex-col gap-1 py-1 border-b border-slate-800/80">
                    {priceBreakdown.itemized_addons.map((addon, idx) => (
                      <div key={idx} className="flex justify-between text-slate-400">
                        <span>• {addon.name}</span>
                        <span className="text-white">+{formatPrice(addon.total_cost)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {priceBreakdown.min_price_applied && (
                  <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[11px] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>
                      ปรับใช้ยอดสั่งพิมพ์ขั้นต่ำ (Min Price Floor):{' '}
                      {formatPrice(priceBreakdown.min_total_price)}
                    </span>
                  </div>
                )}

                {/* Final Total */}
                <div className="pt-3 flex items-baseline justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-400">ยอดรวมทั้งสิ้น</div>
                    <div className="text-xs text-slate-500">
                      เฉลี่ยชิ้นละ {formatPrice(priceBreakdown.final_unit_price)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                      {formatPrice(priceBreakdown.final_price)}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* CTA Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isCalculating || !priceBreakdown}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>สั่งพิมพ์และใส่ในตะกร้า</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
