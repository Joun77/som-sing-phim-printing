import React from 'react';
import { Printer, Palette } from 'lucide-react';
import { PaperAndCoverSection } from '../PaperAndCoverSection';
import ManualPrinterAllocator from '@features/orders/components/ManualPrinterAllocator';
import { calculateEquipmentPrintCost } from '@utils/machineCostCalculator';
import type { QuotationItem } from '../QuotationManager';

interface QuotationPrintEngineTabProps {
  sourceLocked?: boolean;
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
  sourceLocked = false,
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

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Paper Selection */}
      <PaperAndCoverSection
        sourceLocked={sourceLocked}
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
