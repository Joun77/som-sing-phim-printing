import React from 'react';
import { Layers, Printer, Package, Sparkles } from 'lucide-react';

interface PrintJobItemsCardProps {
  items?: any[];
  orderSpecs?: any;
  currentLang: string;
}

export const PrintJobItemsCard: React.FC<PrintJobItemsCardProps> = ({
  items,
  orderSpecs,
  currentLang,
}) => {
  const displayItems = Array.isArray(items) && items.length > 0 ? items : [
    {
      name: orderSpecs?.product_name || orderSpecs?.name || 'Custom Booklet / Document Print',
      quantity: orderSpecs?.quantity || 100,
      paperType: orderSpecs?.paperType || orderSpecs?.paper || 'Art Matt 150g',
      paperSize: orderSpecs?.size || 'A5 (148 × 210 mm)',
      pages: orderSpecs?.pages || 24,
      binding: orderSpecs?.binding || 'Saddle Stitch (ຫຍິບມຸງ)',
      lamination: orderSpecs?.lamination || 'Matte Lamination (ເຄືອບດ້ານ)',
      machine: orderSpecs?.machine || 'Fuji Xerox Versant 180',
    }
  ];

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
      <div className="space-y-3.5 divide-y divide-slate-100">
        {displayItems.map((it: any, idx: number) => {
          const qty = it.quantity || it.qty || 1;
          const paper = it.paperType || it.paper || it.material || 'Art Card 260g';
          const size = it.paperSize || it.size || 'A4';
          const pages = it.pages || it.pageCount || '-';
          const binding = it.binding || it.bindingType || 'ຫຍິບມຸງ / ຕັດກົງ';
          const lamination = it.lamination || it.coating || 'ເຄືອບດ້ານ (Matte)';
          const machine = it.machine || 'Digital Press Color';

          return (
            <div key={idx} className={`pt-3.5 space-y-2.5 ${idx === 0 ? 'pt-0' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>{it.name || it.item_name || `ລາຍການສັ່ງພິມ #${idx + 1}`}</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    ແທ່ນພິມ: <strong className="text-slate-700 font-semibold">{machine}</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-bold">ຈຳນວນພິມ</span>
                  <span className="font-mono text-base font-black text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-xl border border-amber-200 inline-block">
                    {qty.toLocaleString()} {currentLang === 'lo' ? 'ຊຸດ/ຫົວ' : 'pcs'}
                  </span>
                </div>
              </div>

              {/* Spec Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">ເນື້ອເຈ້ຍ (Paper)</span>
                  <strong className="text-slate-800 text-xs font-semibold block truncate mt-0.5">{paper}</strong>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">ຂະໜາດ (Size)</span>
                  <strong className="text-slate-800 text-xs font-semibold block truncate mt-0.5">{size}</strong>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">ການເຂົ້າເລ່ມ (Binding)</span>
                  <strong className="text-slate-800 text-xs font-semibold block truncate mt-0.5">{binding}</strong>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">ການເຄືອບ (Coating)</span>
                  <strong className="text-slate-800 text-xs font-semibold block truncate mt-0.5">{lamination}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PrintJobItemsCard;
