import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { PrintOrderFormValues, ProductOption } from '../../types/pricing';
import { useDynamicPriceCalculator } from '../../hooks/useDynamicPriceCalculator';
import { DriveLinkInput } from './DriveLinkInput';
import { PriceSummaryCard } from './PriceSummaryCard';

const DEFAULT_PAPERS: ProductOption[] = [
  { id: 'paper-wf-80', name: 'กระดาษปอนด์ (Woodfree) 80 แกรม', type: 'paper', pricePerUnit: 150, weightGsm: 80 },
  { id: 'paper-gr-75', name: 'กระดาษถนอมสายตา (Green Read) 75 แกรม', type: 'paper', pricePerUnit: 180, weightGsm: 75 },
  { id: 'paper-art-130', name: 'กระดาษอาร์ตมัน (Art Gloss) 130 แกรม', type: 'paper', pricePerUnit: 250, weightGsm: 130 },
  { id: 'paper-art-260', name: 'กระดาษอาร์ตการ์ด 260 แกรม (ปก/การ์ด)', type: 'paper', pricePerUnit: 450, weightGsm: 260 },
];

const DEFAULT_BINDINGS: ProductOption[] = [
  { id: 'bind-none', name: 'ไม่เข้าเล่ม (ใบเดี่ยว/แผ่นพับ)', type: 'binding', pricePerUnit: 0 },
  { id: 'bind-saddle', name: 'เย็บมุงหลังคา (Saddle Stitch)', type: 'binding', pricePerUnit: 1000, description: 'เหมาะสำหรับ 8-48 หน้า' },
  { id: 'bind-perfect', name: 'เข้าเล่มไสกาว (Perfect Binding)', type: 'binding', pricePerUnit: 3500, description: 'เหมาะสำหรับ 40+ หน้า' },
  { id: 'bind-wireo', name: 'เข้าเล่มสันห่วงกระดูกงู (Wire-O)', type: 'binding', pricePerUnit: 4000, description: 'เปิดกางได้ 360 องศา' },
];

const DEFAULT_FINISHINGS: ProductOption[] = [
  { id: 'fin-none', name: 'ไม่เคลือบผิว', type: 'finishing', pricePerUnit: 0 },
  { id: 'fin-gloss', name: 'เคลือบเงา (Gloss Lamination)', type: 'finishing', pricePerUnit: 1500 },
  { id: 'fin-matte', name: 'เคลือบด้าน (Matte Lamination)', type: 'finishing', pricePerUnit: 1800 },
];

export const PrintOrderForm: React.FC = () => {
  const [formValues, setFormValues] = useState<PrintOrderFormValues>({
    productId: 'book-general',
    paperType: DEFAULT_PAPERS[0].id,
    bindingType: DEFAULT_BINDINGS[1].id,
    finishingType: DEFAULT_FINISHINGS[0].id,
    pageCount: 16,
    isDoubleSided: true,
    quantity: 50,
    driveUrl: '',
  });

  const {
    quote,
    isLoading,
    isScanning,
    scanStatus,
    scanError,
    detectedPages,
  } = useDynamicPriceCalculator({
    values: formValues,
    paperOptions: DEFAULT_PAPERS,
    bindingOptions: DEFAULT_BINDINGS,
    finishingOptions: DEFAULT_FINISHINGS,
  });

  const handleFieldChange = <K extends keyof PrintOrderFormValues>(
    field: K,
    value: PrintOrderFormValues[K]
  ) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          สั่งพิมพ์เอกสาร & สมุดหนังสือ (Print-on-Demand)
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1">
          เลือกสเปกงานพิมพ์ วางลิงก์ไฟล์ Google Drive เพื่อประเมินราคาตามสัดส่วนหมึกจริงทันที
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          {/* Drive Link Input */}
          <DriveLinkInput
            value={formValues.driveUrl}
            onChange={(url) => handleFieldChange('driveUrl', url)}
            isScanning={isScanning}
            scanStatus={scanStatus}
            scanError={scanError}
            detectedPages={detectedPages}
          />

          <hr className="border-slate-100" />

          {/* Paper Type Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              เนื้อกระดาษ (Paper Material)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEFAULT_PAPERS.map((paper) => (
                <button
                  type="button"
                  key={paper.id}
                  onClick={() => handleFieldChange('paperType', paper.id)}
                  className={`p-3.5 rounded-xl text-left border text-sm transition-all ${
                    formValues.paperType === paper.id
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20 font-medium text-slate-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <div className="font-semibold">{paper.name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {paper.weightGsm} gsm
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Binding Option */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              รูปแบบการเข้าเล่ม (Binding Method)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEFAULT_BINDINGS.map((binding) => (
                <button
                  type="button"
                  key={binding.id}
                  onClick={() => handleFieldChange('bindingType', binding.id)}
                  className={`p-3.5 rounded-xl text-left border text-sm transition-all ${
                    formValues.bindingType === binding.id
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20 font-medium text-slate-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <div className="font-semibold">{binding.name}</div>
                  {binding.description && (
                    <div className="text-xs text-slate-500 mt-0.5">{binding.description}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Duplex Toggle & Finishing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">
                รูปแบบการพิมพ์
              </label>
              <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50">
                <button
                  type="button"
                  onClick={() => handleFieldChange('isDoubleSided', true)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    formValues.isDoubleSided
                      ? 'bg-white shadow-sm text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  พิมพ์ 2 หน้า (หน้า-หลัง)
                </button>
                <button
                  type="button"
                  onClick={() => handleFieldChange('isDoubleSided', false)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    !formValues.isDoubleSided
                      ? 'bg-white shadow-sm text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  พิมพ์หน้าเดียว
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">
                การเคลือบผิวปก (Finishing)
              </label>
              <select
                value={formValues.finishingType}
                onChange={(e) => handleFieldChange('finishingType', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {DEFAULT_FINISHINGS.map((fin) => (
                  <option key={fin.id} value={fin.id}>
                    {fin.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Page Count & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">
                จำนวนหน้าต่อเล่ม (Pages)
              </label>
              <input
                type="number"
                min={1}
                value={formValues.pageCount}
                onChange={(e) => handleFieldChange('pageCount', Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">
                จำนวนพิมพ์ (เล่ม / ชุด)
              </label>
              <input
                type="number"
                min={1}
                value={formValues.quantity}
                onChange={(e) => handleFieldChange('quantity', Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Price Summary & Checkout Action (5 cols) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          <PriceSummaryCard
            quote={quote}
            isLoading={isLoading}
            isScanning={isScanning}
          />

          <button
            type="button"
            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all transform active:scale-[0.98] text-base"
          >
            ยืนยันการสั่งพิมพ์
          </button>

          <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 inline text-slate-400" /> ข้อมูลและไฟล์ของคุณจะถูกเข้ารหัสและปกป้องอย่างปลอดภัย
          </p>
        </div>
      </div>
    </div>
  );
};
