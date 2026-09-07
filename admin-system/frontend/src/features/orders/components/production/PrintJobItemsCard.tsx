import React, { useState } from 'react';
import { Layers, Printer, Sparkles, RefreshCw, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useApp } from '@store/AppContext';
import { PrinterSelectorModal } from '@features/pricing/components/PrinterSelectorModal';

interface PrintJobItemsCardProps {
  items?: any[];
  orderSpecs?: any;
  orderId?: string;
  onUpdateOrderItemMachine?: (itemIdx: number, printerId: string, printerName: string) => void;
  currentLang: string;
}

export const PrintJobItemsCard: React.FC<PrintJobItemsCardProps> = ({
  items,
  orderSpecs,
  orderId,
  onUpdateOrderItemMachine,
  currentLang,
}) => {
  const { equipment = [], showToast, updateOrderDetails } = useApp();

  // Filter equipment to printers only
  const printerEquipment = equipment.filter(
    (e: any) => e.category === 'Printer' || (e.category || '').toLowerCase().includes('print')
  );

  const [activeItemIndexForPrinter, setActiveItemIndexForPrinter] = useState<number | null>(null);
  const [pendingPrinterChange, setPendingPrinterChange] = useState<{ itemIdx: number; printer: any } | null>(null);

  const displayItems = Array.isArray(items) && items.length > 0 ? items : [
    {
      name: orderSpecs?.product_name || orderSpecs?.name || 'Custom Booklet / Document Print',
      quantity: orderSpecs?.quantity || 1,
      paperType: orderSpecs?.paperType || orderSpecs?.paper || 'Art Card 260g',
      paperSize: orderSpecs?.size || 'A4',
      pages: orderSpecs?.pages || 16,
      binding: orderSpecs?.binding || 'Saddle Stitch',
      lamination: orderSpecs?.lamination || 'Matte Lamination',
      machine: orderSpecs?.machine || 'Canon imagePRESS C165',
    }
  ];

  const handleSelectPrinter = (itemIdx: number, printer: any) => {
    // Open confirmation dialog explaining that customer price stays locked while realized cost adapts
    setPendingPrinterChange({ itemIdx, printer });
  };

  const handleConfirmPrinterSwitch = () => {
    if (!pendingPrinterChange) return;
    const { itemIdx, printer } = pendingPrinterChange;
    
    if (onUpdateOrderItemMachine) {
      onUpdateOrderItemMachine(itemIdx, printer.id, printer.name);
    } else if (orderSpecs && orderSpecs.id) {
      const updatedItems = [...displayItems];
      if (updatedItems[itemIdx]) {
        updatedItems[itemIdx] = {
          ...updatedItems[itemIdx],
          machine: printer.name,
          printerId: printer.id,
          printer_name: printer.name,
          printer_id: printer.id,
        };
        if (updateOrderDetails) {
          updateOrderDetails(orderSpecs.id, {
            ...orderSpecs,
            items: updatedItems,
            allocated_printer_id: printer.id,
            allocated_printer_name: printer.name,
          });
        }
      }
    }

    showToast(
      currentLang === 'lo'
        ? `ປ່ຽນແທ່ນພິມເປັນ "${printer.name}" ສຳເລັດ! (ລາຄາຂາຍລູກຄ້າຖືກລັອກຄົງທີ່)`
        : `Switched press to "${printer.name}". Customer billing price remains securely locked.`,
      'success'
    );

    setPendingPrinterChange(null);
    setActiveItemIndexForPrinter(null);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider block">Job Ticket Specs</span>
            <h3 className="text-sm font-black text-slate-900">
              {currentLang === 'lo' ? 'ລາຍລະອຽດ & ຈຳນວນສັ່ງພິມ (Item Specifications)' : 'Print Items & Quantities'}
            </h3>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
          {displayItems.length} {currentLang === 'lo' ? 'ລາຍການ' : 'Items'}
        </span>
      </div>

      {/* Items List */}
      <div className="space-y-4 divide-y divide-slate-100">
        {displayItems.map((it: any, idx: number) => {
          // Accurate 3-level quantity units
          const qty = Number(it.quantity || it.qty || 1);
          const batchFiles = Array.isArray(it.batch_files) ? it.batch_files : (Array.isArray(it.specifications?.batch_files) ? it.specifications.batch_files : (Array.isArray(it.specs?.batch_files) ? it.specs.batch_files : []));
          const batchCount = batchFiles.length;
          const pages = Number(it.page_count || it.pages || it.specifications?.pages || (batchCount > 0 ? batchCount : 1));
          
          const totalPhotosOrUnits = batchCount > 0 ? (qty * batchCount) : (qty * pages);
          const cutsPerSheet = Number(it.cuts_per_sheet || it.specifications?.cuts_per_sheet || 1);
          const sheetsToPrint = it.total_parent_sheets || it.specifications?.parent_sheets || Math.ceil(totalPhotosOrUnits / cutsPerSheet);

          // Paper brand & specification breakdown
          const paperBrand = it.paper_brand || it.specifications?.paper_brand || it.specs?.paper_brand || '';
          const paperType = it.paperType || it.paper || it.material || it.paper_name || it.specifications?.paper_name || 'Art Card 260g';
          const paperWeight = it.paper_weight_gsm || it.specifications?.paper_weight || it.specs?.paper_weight || '';
          const size = it.paperSize || it.size || it.specifications?.paperSize || 'A4';
          
          // Binding: hide if none, empty or not configured
          const rawBinding = it.binding || it.bindingType || it.bindingMethod || it.specifications?.binding;
          const hasBinding = Boolean(rawBinding && rawBinding !== 'none' && rawBinding !== 'None' && rawBinding !== 'ບໍ່ເຂົ້າເລ່ມ' && rawBinding !== 'N/A');
          const binding = hasBinding ? rawBinding : null;

          // Coating: hide if none, empty or not configured
          const rawCoating = it.lamination || it.coating || it.specifications?.coating;
          const hasCoating = Boolean(rawCoating && rawCoating !== 'none' && rawCoating !== 'None' && rawCoating !== 'ບໍ່ເຄືອບ' && rawCoating !== 'N/A');
          const lamination = hasCoating ? rawCoating : null;

          const colorMode = it.colorPrintMode || it.colorMode || it.specifications?.color_mode || 'CMYK';
          const colorModeText = colorMode === 'MONO_K' || colorMode === 'Monochrome' ? 'ຂາວດຳ (Mono K)' : 'ສີ (CMYK Full Color)';
          
          // Machine allocation
          const currentMachine = it.machine || it.printer_name || it.printerName || it.printerId || orderSpecs?.allocated_printer_name || 'Canon imagePRESS C165';

          return (
            <div key={idx} className={`pt-4 space-y-3 ${idx === 0 ? 'pt-0' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>{it.name || it.item_name || `ລາຍການສັ່ງພິມ #${idx + 1}`}</span>
                  </h4>
                  
                  {/* Interactive Press Allocation Tag */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">
                      ແທ່ນພິມ (Press Allocation):
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveItemIndexForPrinter(idx)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-black transition active:scale-95 cursor-pointer shadow-2xs"
                      title="ຄລິກເພື່ອປ່ຽນແທ່ນພິມຕົວຈິງໃນຮ້ານ"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span>{currentMachine}</span>
                      <RefreshCw className="w-3 h-3 text-blue-500 ml-0.5" />
                    </button>
                  </div>
                </div>

                {/* 3-Dimensional Quantity Display */}
                <div className="flex items-center gap-2 sm:self-start">
                  <div className="text-right bg-amber-50/80 border border-amber-200 px-3 py-1.5 rounded-2xl">
                    <span className="text-[10px] text-amber-800 uppercase block font-bold">
                      {batchCount > 0 ? 'ຈຳນວນຊຸດ (Sets)' : 'ຈຳນວນພິມ (Qty)'}
                    </span>
                    <span className="font-mono text-sm font-black text-amber-700 block">
                      {qty.toLocaleString()} {currentLang === 'lo' ? 'ຊຸດ/ເຊັດ' : 'sets'}
                    </span>
                  </div>

                  <div className="text-right bg-sky-50/80 border border-sky-200 px-3 py-1.5 rounded-2xl">
                    <span className="text-[10px] text-sky-800 uppercase block font-bold">
                      {batchCount > 0 ? 'ຮູບລວມ (Photos)' : 'ໜ້າລວມ (Pages)'}
                    </span>
                    <span className="font-mono text-sm font-black text-sky-700 block">
                      {totalPhotosOrUnits.toLocaleString()} {batchCount > 0 ? 'ຮູບ/ໃບ' : 'ໜ້າ'}
                    </span>
                  </div>

                  <div className="text-right bg-emerald-50/80 border border-emerald-200 px-3 py-1.5 rounded-2xl">
                    <span className="text-[10px] text-emerald-800 uppercase block font-bold">
                      ແຜ່ນພິມໃຫຍ່ (Sheets)
                    </span>
                    <span className="font-mono text-sm font-black text-emerald-700 block">
                      {sheetsToPrint.toLocaleString()} ແຜ່ນ
                    </span>
                  </div>
                </div>
              </div>

              {/* Spec Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* Paper & Brand */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    ເນື້ອເຈ້ຍ & ແບຣນ (Paper Brand & Weight)
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 truncate">
                    {paperBrand && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-black text-[10px] uppercase">
                        {paperBrand}
                      </span>
                    )}
                    <strong className="text-slate-900 text-xs font-bold truncate">
                      {paperType} {paperWeight ? `(${paperWeight}gsm)` : ''}
                    </strong>
                  </div>
                </div>

                {/* Size */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">ຂະໜາດ (Size)</span>
                  <strong className="text-slate-800 text-xs font-bold block truncate mt-0.5">{size}</strong>
                </div>

                {/* Color Mode */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">ລະບົບສີ (Color)</span>
                  <strong className="text-slate-800 text-xs font-bold block truncate mt-0.5">{colorModeText}</strong>
                </div>

                {/* Binding if present */}
                {hasBinding && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">ການເຂົ້າເລ່ມ (Binding)</span>
                    <strong className="text-slate-800 text-xs font-bold block truncate mt-0.5">{binding}</strong>
                  </div>
                )}

                {/* Coating if present */}
                {hasCoating && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">ການເຄືອບ (Coating)</span>
                    <strong className="text-slate-800 text-xs font-bold block truncate mt-0.5">{lamination}</strong>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Universal Printer Allocation Modal (Unified Som-Sing Form Design) */}
      {activeItemIndexForPrinter !== null && (
        <PrinterSelectorModal
          isOpen={activeItemIndexForPrinter !== null}
          onClose={() => setActiveItemIndexForPrinter(null)}
          onSelect={(printer) => handleSelectPrinter(activeItemIndexForPrinter, printer)}
          selectedPrinterId={displayItems[activeItemIndexForPrinter]?.printerId || displayItems[activeItemIndexForPrinter]?.printer_id}
          printers={printerEquipment}
          formatCurrency={(amt) => `${Math.round(amt || 0).toLocaleString()} ₭`}
        />
      )}

      {/* Confirmation Dialog on Switching Printer */}
      {pendingPrinterChange && (
        <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {currentLang === 'lo' ? 'ຢືນຢັນການປ່ຽນແທ່ນພິມ?' : 'Confirm Printer Allocation Change?'}
                </h3>
                <span className="text-xs text-slate-500 block">
                  {currentLang === 'lo' ? 'ແທ່ນພິມໃໝ່:' : 'New Press:'} <strong className="text-blue-700">{pendingPrinterChange.printer.name}</strong>
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>ລາຄາທີ່ສະເໜີລູກຄ້າຈະບໍ່ປ່ຽນແປງ (Customer Price Locked)</span>
              </p>
              <p className="text-[11px] leading-relaxed text-amber-900">
                ລະບົບຈະປັບປຸງສະເພາະ <strong>ຕົ້ນທຶນໝຶກຕົວຈິງ (Realized Ink Cost)</strong> ແລະ <strong>ຄ່າເສື່ອມຈັກ</strong> ປະຈຳອໍເດີນີ້ ເພື່ອໃຫ້ລາຍງານກຳໄລສຸດທິ (Gross Margin) ຖືກຕ້ອງຕາມເຄື່ອງທີ່ຍິງອອກຈິງ.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingPrinterChange(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                onClick={handleConfirmPrinterSwitch}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-600/20 transition cursor-pointer"
              >
                ຢືນຢັນປ່ຽນແທ່ນພິມ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintJobItemsCard;
