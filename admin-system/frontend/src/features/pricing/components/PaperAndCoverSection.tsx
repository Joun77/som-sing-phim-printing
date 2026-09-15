import React from 'react';
import { Scissors, Bookmark, Search, ChevronUp, ChevronDown, FileText, CheckCircle2, Layers, Tag, Sparkles } from 'lucide-react';
import type { QuotationItem } from './QuotationManager';
import type { InventoryItem } from '../../../types';

interface PaperAndCoverSectionProps {
  activeItem: QuotationItem;
  updateActiveItem: (patch: Partial<QuotationItem>) => void;
  activeCalc: any;
  papers: InventoryItem[];
  isOpen: boolean;
  onToggle: () => void;
  onOpenPaperSearch: (target: 'inner' | 'cover') => void;
  formatCurrency: (amount: number) => string;
  getFIFOCostPerSheet: (paperId: string, qty: number) => number;
  currentLang: string;
  t?: any;
  offcuts?: InventoryItem[];
}

export const PaperAndCoverSection: React.FC<PaperAndCoverSectionProps> = ({
  activeItem,
  updateActiveItem,
  activeCalc,
  papers,
  isOpen,
  onToggle,
  onOpenPaperSearch,
  formatCurrency,
  getFIFOCostPerSheet,
  currentLang,
  offcuts = [],
}) => {
  const isBatchPhoto = Boolean(
    activeItem.isBatchPhoto || 
    activeCalc.isBatchPhoto || 
    activeItem.name?.includes('Photo Prints') || 
    (activeItem.batchFiles && activeItem.batchFiles.length > 0) ||
    (activeItem.preflightData as any)?.is_batch_photo
  );
  const isCoverActive = !isBatchPhoto && Boolean(activeItem.includeCover);

  return (
    <div id="sec-phase3" className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between transition cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center font-sans font-black text-xs shadow-xs">3</span>
          <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
            {isBatchPhoto 
              ? (currentLang === 'lo' ? 'ເລືອກເຈ້ຍພິມຮູບພາບ & ແຜນຕັດ (Photo Paper & Cuts)' : 'Photo Paper & Cut Specs')
              : (currentLang === 'lo' ? 'ເລືອກເຈ້ຍ, ໜ້າປົກ & ຂະໜາດຕັດ (Paper, Cover & Cut)' : 'Paper, Cover & Cut Specs')}
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 bg-sky-50 text-sky-700 rounded-lg border border-sky-200 font-sans flex items-center gap-1">
            <Scissors className="w-3 h-3" />
            {activeCalc.cutsPerSheet} ຕັດ/ແຜ່ນ • {formatCurrency(activeCalc.paperCost)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[11px] font-medium hidden sm:inline">{isOpen ? 'ພັບເກັບ' : 'ເປີດເບິ່ງ'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-slate-100 space-y-4 animate-fade-in">
          
          {/* SECTION 1: BOOK COVER CONFIGURATION (Hides cleanly when isBatchPhoto) */}
          {isBatchPhoto ? (
            <div className="p-3 bg-sky-50/60 border border-sky-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-sky-900">
                <Scissors className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="font-bold">
                  {currentLang === 'lo' 
                    ? `ວຽກພິມຮູບພາບ (Photo Prints) — ແຜນຈັດວາງຮູບດ່ຽວ (Single-sheet Imposition) ບໍ່ມີໜ້າປົກ`
                    : 'Photo Prints — Single-sheet Imposition (No Cover Required)'}
                </span>
              </div>
              <span className="px-2 py-0.5 bg-sky-200/80 text-sky-950 font-bold rounded-lg text-[10px] shrink-0 font-sans">
                {activeCalc.photoCountPerSet || activeItem.pagesPerBook || 1} ຮູບ/ຊຸດ
              </span>
            </div>
          ) : (
          <div className="p-4 rounded-2xl border-2 transition-all bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 border-amber-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${isCoverActive ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'}`}>
                  <Bookmark className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wide block">
                    {currentLang === 'lo' ? 'ສະເປກໜ້າປົກປຶ້ມ (Book Cover Specs)' : 'Book Cover Specs'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {isCoverActive ? 'ແຍກເຈ້ຍປົກ ແລະ ໂໝດພິມປົກຕ່າງຫາກ' : 'ບໍ່ມີໜ້າປົກແຍກ (ໃຊ້ເຈ້ຍເນື້ອໃນດຽວກັນ)'}
                  </span>
                </div>
              </div>

              {/* Modern iOS-style Toggle Switch (ດັອກກີ້ສະວິດ) */}
              <div className="flex items-center gap-2.5">
                <span className={`text-xs font-bold transition select-none ${isCoverActive ? 'text-amber-900 font-black' : 'text-slate-400'}`}>
                  {isCoverActive ? (currentLang === 'lo' ? 'ເປີດໃຊ້ປົກ' : 'Cover ON') : (currentLang === 'lo' ? 'ປິດ' : 'OFF')}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isCoverActive}
                  onClick={() => updateActiveItem({ includeCover: !isCoverActive })}
                  className={`w-12 h-6.5 rounded-full transition-colors relative p-0.5 focus:outline-none cursor-pointer shadow-inner ${
                    isCoverActive ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform duration-200 flex items-center justify-center ${
                      isCoverActive ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  >
                    {isCoverActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />}
                  </div>
                </button>
              </div>
            </div>

            {isCoverActive && (
              <div className="pt-2.5 border-t border-amber-200/60 grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
                {/* Cover Paper Select with Search Modal Button */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-amber-900 block">ເຈ້ຍໜ້າປົກ (Cover Paper):</label>
                    <button
                      type="button"
                      onClick={() => onOpenPaperSearch('cover')}
                      className="text-[10px] font-black text-amber-900 hover:text-white bg-amber-200/80 hover:bg-amber-600 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Search className="w-3 h-3" />
                      <span>ຄົ້ນຫາໃນຄັງ</span>
                    </button>
                  </div>
                  <select
                    value={activeItem.coverPaperId || papers[0]?.id}
                    onChange={(e) => updateActiveItem({ coverPaperId: e.target.value })}
                    className="w-full min-h-[42px] px-3 py-1.5 border border-amber-300 rounded-xl focus:outline-none text-xs bg-white font-semibold font-sans shadow-2xs"
                  >
                    {papers.map(p => (
                      <option key={`cover-${p.id}`} value={p.id}>
                        {p.name} {p.gsm ? `(${p.gsm}g)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cover Print Mode */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-amber-900 block">ການພິມປົກ (Cover Print Mode):</label>
                    {activeCalc.coverInkCost > 0 && (
                      <span className="text-[10px] font-black text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md font-mono">
                        ຄ່ານ້ຳໝຶກປົກ: {formatCurrency(activeCalc.coverInkCost)}
                      </span>
                    )}
                  </div>
                  <select
                    value={activeItem.coverPrintMode || 'CMYK_1_SIDE'}
                    onChange={(e) => updateActiveItem({ coverPrintMode: e.target.value as any })}
                    className="w-full min-h-[42px] px-3 py-1.5 border border-amber-300 rounded-xl focus:outline-none text-xs bg-white font-semibold font-sans shadow-2xs"
                  >
                    <option value="CMYK_1_SIDE">ພິມ 4 ສີ ດ້ານນອກ (1 ດ້ານ)</option>
                    <option value="CMYK_2_SIDES">ພິມ 4 ສີ ທັງ 2 ດ້ານ (ນອກ+ໃນ)</option>
                    <option value="MONO_K">ພິມຂາວດຳ 1 ດ້ານ</option>
                  </select>
                </div>

                {/* Cover File Artwork Status & Upload */}
                <div className="md:col-span-2 p-3 bg-white border border-amber-300 rounded-xl flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <Bookmark className="w-4 h-4 text-amber-700" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-800">
                          {currentLang === 'lo' ? 'ໄຟລ໌ໜ້າປົກ (Cover Artwork):' : 'Cover Artwork File:'}
                        </span>
                        {activeItem.coverArtworkUrl && (
                          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                            {currentLang === 'lo' ? 'ພ້ອມພິມ' : 'Ready'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 truncate max-w-xs font-mono mt-0.5">
                        {activeItem.coverFileName || (activeItem.coverArtworkUrl ? 'ໄຟລ໌ໜ້າປົກແຍກ' : (currentLang === 'lo' ? 'ຍັງບໍ່ມີໄຟລ໌ປົກ (ຄລິກເພື່ອອັບໂຫຼດ)' : 'No cover file selected'))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="file"
                      id="cover-file-upload-input"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff,.psd"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = URL.createObjectURL(file);
                        updateActiveItem({
                          coverArtworkUrl: url,
                          coverFileName: file.name,
                          coverFileSize: file.size,
                        });
                      }}
                    />
                    {activeItem.coverArtworkUrl && (
                      <a
                        href={activeItem.coverArtworkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-[10px] font-black text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition"
                      >
                        {currentLang === 'lo' ? 'ເບິ່ງໄຟລ໌' : 'View'}
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => document.getElementById('cover-file-upload-input')?.click()}
                      className="px-3 py-1 text-[10px] font-black text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition shadow-2xs cursor-pointer"
                    >
                      {activeItem.coverArtworkUrl 
                        ? (currentLang === 'lo' ? 'ປ່ຽນໄຟລ໌ປົກ' : 'Change') 
                        : (currentLang === 'lo' ? '+ ອັບໂຫຼດໄຟລ໌ປົກ' : '+ Upload Cover')}
                    </button>
                  </div>
                </div>

                {/* Cover Summary Banner */}
                <div className="md:col-span-2 p-2.5 bg-amber-100/80 border border-amber-200 rounded-xl text-[11px] text-amber-950 flex flex-wrap justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-800" />
                    <span>ໃຊ້ເຈ້ຍປົກ: <strong>{activeCalc.totalCoverParentSheets?.toLocaleString() || activeItem.printVolume} ແຜ່ນ</strong> (1 ແຜ່ນປົກກາງຄູ່ / ເລັ້ມ + ເຜື່ອເສຍ)</span>
                  </span>
                  <span className="font-bold font-sans">
                    ຕົ້ນທຶนເຈ້ຍປົກ: {formatCurrency(activeCalc.coverPaperCost || 0)}
                  </span>
                </div>

                {/* Cover Extraction & Auto-Deduct Preview */}
                <div className="md:col-span-2 p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Auto-Split Cover Logic:</strong> ຕັດ {activeItem.coverPagesCount || 4} ໜ້າປົກອອກຈາກຍອດເຈ້ຍເນື້ອໃນ ({activeItem.pagesPerBook || 100} ໜ້າລວມ ➜ ເນື້ອໃນຈິງ {Math.max(0, (activeItem.pagesPerBook || 100) - (activeItem.coverPagesCount || 4))} ໜ້າ)
                    </span>
                  </div>
                  <span className="font-bold text-emerald-700 font-mono text-[10px] bg-white px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                    ບໍ່ຄິດໄລ່ຕົ້ນທຶນຊ້ຳຊ້ອນ
                  </span>
                </div>
              </div>
            )}
          </div>
          )}

          {/* SECTION 2: PAPER SUBSTRATE SELECTION (ປັບຕາມປະເພດວຽກ: ຮູບພາບ ຫຼື ປຶ້ມ) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {isBatchPhoto 
                    ? (currentLang === 'lo' ? 'ເຈ້ຍພິມຮູບພາບ (Photo Substrate Paper) *' : 'Photo Substrate Paper *')
                    : (currentLang === 'lo' ? 'ເຈ້ຍເນື້ອໃນ (Inner Pages Paper) *' : 'Inner Pages Paper *')}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                  {isBatchPhoto
                    ? `ຮູບ ${activeCalc.photoCountPerSet || activeItem.pagesPerBook || 1} ໃບ/ຊຸດ (${activeCalc.cutsPerSheet} ຮູບ/ແຜ່ນແມ່)`
                    : `ເນື້ອໃນ ${activeCalc.innerPagesPerBook || activeItem.pagesPerBook || 1} ໜ້າ (${activeCalc.innerSheetsPerBook || 1} ແຜ່ນ/ເລັ້ມ)`}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenPaperSearch('inner')}
                  className="text-[10px] font-black text-sky-800 hover:text-white bg-sky-100 hover:bg-sky-600 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Search className="w-3 h-3" />
                  <span>ຄົ້ນຫາໃນຄັງ</span>
                </button>
              </div>
            </div>

            <select
              value={activeItem.paperId}
              onChange={(e) => updateActiveItem({ paperId: e.target.value })}
              className="w-full min-h-[44px] px-3.5 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 text-xs bg-white font-semibold font-sans shadow-xs"
            >
              {papers.map(p => {
                const fifoCost = getFIFOCostPerSheet(p.id, 1);
                const price = fifoCost > 0 
                  ? fifoCost 
                  : (Number(p.costPerConsumptionUnit) || Number(p.costPerSheet) || (Number(p.costPerPurchaseUnit) && Number(p.purchaseMultiplier) ? Number(p.costPerPurchaseUnit) / Number(p.purchaseMultiplier) : 0) || Number(p.unitCost) || 184);
                const stock = p.stockQty !== undefined ? p.stockQty : (p.stock_qty || 0);
                const gsm = p.gsm || p.specs?.grammageGsm || p.specs?.grammage;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} {gsm ? `(${gsm} gsm)` : ''} — ຕົ້ນທຶນ: {formatCurrency(price)}/ແຜ່ນ [{Number(stock).toLocaleString()} in stock]
                  </option>
                );
              })}
            </select>

            {/* Parent Sheet Imposition Preset Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {currentLang === 'lo' ? 'ຂະໜາດແຜ່ນແມ່ພິມ (Parent Sheet Mode):' : 'Parent Sheet Imposition:'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {activeItem.parentSheetSize === '31x43'
                      ? (currentLang === 'lo' ? 'ຕັດແບ່ງຈາກແຜ່ນໃຫຍ່ໂຮງງານ 31x43 ນິ້ວ (787 × 1092 mm)' : 'Cut from Parent Sheet 31x43" (787 × 1092 mm)')
                      : (currentLang === 'lo' ? 'ຂະໜາດເຈ້ຍມາດຕະຖານຕາມສະເປກ (A3 / A4 Cut Sheet)' : 'Standard Cut Sheet (A3/A4/Cut Sheet)')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => updateActiveItem({ parentSheetSize: 'standard' })}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                    activeItem.parentSheetSize !== '31x43'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {currentLang === 'lo' ? 'ມາດຕະຖານ' : 'Standard'}
                </button>
                <button
                  type="button"
                  onClick={() => updateActiveItem({ parentSheetSize: '31x43' })}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1 ${
                    activeItem.parentSheetSize === '31x43'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>31×43" (787×1092 mm)</span>
                </button>
              </div>
            </div>

            {/* Warehouse Offcuts Selector & Scrap Paper Rebate */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                    activeItem.useOffcutRebate ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wide block">
                      {currentLang === 'lo' ? 'ດຶງເສດເຈ້ຍໃນຄັງມາໃຊ້ (Warehouse Offcuts Rebate)' : 'Warehouse Offcuts Rebate'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {activeItem.useOffcutRebate 
                        ? (currentLang === 'lo' ? 'ນຳເສດເຈ້ຍເຫຼືອໃຊ້ໃນຄັງມາຕັດ ເພື່ອຫຼຸດຕົ້ນທຶນ' : 'Apply scrap/offcut deduction from inventory') 
                        : (currentLang === 'lo' ? 'ໃຊ້ເຈ້ຍໃໝ່ເຕັມແຜ່ນປົກກະຕິ' : 'Use fresh full sheets')}
                    </span>
                  </div>
                </div>

                {/* Switch */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold transition select-none ${activeItem.useOffcutRebate ? 'text-emerald-900 font-black' : 'text-slate-400'}`}>
                    {activeItem.useOffcutRebate ? (currentLang === 'lo' ? 'ເປີດໃຊ້' : 'ON') : (currentLang === 'lo' ? 'ປິດ' : 'OFF')}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(activeItem.useOffcutRebate)}
                    onClick={() => updateActiveItem({ 
                      useOffcutRebate: !activeItem.useOffcutRebate,
                      offcutRebateAmount: !activeItem.useOffcutRebate ? (activeItem.offcutRebateAmount || 5000) : 0
                    })}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none cursor-pointer shadow-inner ${
                      activeItem.useOffcutRebate ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 flex items-center justify-center ${
                        activeItem.useOffcutRebate ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    >
                      {activeItem.useOffcutRebate && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                    </div>
                  </button>
                </div>
              </div>

              {activeItem.useOffcutRebate && (
                <div className="pt-2 border-t border-emerald-200/60 space-y-2 animate-fade-in text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Offcut Item Picker if available */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-emerald-900 block">
                        {currentLang === 'lo' ? 'ເລືອກເສດເຈ້ຍຈາກຄັງ (Offcut Stock):' : 'Select Offcut Material:'}
                      </label>
                      <select
                        value={activeItem.selectedOffcutId || ''}
                        onChange={(e) => updateActiveItem({ selectedOffcutId: e.target.value })}
                        className="w-full min-h-[38px] px-2.5 py-1.5 border border-emerald-300 rounded-xl focus:outline-none text-xs bg-white font-semibold font-sans shadow-2xs"
                      >
                        <option value="">-- ເສດເຈ້ຍທົ່ວໄປ (General Scrap) --</option>
                        {(offcuts.length > 0 ? offcuts : papers.filter(p => p.category === 'offcut')).map(oc => (
                          <option key={oc.id} value={oc.id}>
                            {oc.name} {oc.specs?.width && oc.specs?.height ? `(${oc.specs.width}x${oc.specs.height}mm)` : ''} [{(oc.stockQty || 0).toLocaleString()} ແຜ່ນ]
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Rebate Amount Input */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-emerald-900 block">
                          {currentLang === 'lo' ? 'ມູນຄ່າສ່ວນຫຼຸດເສດເຈ້ຍ (LAK):' : 'Rebate Discount (LAK):'}
                        </label>
                        {Number(activeItem.offcutRebateAmount || 0) > 0 && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 px-1.5 py-0.2 rounded font-sans">
                            -{formatCurrency(Number(activeItem.offcutRebateAmount))}
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={activeItem.offcutRebateAmount || 0}
                        onChange={(e) => updateActiveItem({ offcutRebateAmount: Math.max(0, Number(e.target.value)) })}
                        className="w-full min-h-[38px] px-2.5 py-1.5 border border-emerald-300 rounded-xl focus:outline-none text-xs bg-white font-bold font-mono text-emerald-950 shadow-2xs"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Quick Rebate Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-emerald-800 font-bold">ປັບດ່ວນ:</span>
                    {[3000, 5000, 10000, 20000, 50000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => updateActiveItem({ offcutRebateAmount: amt })}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          activeItem.offcutRebateAmount === amt
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        -{formatCurrency(amt)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: CUTTING & YIELD CALCULATION BOX (ສະຫຼຸບການຕັດ & ຕົ້ນທຶນ) */}
          <div className="p-4 bg-sky-50/90 border border-sky-200 rounded-2xl text-xs space-y-2.5 shadow-2xs">
            <div className="flex flex-wrap justify-between items-center gap-2 text-sky-950 font-black">
              <span className="flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-sky-600" />
                <span>ສະຫຼຸບການໃຊ້ເຈ້ຍ & ການຕັດ ({activeItem.name})</span>
              </span>

              {/* Manual Override for Cuts Per Sheet */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-sky-300 shadow-2xs">
                <span className="text-[11px] text-slate-600 font-medium">1 ແຜ່ນແມ່ ຕັດໄດ້:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const current = activeCalc.cutsPerSheet || 1;
                      const next = Math.max(1, current - 1);
                      updateActiveItem({ cutsPerSheetOverride: next });
                    }}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center text-xs cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={activeItem.cutsPerSheetOverride !== undefined ? activeItem.cutsPerSheetOverride : activeCalc.cutsPerSheet}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      updateActiveItem({ cutsPerSheetOverride: v > 0 ? v : undefined });
                    }}
                    className="w-10 text-center font-mono font-black text-xs text-sky-900 border border-sky-200 rounded py-0.5 focus:outline-none focus:border-sky-500 bg-sky-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const current = activeCalc.cutsPerSheet || 1;
                      updateActiveItem({ cutsPerSheetOverride: current + 1 });
                    }}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center text-xs cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-sky-900 font-bold">ແຜ່ນງານ</span>
                {activeItem.cutsPerSheetOverride !== undefined && (
                  <button
                    type="button"
                    onClick={() => updateActiveItem({ cutsPerSheetOverride: undefined })}
                    className="ml-1 text-[9px] text-rose-600 hover:underline font-bold"
                    title="ຄືນຄ່າ Auto"
                  >
                    (Auto)
                  </button>
                )}
              </div>
            </div>
            
              {/* Imposition Plan Notice if provided */}
              {activeItem.impositionSummary && (
                <div className="p-2.5 bg-white border border-sky-300/80 rounded-xl text-[11px] text-sky-900 font-semibold shadow-2xs">
                  <span className="font-bold text-sky-950 block mb-0.5">ແຜນ Imposition Layout:</span>
                  <span>{activeItem.impositionSummary}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>{isBatchPhoto ? 'ຕົ້ນທຶນເຈ້ຍພິມຮູບຕໍ່ແຜ່ນແມ່:' : 'ຕົ້ນທຶນເຈ້ຍເນື້ອໃນຕໍ່ແຜ່ນແມ່:'}</span>
                <span className="font-sans font-bold text-slate-900">{formatCurrency(activeCalc.paperUnitCost)} / ແຜ່ນ</span>
              </div>
              <div className="flex justify-between">
                <span>{isBatchPhoto ? 'ຈຳນວນຮູບທັງໝົດທີ່ຕ້ອງພິມ:' : 'ແຜ່ນເນື້ອໃນທີ່ຕ້ອງໃຊ້ (Base Sheets):'}</span>
                <span className="font-sans font-bold text-slate-900">
                  {isBatchPhoto 
                    ? `${(activeCalc.totalPhotos || activeCalc.totalInnerSheets || activeItem.pagesPerBook || 1).toLocaleString()} ຮູບ`
                    : `${(activeCalc.totalInnerSheets || activeCalc.parentSheetsNeeded || 1).toLocaleString()} ແຜ່ນງານ`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{isBatchPhoto ? 'ຈຳນວນແຜ່ນແມ່ທີ່ຕ້ອງໃຊ້ພິມ:' : 'ຈຳນວນແຜ່ນແມ່ທີ່ຕ້ອງຕັດ (Parent Sheets):'}</span>
                <span className="font-sans font-bold text-sky-900">{activeCalc.parentSheetsNeeded?.toLocaleString()} ແຜ່ນແມ່</span>
              </div>
              <div className="space-y-2 pt-1 border-t border-sky-200/50">
                <div className="flex justify-between items-center text-amber-900 font-semibold">
                  <div className="flex items-center gap-2">
                    {/* Spoilage ON/OFF Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => updateActiveItem({ useSpoilage: activeItem.useSpoilage === false ? true : false })}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                        activeItem.useSpoilage !== false ? 'bg-amber-500' : 'bg-slate-300'
                      }`}
                      title={activeItem.useSpoilage !== false ? 'ປິດການເຜື່ອເສຍ' : 'ເປີດການເຜື່ອເສຍ'}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-xs ${
                        activeItem.useSpoilage !== false ? 'translate-x-4.5' : 'translate-x-1'
                      }`} />
                    </button>
                    <span className="text-xs font-bold text-slate-700">
                      ເຜື່ອເສຍຫາຍ (Spoilage):
                    </span>
                    {activeItem.useSpoilage !== false ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded font-sans">
                        {activeCalc.itemSpoilageRate}% ({activeItem.spoilagePercent !== undefined ? 'Custom' : 'Auto Tier'})
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-sans">
                        ປິດ (+0 ແຜ່ນ)
                      </span>
                    )}
                  </div>
                  <span className={`font-sans font-bold ${activeItem.useSpoilage !== false ? 'text-amber-900' : 'text-slate-400'}`}>
                    +{activeCalc.wastedSheets?.toLocaleString() || 0} ແຜ່ນ
                  </span>
                </div>

                {/* When Spoilage is Enabled: Chips & Custom Input */}
                {activeItem.useSpoilage !== false && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 bg-amber-50/60 p-2 rounded-xl border border-amber-200/60">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold">ປັບ %:</span>
                      {[
                        { label: 'Auto Tier', val: undefined },
                        { label: '3%', val: 3 },
                        { label: '5%', val: 5 },
                        { label: '7%', val: 7 },
                        { label: '10%', val: 10 },
                        { label: '15%', val: 15 },
                      ].map(chip => {
                        const isSelected = chip.val === undefined 
                          ? activeItem.spoilagePercent === undefined 
                          : activeItem.spoilagePercent === chip.val;
                        return (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => updateActiveItem({ spoilagePercent: chip.val })}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:bg-amber-100 border border-slate-200'
                            }`}
                          >
                            {chip.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom numeric input */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500 font-bold">ກຳນົດເອງ:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="%"
                        value={activeItem.spoilagePercent !== undefined ? activeItem.spoilagePercent : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? undefined : Math.max(0, Math.min(100, Number(e.target.value)));
                          updateActiveItem({ spoilagePercent: val });
                        }}
                        className="w-14 px-1.5 py-0.5 bg-white border border-amber-300 rounded text-right font-black font-sans text-amber-950 text-xs shadow-2xs focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[10px] font-bold text-amber-900">%</span>
                    </div>
                  </div>
                )}
              </div>
              {/* Clear Distinction: Customer Pieces vs Imposition Cuts vs Warehouse Parent Sheets */}
              {(() => {
                const name = (activeItem.name || '').toLowerCase();
                const tpl = (activeItem.selectedTemplateId || '').toLowerCase();
                let jobUnit = activeItem.unitName || 'ຊິ້ນ';
                if (!activeItem.unitName) {
                  if (name.includes('card') || name.includes('ບັດ') || tpl.includes('card')) jobUnit = 'ໃບ';
                  else if (name.includes('book') || name.includes('ປຶ້ມ') || tpl.includes('book') || activeItem.includeCover) jobUnit = 'ຫົວ';
                  else if (name.includes('photo') || name.includes('ຮູບ') || tpl.includes('photo')) jobUnit = 'ຮູບ';
                }

                const totalPieces = Number(activeItem.printVolume || 1);
                const cuts = Math.max(1, Number(activeCalc.cutsPerSheet || 1));
                const reqSheets = Math.ceil(totalPieces / cuts);
                const totalSheets = Number(activeCalc.totalParentSheets || reqSheets);
                const spoilSheets = Math.max(0, totalSheets - reqSheets);

                return (
                  <div className="bg-white border border-sky-200/80 rounded-2xl p-3 space-y-2.5 shadow-2xs mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-black text-slate-800">
                        <Layers className="w-3.5 h-3.5 text-sky-600" />
                        <span>ອັດຕາສ່ວນການຈັດວາງຕັດ (Job Items ⟶ Parent Sheets)</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                        {cuts} {jobUnit}/ແຜ່ນແມ່
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">1. ຍອດສັ່ງລູກຄ້າ</span>
                        <strong className="text-sm font-black text-slate-900 font-sans block mt-0.5">
                          {totalPieces.toLocaleString()} {jobUnit}
                        </strong>
                        <span className="text-[10px] text-slate-400">ຊິ້ນງານສຳເລັດຮູບ</span>
                      </div>

                      <div className="p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">2. ອັດຕາການຕັດ</span>
                        <strong className="text-sm font-black text-sky-700 font-sans block mt-0.5">
                          ຕັດໄດ້ {cuts} {jobUnit}
                        </strong>
                        <span className="text-[10px] text-slate-400">ຕໍ່ 1 ແຜ່ນແມ່ໃຫຍ່</span>
                      </div>

                      <div className="p-2 bg-sky-50 border border-sky-300 rounded-xl">
                        <span className="text-[10px] font-bold text-sky-800 uppercase block">3. ແຜ່ນແມ່ທີ່ຕ້ອງຕັດ</span>
                        <strong className="text-sm font-black text-indigo-700 font-sans block mt-0.5">
                          {totalSheets.toLocaleString()} ແຜ່ນແມ່
                        </strong>
                        <span className="text-[10px] text-slate-600">
                          (ພິມ {reqSheets} + ເສຍ {spoilSheets})
                        </span>
                      </div>
                    </div>

                    <div className="px-2.5 py-1.5 bg-sky-50/70 border border-sky-100 rounded-lg text-[11px] font-mono text-sky-950 font-bold flex items-center justify-between">
                      <span>ສູດ: ⌈ {totalPieces.toLocaleString()} {jobUnit} ÷ {cuts} ⌉ + ເຜື່ອເສຍ {spoilSheets} = {totalSheets.toLocaleString()} ແຜ່ນແມ່</span>
                      <span className="text-[10px] text-emerald-700 font-sans font-black flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> ແຍກຊັດເຈນ
                      </span>
                    </div>
                  </div>
                );
              })()}

              {Boolean(activeItem.useOffcutRebate && (activeCalc.offcutRebate || activeItem.offcutRebateAmount)) && (
                <div className="flex justify-between items-center text-emerald-800 font-bold border-t border-emerald-200/80 pt-1.5">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ສ່ວນຫຼຸດເສດເຈ້ຍໃນຄັງ (Offcut Rebate):</span>
                  </span>
                  <span className="font-sans font-black text-emerald-700">-{formatCurrency(Number(activeCalc.offcutRebate || activeItem.offcutRebateAmount || 0))}</span>
                </div>
              )}

            <div className="flex justify-between items-center bg-sky-100/80 p-2.5 rounded-xl text-sky-950 font-black border border-sky-200">
              <span className="text-xs">
                {isBatchPhoto 
                  ? 'ມູນຄ່າຕົ້ນທຶນເຈ້ຍພິມຮູບພາບລວມ:'
                  : `ມູນຄ່າຕົ້ນທຶນເຈ້ຍລວມ ${isCoverActive ? '(ເນື້ອໃນ + ປົກ)' : ''}:`}
              </span>
              <span className="text-base font-sans text-sky-950 font-black">{formatCurrency(activeCalc.paperCost)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
