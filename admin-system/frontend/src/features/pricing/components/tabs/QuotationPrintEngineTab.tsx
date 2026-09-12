import React, { useRef } from 'react';
import { 
  Printer, 
  Palette, 
  Images, 
  CheckCircle2, 
  Upload, 
  Eye 
} from 'lucide-react';
import { PaperAndCoverSection } from '../PaperAndCoverSection';
import ManualPrinterAllocator from '@features/orders/components/ManualPrinterAllocator';
import { calculateEquipmentPrintCost } from '@utils/machineCostCalculator';
import type { QuotationItem } from '../QuotationManager';

interface QuotationPrintEngineTabProps {
  activeItem: QuotationItem;
  updateActiveItem: (patch: Partial<QuotationItem>) => void;
  activeCalc: any;
  papers: any[];
  offcuts: any[];
  inventory: any[];
  printers: any[];
  printerColorLinks: any;
  onOpenPaperModal: (target: 'inner' | 'cover') => void;
  onOpenPrinterModal: () => void;
  onOpenColorPreview: (item: QuotationItem) => void;
  formatCurrency: (val: number) => string;
  getFIFOCostPerSheet: (paperId: string, sheetsNeeded?: number) => number;
  currentLang: string;
  t: (key: string) => string;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const QuotationPrintEngineTab: React.FC<QuotationPrintEngineTabProps> = ({
  activeItem,
  updateActiveItem,
  activeCalc,
  papers,
  offcuts,
  inventory,
  printers,
  printerColorLinks,
  onOpenPaperModal,
  onOpenPrinterModal,
  onOpenColorPreview,
  formatCurrency,
  getFIFOCostPerSheet,
  currentLang,
  t,
  showToast,
}) => {
  const itemFileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Paper Selection */}
      <PaperAndCoverSection
        activeItem={activeItem}
        updateActiveItem={updateActiveItem}
        activeCalc={activeCalc}
        papers={papers}
        offcuts={offcuts}
        isOpen={true}
        onToggle={() => {}}
        onOpenPaperSearch={(target) => onOpenPaperModal(target)}
        formatCurrency={formatCurrency}
        getFIFOCostPerSheet={getFIFOCostPerSheet}
        currentLang={currentLang}
        t={t}
      />

