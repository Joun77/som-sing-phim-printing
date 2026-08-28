import React, { useState, useMemo, useEffect } from 'react';
import { Search, Check, Printer, AlertCircle, ShieldCheck, Palette, Layers, RefreshCw, Database } from 'lucide-react';
import { FormModalTemplate } from '@components/common/FormModalTemplate';
import type { Equipment } from '../../../types';

interface PrinterSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (printer: Equipment, mode?: 'replace' | 'add') => void;
  selectedPrinterId?: string;
  printers: Equipment[];
  formatCurrency: (amount: number) => string;
  getPrinterMachineRate?: (printer: Equipment) => number;
}

export const PrinterSelectorModal: React.FC<PrinterSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedPrinterId,
  printers: propPrinters,
  formatCurrency,
  getPrinterMachineRate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTech, setSelectedTech] = useState('ALL');
  const [selectedColorCount, setSelectedColorCount] = useState('ALL');
  const [livePrinters, setLivePrinters] = useState<Equipment[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(false);

  // Fetch live printers from real Go Backend / PostgreSQL DB when modal opens
  const fetchLivePrinters = async () => {
    setIsLoadingDB(true);
    try {
      let res = await fetch('/api/equipment');
      if (!res.ok) {
        res = await fetch('/api/v1/assets');
      }
      if (res && res.ok) {
        const json = await res.json();
        const rawItems = Array.isArray(json) ? json : (json?.data || []);
        if (Array.isArray(rawItems) && rawItems.length > 0) {
          const parsedList: Equipment[] = rawItems.map((item: any) => ({
            id: item.asset_id || item.id,
            assetId: item.asset_id || item.id,
            name: item.name || `${item.brand || ''} ${item.model || ''}`.trim() || item.asset_id || item.id,
            brand: item.brand || '',
            model: item.model || '',
            serialNumber: item.serial_number || item.serialNumber || '',
            category: item.category || 'Printer',
            printerCategory: item.category || item.printerCategory || 'Digital Press',
            colorSchemeType: item.color_scheme_type || item.colorSchemeType || item.specs?.colorScheme || 'CMYK',
            totalColorSlots: item.total_color_slots || item.totalColorSlots || 4,
            status: item.status || 'In Use',
            location: item.location_dept || item.location || 'Press Floor',
            purchaseCost: Number(item.price_cost || item.price || item.purchaseCost || item.purchasePrice || 0),
            lifespanYears: Number(item.lifespanYears || 5),
            printedPagesCapacity: Number(item.expected_life_a4_pages || item.expectedLifeA4Pages || item.printedPagesCapacity || 500000),
            printedCount: Number(item.printedCount || 0),
            calculatedCostPerPage: Number(item.calculatedCostPerPage || item.costPerPage || 50),
            maintenanceRatePercent: Number(item.maintenance_rate_percent || item.maintenanceRatePercent || 20),
            purchaseDate: item.purchase_date || item.purchaseDate || '2024-01-01',
            warrantyExpiration: item.warranty_expiry_year ? `${item.warranty_expiry_year}-01-01` : (item.warrantyExpiration || '2026-01-01'),
            lastMaintenanceDate: item.lastMaintenanceDate || '2026-01-01',
            components: item.components || [],
            specs: {
              ...(item.technical_specs || {}),
              colorScheme: item.color_scheme_type || item.colorSchemeType || item.specs?.colorScheme || 'CMYK',
              totalColorSlots: item.total_color_slots || item.totalColorSlots || 4,
              oemBaselineSpecs: item.oem_baseline_specs || item.specs?.oemBaselineSpecs,
              printerColorLinks: item.printerColorLinks || item.specs?.printerColorLinks,
            }
          }));

          // Filter only printers
          const onlyPrinters = parsedList.filter(eq => {
            const cat = (eq.category || '').toLowerCase();
            const type = (eq.printerCategory || '').toLowerCase();
            const isPrintCat = cat.includes('printer') || cat.includes('press') || type.includes('digital') || type.includes('offset') || type.includes('inkjet') || type.includes('photo');
            const isExplicitNonPrinter = cat.includes('cut') || cat.includes('trim') || cat.includes('post') || cat.includes('finish') || cat.includes('bind') || cat.includes('laminat');
            return (isPrintCat || eq.id?.startsWith('PRN-')) && !isExplicitNonPrinter;
          });

          if (onlyPrinters.length > 0) {
            setLivePrinters(onlyPrinters);
          }
        }
      }
    } catch (err) {
      console.warn('[PrinterSelectorModal] Live fetch fallback to props:', err);
    } finally {
      setIsLoadingDB(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLivePrinters();
    }
  }, [isOpen]);

  // Merge live database printers with prop printers
  const allPrinters = useMemo(() => {
    const map = new Map<string, Equipment>();
    (propPrinters || []).forEach(p => map.set(p.id, p));
    (livePrinters || []).forEach(p => {
      if (map.has(p.id)) {
        map.set(p.id, { ...map.get(p.id)!, ...p });
      } else {
        map.set(p.id, p);
      }
    });
    return Array.from(map.values());
  }, [propPrinters, livePrinters]);

  const filteredPrinters = useMemo(() => {
    return allPrinters.filter(p => {
      const name = (p.name || '').toLowerCase();
      const brand = (p.brand || '').toLowerCase();
      const model = (p.model || '').toLowerCase();
      const assetId = (p.assetId || p.id || '').toLowerCase();
      const techType = (p.type || p.printerCategory || p.specs?.type || '').toLowerCase();
      const colorScheme = (p.specs?.colorScheme || p.specs?.colorSchemeType || (p as any).colorSchemeType || (p as any).color_scheme_type || '').toLowerCase();
      const combined = `${name} ${brand} ${model} ${assetId} ${techType} ${colorScheme}`.toLowerCase();

      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = combined.includes(q);
        if (!matches) return false;
      }

      // 2. Technology Filter (Laser, Inkjet, Offset)
      if (selectedTech !== 'ALL') {
        if (selectedTech === 'LASER') {
          if (!combined.includes('laser') && !combined.includes('digital') && !combined.includes('c6085') && !combined.includes('c1085') && !combined.includes('press') && !combined.includes('toner') && !combined.includes('versant')) return false;
        } else if (selectedTech === 'INKJET') {
          if (!combined.includes('inkjet') && !combined.includes('large') && !combined.includes('plotter') && !combined.includes('epson') && !combined.includes('canon') && !combined.includes('l4260') && !combined.includes('l1800')) return false;
        } else if (selectedTech === 'OFFSET') {
          if (!combined.includes('offset') && !combined.includes('heidelberg') && !combined.includes('komori') && !combined.includes('ryobi')) return false;
        }
      }

      // 3. Color Channels Filter (4-Color CMYK, 6-Color Photo, 12-Color Fine Art, Mono K)
      const slots = Number((p as any).totalColorSlots || (p as any).total_color_slots || p.specs?.totalColorSlots || (colorScheme.includes('12') ? 12 : colorScheme.includes('6') || colorScheme.includes('photo') ? 6 : colorScheme.includes('mono') ? 1 : 4));

      if (selectedColorCount !== 'ALL') {
        if (selectedColorCount === '4_COLOR') {
          if (slots !== 4 && (slots === 1 || slots === 6 || slots === 12 || combined.includes('mono') || combined.includes('photo') || combined.includes('fine art'))) return false;
        } else if (selectedColorCount === '6_COLOR') {
          if (slots !== 6 && !combined.includes('6') && !combined.includes('photo') && !combined.includes('l805') && !combined.includes('l1800')) return false;
        } else if (selectedColorCount === '12_COLOR') {
          if (slots !== 12 && !combined.includes('12') && !combined.includes('fine art') && !combined.includes('pro-1000') && !combined.includes('pro-4000')) return false;
        } else if (selectedColorCount === 'MONO') {
          if (slots !== 1 && !combined.includes('mono') && !combined.includes('black') && !combined.includes('1100') && !combined.includes('6120') && !combined.includes('k only')) return false;
        }
      }

      return true;
    });
  }, [allPrinters, searchQuery, selectedTech, selectedColorCount]);

  function getPrinterColorBadge(p: Equipment) {
    const colorScheme = ((p as any).color_scheme_type || (p as any).colorSchemeType || p.specs?.colorScheme || '').toLowerCase();
    const slots = Number((p as any).totalColorSlots || (p as any).total_color_slots || p.specs?.totalColorSlots || 0);
    const combined = `${p.name} ${p.brand} ${p.type} ${colorScheme}`.toLowerCase();

    if (slots === 12 || colorScheme.includes('12') || combined.includes('12') || combined.includes('fine art')) {
      return { label: '12 ສີ (Fine Art / Pro)', bg: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' };
    }
    if (slots === 6 || colorScheme.includes('6') || colorScheme.includes('photo') || combined.includes('6') || combined.includes('photo') || combined.includes('l1800')) {
      return { label: '6 ສີ (Photo CMYK+)', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
    if (slots === 1 || colorScheme.includes('mono') || combined.includes('mono') || combined.includes('k only')) {
      return { label: 'ຂາວດຳ (Mono K)', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
    return { label: '4 ສີ (CMYK)', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
  }

  if (!isOpen) return null;

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<Printer className="w-5 h-5 text-white" />}
      title="ຄົ້ນຫາ & ເລືອກເຄື່ອງພິມ (Live Fleet Search)"
      subtitle="ດຶງຂໍ້ມູນເຄື່ອງຈັກ ແລະ ລະບົບສີໂດຍກົງຈາກຖານຂໍ້ມູນ (Laser, Inkjet, Offset, 4 ສີ, 6 ສີ, 12 ສີ)"
      maxWidthClass="max-w-5xl"
      badgeText={`${filteredPrinters.length} ເຄື່ອງພິມ`}
      footerActions={
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              ກົດເລືອກເຄື່ອງພິມທີ່ຕ້ອງການເພື່ອນຳໄປໃຊ້ງານ ລະບົບຈະຮັກສາຄ່າສີໄວ້ຄືເກົ່າ
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            ປິດໜ້າຕ່າງ
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search & Multi-Filter Bar with Live DB Sync */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          
          {/* Top Row: Search Input + Live Sync Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ຄົ້ນຫາຊື່ເຄື່ອງພິມ, ຍີ່ຫໍ້ (Fuji Xerox, Konica, Epson, Canon), Model..."
                className="w-full pl-10 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-accent-sky focus:bg-white transition"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 py-0.5 bg-slate-200 rounded"
                >
                  ລ້າງ
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={fetchLivePrinters}
              disabled={isLoadingDB}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0"
              title="ດຶງຂໍ້ມູນຫຼ້າສຸດຈາກຖານຂໍ້ມູນ"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-accent-sky ${isLoadingDB ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">ຣີເຟຣຊ DB</span>
            </button>
          </div>

          {/* Filter Rows: 1. Technology, 2. Color System */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            {/* Technology Type Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-accent-sky" />
                <span>ເທັກໂນໂລຢີເຄື່ອງພິມ (Technology):</span>
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { id: 'ALL', label: 'ທັງໝົດ' },
                  { id: 'LASER', label: 'Laser / Digital Press' },
                  { id: 'INKJET', label: 'Inkjet / Photo' },
                  { id: 'OFFSET', label: 'Offset' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTech(t.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      selectedTech === t.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color System Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-fuchsia-600" />
                <span>ລະບົບສີ (Color Channels):</span>
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { id: 'ALL', label: 'ທຸກລະບົບສີ' },
                  { id: '4_COLOR', label: '4 ສີ (CMYK)' },
                  { id: '6_COLOR', label: '6 ສີ (Photo)' },
                  { id: '12_COLOR', label: '12 ສີ (Fine Art)' },
                  { id: 'MONO', label: 'ຂາວດຳ (Mono)' },
                ].map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColorCount(c.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      selectedColorCount === c.id
                        ? 'bg-fuchsia-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Printers Grid */}
        <div className="space-y-2.5">
          {filteredPrinters.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">ບໍ່ພົບເຄື່ອງພິມທີ່ຕົງກັບເງື່ອນໄຂ</p>
              <p className="text-xs text-slate-400">ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ເລືອກປະເພດ/ລະບົບສີທັງໝົດ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[52vh] overflow-y-auto pr-1">
              {filteredPrinters.map(printer => {
                const isSelected = selectedPrinterId === printer.id;
                const rate = getPrinterMachineRate ? getPrinterMachineRate(printer) : (Number((printer as any).costPerPage) || Number((printer as any).calculatedCostPerPage) || 50);
                const colorBadge = getPrinterColorBadge(printer);

                return (
                  <div
                    key={printer.id}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sky-50/90 border-sky-500 shadow-md ring-2 ring-sky-400/20'
                        : 'bg-white border-slate-200/90 hover:border-sky-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-slate-900 font-sans block">
                              {printer.name}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${colorBadge.bg}`}>
                              {colorBadge.label}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                            {printer.brand} {printer.model ? `• ${printer.model}` : ''} {printer.serialNumber ? `(${printer.serialNumber})` : ''}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center gap-1 shrink-0">
                            <Check className="w-3 h-3" /> ເລືອກຢູ່
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-medium flex-wrap">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-sans font-bold">
                          {printer.category || printer.printerCategory || 'Digital Press'}
                        </span>
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> ພ້ອມໃຊ້ງານ
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-bold flex items-center gap-1">
                          <Database className="w-3 h-3" /> ຖານຂໍ້ມູນຈິງ
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-left">
                        <div className="text-[10px] text-slate-400 font-medium">ຄ່າເສື່ອມເຄື່ອງຕໍ່ໜ້າ:</div>
                        <div className="text-xs font-black text-slate-900 font-sans">
                          {formatCurrency(rate)} <span className="text-[10px] text-slate-400 font-normal">/ ໜ້າ</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(printer, 'replace');
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          ເລືອກເຄື່ອງນີ້
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(printer, 'add');
                            onClose();
                          }}
                          className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition cursor-pointer"
                          title="ເພີ່ມເຄື່ອງນີ້ເພື່ອແບ່ງໂຫຼດການຜະລິດ"
                        >
                          + ແບ່ງໂຫຼດ
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </FormModalTemplate>
  );
};