      {/* Printing Process & Ink Setup */}
      <div id="sec-phase4" className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs">
        <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-sans font-black text-xs shadow-xs">4</span>
            <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
              {currentLang === 'lo' ? 'ເຄື່ອງພິມ & ລະບົບສີ (Printers & Ink)' : 'Printing Process & Ink'}
            </span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 font-sans flex items-center gap-1">
            <Printer className="w-3 h-3" />
            {activeItem.printerAllocations?.length || 1} ເຄື່ອງ • {activeItem.colorPrintMode === 'MONO_K' ? 'Mono K' : 'CMYK'}
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Artwork & Preflight Status Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gradient-to-r from-indigo-50/90 to-sky-50/90 border border-indigo-200/80 rounded-2xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                {activeItem.batchFiles && activeItem.batchFiles.length > 1 ? (
                  <Images className="w-4 h-4" />
                ) : (
                  <Palette className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 truncate">
                    {activeItem.batchFiles && activeItem.batchFiles.length > 1
                      ? `ຊຸດໄຟລ໌ (${activeItem.batchFiles.length} ໄຟລ໌ / ຮູບ)`
                      : (activeItem.fileName || (activeItem.preflightData ? 'ໄຟລ໌ກວດສອບ Preflight' : 'ຄ່າສີມາດຕະຖານ'))}
                  </span>
                  {activeItem.batchFiles && activeItem.batchFiles.length > 1 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-900 text-[10px] font-black font-mono">
                      {activeItem.batchFiles.length} ໄຟລ໌ (ສູງສຸດ 100)
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-900 text-[10px] font-black font-mono">
                    C:{Math.round(activeItem.cCoverage ?? 15)}% M:{Math.round(activeItem.mCoverage ?? 15)}% Y:{Math.round(activeItem.yCoverage ?? 15)}% K:{Math.round(activeItem.kCoverage ?? 15)}%
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  {activeItem.batchFiles && activeItem.batchFiles.length > 1
                    ? 'ຄ່າສີສະເລ່ຍຖົວສະເລ່ຍຈາກທຸກໄຟລ໌ໃນລາຍການນີ້ (1 ລາຍການຫຼັກ)'
                    : (currentLang === 'lo' ? 'ຄ່າສີນີ້ຖືກຊິງຄ໌ກັບແຖບສີຂອງເຄື່ອງພິມໂດຍອັດຕະໂນມັດ' : 'CMYK coverage automatically synced with printer')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Hidden input for multi-file upload */}
              <input
                ref={itemFileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const rawFiles = e.target.files;
                  if (!rawFiles || rawFiles.length === 0) return;
                  const files = Array.from(rawFiles).slice(0, 100);
                  const newItems = files.map(f => ({
                    name: f.name,
                    url: URL.createObjectURL(f),
                    size: f.size,
                    mimeType: f.type || (f.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
                  }));
                  const newBatch = [...(activeItem.batchFiles || []), ...newItems].slice(0, 100);
                  const totalSize = newBatch.reduce((acc, cur) => acc + (cur.size || 0), 0);
                  updateActiveItem({
                    batchFiles: newBatch,
                    artworkUrl: newBatch[0]?.url || activeItem.artworkUrl,
                    fileName: newBatch.length > 1 ? `ຊຸດໄຟລ໌ (${newBatch.length} ໄຟລ໌)` : (newBatch[0]?.name || activeItem.fileName),
                    fileSize: totalSize,
                    printVolume: newBatch.length > 1 && (activeItem.printVolume === 1 || !activeItem.includeCover) ? newBatch.length : activeItem.printVolume,
                  });
                  if (showToast) {
                    showToast(`ອັບໂຫຼດ ${files.length} ໄຟລ໌ເຂົ້າໃນລາຍການສຳເລັດ! (ລວມ ${newBatch.length} ໄຟລ໌)`, 'success');
                  }
                }}
              />

              {(activeItem.batchFiles && activeItem.batchFiles.length > 0) || activeItem.artworkUrl ? (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black flex items-center gap-1 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ໄຟລ໌ພ້ອມພິມ ({activeItem.batchFiles?.length || 1} ໄຟລ໌)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => itemFileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200"
                    title="ປ່ຽນ ຫຼື ເພີ່ມໄຟລ໌"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>ປ່ຽນໄຟລ໌</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => itemFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="ອັບໂຫຼດໄຟລ໌ດຽວ ຫຼື ຫຼາຍໄຟລ໌ພ້ອມກັນ (ສູງສຸດ 100 ໄຟລ໌)"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ ອັບໂຫຼດໄຟລ໌ (1-100)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenColorPreview(activeItem)}
                className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{currentLang === 'lo' ? 'ກວດສອບໄຟລ໌ & ສີ' : 'Inspect Colors'}</span>
              </button>
            </div>
          </div>

          <ManualPrinterAllocator
            targetQuantity={activeCalc.totalProductionSheets || ((Number(activeItem.printVolume) || 1) * Math.ceil(Math.max(1, Number(activeItem.pagesPerBook || 1)) / ((activeItem.isDoubleSided || activeItem.printerAllocations?.some(a => a.is_double_sided)) ? 2 : 1)))}
            allocations={activeItem.printerAllocations}
            availablePrinters={printers.map(p => {
              const prnCost = calculateEquipmentPrintCost(p, printerColorLinks, inventory, 'Printer');
              return {
                id: p.id,
                name: p.name || p.id,
                cost_per_page: prnCost.netCostPerUnit,
                ink_cost_per_page: Number(p.colorInkCost || p.linkedInkCostPerPage || prnCost.linkedInkRatePerPage || 0),
                printerCategory: p.category,
                colorSchemeType: 'CMYK'
              };
            })}
            onAllocationsChange={(newAllocations) => updateActiveItem({ printerAllocations: newAllocations })}
            onOpenPrinterModal={onOpenPrinterModal}
            activeCalc={activeCalc}
            jobSizePreset={activeItem.jobSizePreset || 'A4'}
            paperSizeName={inventory.find(p => p.id === activeItem.paperId)?.name}
          />

          {/* SIMPLIFIED PRINT & INK COST SUMMARY CARD (UNIFIED TOTAL WITHOUT 3-ITEM DETAILED BREAKDOWN) */}
          <div className="p-4 bg-purple-50/90 border border-purple-200 rounded-2xl text-xs space-y-2.5 shadow-xs">
            <div className="flex justify-between items-center text-purple-950 font-black">
              <span className="flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-purple-600" />
                <span>ສະຫຼຸບຕົ້ນທຶນການພິມເຄື່ອງຈັກ (Print Engine Cost)</span>
              </span>
              <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 rounded-md font-bold font-sans">
                {activeItem.printerAllocations?.length || 1} ເຄື່ອງພິມ
              </span>
            </div>
            
            <div className="p-3 bg-white border border-purple-200/80 rounded-xl flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-black text-purple-900 block">
                  ຕົ້ນທຶນການພິມລວມ (ໝຶກ + ເຄື່ອງຈັກ):
                </span>
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                  ຄິດໄລ່ລວມນ້ຳໝຶກຈິງ ({formatCurrency(activeCalc.inkCost)}) + ຄ່າເສື່ອມເຄື່ອງ & ອາໄຫຼ່ ({formatCurrency(activeCalc.machineOverhead)})
                </span>
              </div>
              <div className="text-right">
                <span className="font-sans font-black text-purple-950 text-base block">
                  {formatCurrency(activeCalc.inkCost + activeCalc.machineOverhead)}
                </span>
                {activeCalc.totalProductionSheets > 0 && (
                  <span className="text-[11px] text-purple-700 font-bold block font-mono">
                    ({formatCurrency(Math.round((activeCalc.inkCost + activeCalc.machineOverhead) / activeCalc.totalProductionSheets))} /ແຜ່ນ)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
