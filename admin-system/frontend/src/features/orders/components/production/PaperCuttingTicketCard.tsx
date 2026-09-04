import React from 'react';
import { 
  Printer, 
  Scissors, 
  Layers, 
  Clock, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  QrCode, 
  Settings, 
  User, 
  Phone, 
  Calendar,
  Sparkles,
  ShieldCheck,
  Ruler,
  BookOpen,
  Maximize2
} from 'lucide-react';

interface JobTicketProps {
  order: any;
  currentLang?: string;
  onPrint?: () => void;
  className?: string;
}

/**
 * Barcode SVG Generator
 */
export const BarcodeRenderer: React.FC<{ value: string; height?: number }> = ({ value, height = 36 }) => {
  // Generate consistent bar widths based on char codes
  const bars = React.useMemo(() => {
    const chars = value.split('');
    const pattern: number[] = [];
    chars.forEach((c) => {
      const code = c.charCodeAt(0);
      pattern.push((code % 3) + 1);
      pattern.push(((code >> 1) % 3) + 1);
      pattern.push(((code >> 2) % 2) + 1);
    });
    // Add guard bars
    return [2, 1, 2, ...pattern, 2, 1, 2];
  }, [value]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-[1.5px] h-9 overflow-hidden">
        {bars.map((w, idx) => (
          <span
            key={idx}
            className="bg-slate-900 inline-block h-full shrink-0"
            style={{ width: `${w * 1.5}px` }}
          />
        ))}
      </div>
      <span className="font-mono text-[9px] font-bold tracking-widest text-slate-600 mt-1 uppercase">
        *{value}*
      </span>
    </div>
  );
};

/**
 * QR Code Simulation representation for Ticket
 */
export const QRCodeRenderer: React.FC<{ value: string; size?: number }> = ({ value, size = 64 }) => {
  return (
    <div 
      className="p-1.5 bg-white border-2 border-slate-900 rounded-lg flex flex-col items-center justify-center shrink-0 shadow-xs"
      style={{ width: size, height: size }}
      title={`Scan ERP: ${value}`}
    >
      <div className="w-full h-full grid grid-cols-6 grid-rows-6 gap-[1.5px] p-0.5">
        {Array.from({ length: 36 }).map((_, i) => {
          const isCorner = 
            (i < 3 || (i >= 6 && i < 9) || (i >= 12 && i < 15)) || // top-left
            (i % 6 >= 3 && i < 18 && (i % 6 >= 4)) || // top-right
            (i >= 24 && i % 6 < 3); // bottom-left
          const isPixel = isCorner || (i * 17 + value.length) % 3 === 0 || (i % 5 === 0);
          return (
            <div 
              key={i} 
              className={`${isPixel ? 'bg-slate-900' : 'bg-transparent'} rounded-[1px]`} 
            />
          );
        })}
      </div>
    </div>
  );
};

/**
 * Industrial Factory Job Ticket (A4 Print-Optimized)
 */
export const IndustrialJobTicket: React.FC<JobTicketProps> = ({
  order,
  currentLang = 'lo',
  onPrint,
  className = ''
}) => {
  if (!order) return null;

  const orderId = order.orderNo || order.order_no || order.id || 'ORDER';
  const customerName = order.customerName || order.customer_name || 'Somphavath DOUANGSVA';
  const customerPhone = order.phone || order.customer_phone || '02058866339';
  const orderDate = order.date || new Date().toISOString().split('T')[0];
  const promisedDate = order.promisedDeliveryDate || order.delivery_date || 'N/A';
  const deliveryMethod = order.deliveryMethod || order.shippingCourier || 'Anousith Express';
  const notes = order.notes || order.productionNotes || order.remarks || 'ພິມຕາມໄຟລ໌ມາດຕະຖານ CMYK, ກວດສອບສີໜ້າ-ຫຼັງກ່ອນລັນຍາວ';

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
    {
      name: order.product_name || order.specs?.name || 'Custom Print Project',
      quantity: order.quantity || 100,
      paper_name: order.specs?.paperType || 'Art Card 300gsm',
      paper_lot: order.specs?.paperLot || 'LOT-AC-300-09',
      parent_sheet_size: '330 × 483 mm (SRA3+)',
      cut_size: '210 × 297 mm (A4)',
      cuts_per_sheet: 2,
      page_count: order.specs?.pages || 1,
      spoilage_rate_percent: 5,
      ink_coverage_percent: 45,
      color_mode: '4/4 CMYK Full Color',
      assigned_machine: 'Konica Minolta AccurioPress C4080',
      lamination: order.specs?.lamination || 'ເຄືອບດ້ານ 2 ໜ້າ (Matte Both Sides)',
      binding: order.specs?.binding || 'ຕັດເຈຽນຂະໜາດສຳເລັດ (Trim to Size)',
      finishing_crease: 'ປ້ຳເສັ້ນພັບ 1 ເສັ້ນ',
      spine_width_mm: order.spine_width_mm || order.specs?.spine || null
    }
  ];

  return (
    <div className={`bg-white text-slate-900 font-sans p-6 sm:p-8 max-w-4xl mx-auto border-2 border-slate-800 rounded-2xl print:border-none print:p-0 print:m-0 print:max-w-none print:w-full print:shadow-none space-y-5 ${className}`}>
      
      {/* 1. Header Banner */}
      <div className="border-b-2 border-slate-900 pb-4 flex flex-row justify-between items-start gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded">
              FACTORY JOB TICKET
            </span>
            <span className="font-mono text-xs font-bold text-slate-600">
              ໃບສັ່ງຜະລິດໜ້າງານໂຮງພິມ
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">
            ສົມສິງ ການພິມ • SOM SING PRINTING
          </h1>
          <p className="text-xs text-slate-600 font-bold">
            ໂຮງງານພິມດິຈິຕອລ & ອັອບເຊັດ • Phone: +856 20 58866339 • Vientiane Capital
          </p>
        </div>

        {/* QR & Barcode Section */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-3">
            <QRCodeRenderer value={`SSP-ORDER-${orderId}`} size={58} />
            <BarcodeRenderer value={`ORD-${orderId}`} height={32} />
          </div>
          <span className="text-[10px] font-mono font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
            JOB NO: SSP-JOB-{String(orderId).replace(/\D/g, '').padStart(5, '0')}
          </span>
        </div>
      </div>

      {/* 2. Order Metadata & Due Date Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">ເລກອໍເດີ (Order ID)</span>
          <span className="text-sm font-black font-mono text-slate-900 block">#{orderId}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">ລູກຄ້າ / Customer</span>
          <span className="font-bold text-slate-900 block truncate">{customerName}</span>
          <span className="font-mono text-slate-500 text-[10px] block">{customerPhone}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">ວັນທີສັ່ງພິມ (Order Date)</span>
          <span className="font-mono font-bold text-slate-800 block">{orderDate}</span>
          <span className="text-[10px] text-slate-500 font-bold block">{deliveryMethod}</span>
        </div>
        <div className="bg-amber-100/80 border border-amber-300 p-2 rounded-lg text-amber-950">
          <span className="text-[10px] uppercase font-black text-amber-800 block flex items-center gap-1">
            <Clock className="w-3 h-3" /> ກຳນົດສົ່ງ (Promised Due)
          </span>
          <span className="text-sm font-black font-mono block text-amber-950">{promisedDate}</span>
          <span className="text-[9px] font-bold text-amber-800 uppercase block">SLA Priority: Urgent</span>
        </div>
      </div>

      {/* 3. Items & Production Specifications Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-300 pb-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-700" />
            <span>ລາຍການສັ່ງຜະລິດ & ສະເປກວັດສະດຸ (Job Items & Materials Spec)</span>
          </h2>
          <span className="text-[10px] font-mono font-bold text-slate-500">
            Total Items: {items.length}
          </span>
        </div>

        <div className="space-y-3">
          {items.map((it, idx) => {
            const qty = Number(it.quantity || 1);
            const cuts = Number(it.cuts_per_sheet || it.cutsPerSheet || 2);
            const spoilagePct = Number(it.spoilage_rate_percent || 5);
            const parentSheetsNet = Math.ceil(qty / cuts);
            const spoilageSheets = Math.ceil(parentSheetsNet * (spoilagePct / 100)) + 3; // base 3 buffer sheets
            const totalParentSheets = parentSheetsNet + spoilageSheets;

            const paperName = it.paper_name || it.paper || it.paperType || 'Art Matt 150gsm';
            const paperLot = it.paper_lot || `LOT-P-${paperName.slice(0, 3).toUpperCase()}-01`;
            const parentSheet = it.parent_sheet_size || '330 × 483 mm (SRA3+)';
            const cutSize = it.cut_size || it.size || '210 × 297 mm (A4)';
            const colorMode = it.color_mode || '4/4 CMYK Full Color';
            const machine = it.assigned_machine || 'Konica Minolta AccurioPress C4080';
            const lamination = it.lamination || 'None';
            const binding = it.binding || it.finishing || 'Trim & Cut';
            const spine = it.spine_width_mm ? `${it.spine_width_mm} mm` : null;

            return (
              <div key={idx} className="border-2 border-slate-300 rounded-xl p-3.5 space-y-3 bg-white">
                
                {/* Item Headline */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <span className="font-mono font-black text-xs text-slate-400 mr-2">ITEM #{idx + 1}</span>
                    <span className="text-sm font-black text-slate-900">{it.name || it.job_name || 'Print Job Item'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">
                      ຈຳນວນຜະລິດ: <strong className="text-sm font-mono font-black text-slate-900">x{qty.toLocaleString()}</strong> ຫົວ/ຊຸດ
                    </span>
                    {it.page_count && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px] font-bold font-mono">
                        {it.page_count} Pages
                      </span>
                    )}
                  </div>
                </div>

                {/* Technical Specifications Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  
                  {/* Column 1: Paper & Cutting */}
                  <div className="space-y-1.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-black text-slate-700 uppercase flex items-center gap-1">
                      <Scissors className="w-3 h-3 text-blue-600" /> ເຈ້ຍ & ຂະໜາດຕັດ (Paper & Cuts)
                    </span>
                    <div className="space-y-1 text-[11px]">
                      <div>
                        <span className="text-slate-500 font-bold block text-[10px]">ຊະນິດເຈ້ຍ (Paper Spec):</span>
                        <span className="font-extrabold text-slate-900">{paperName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold block text-[10px]">ລະຫັດ Lot ເຈ້ຍ:</span>
                        <span className="font-mono font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200 inline-block">{paperLot}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 pt-1 border-t border-slate-200 mt-1">
                        <div>
                          <span className="text-slate-400 block text-[9px]">ແຜ່ນໃຫຍ່ (Parent):</span>
                          <span className="font-mono font-bold text-slate-800 text-[10px]">{parentSheet}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">ຂະໜາດຕັດ (Cut):</span>
                          <span className="font-mono font-bold text-slate-800 text-[10px]">{cutSize}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Press & Inks */}
                  <div className="space-y-1.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-black text-slate-700 uppercase flex items-center gap-1">
                      <Printer className="w-3 h-3 text-purple-600" /> ແທ່ນພິມ & ສີ (Press & Run)
                    </span>
                    <div className="space-y-1 text-[11px]">
                      <div>
                        <span className="text-slate-500 font-bold block text-[10px]">ແທ່ນພິມ (Assigned Machine):</span>
                        <span className="font-extrabold text-slate-900">{machine}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold block text-[10px]">ໂໝດສີ (Color Mode):</span>
                        <span className="font-mono font-bold text-purple-800">{colorMode}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 pt-1 border-t border-slate-200 mt-1">
                        <div>
                          <span className="text-slate-400 block text-[9px]">Ink Coverage:</span>
                          <span className="font-mono font-bold text-slate-800 text-[10px]">{it.ink_coverage_percent || 45}% CMYK</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">ຕັດຕໍ່ແຜ່ນ:</span>
                          <span className="font-mono font-bold text-slate-800 text-[10px]">{cuts} Cuts/Sheet</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Paper Sheet Calculations */}
                  <div className="space-y-1.5 p-2.5 bg-slate-900 text-white rounded-lg">
                    <span className="text-[10px] font-black text-amber-400 uppercase flex items-center gap-1">
                      <Layers className="w-3 h-3 text-amber-400" /> ຈຳນວນແຜ່ນເບີກ (Sheet Requisition)
                    </span>
                    <div className="space-y-1.5 text-[11px] pt-0.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[10px]">ແຜ່ນພິມຈິງ (Net Sheets):</span>
                        <span className="font-mono font-black text-slate-200">{parentSheetsNet} แผ่น</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[10px]">ເຜື່ອເສຍ (+{spoilagePct}% Spoilage):</span>
                        <span className="font-mono font-bold text-amber-300">+{spoilageSheets} แผ่น</span>
                      </div>
                      <div className="flex justify-between items-center pt-1.5 border-t border-slate-700 font-bold">
                        <span className="text-white text-xs">ລວມເບີກເຈ້ຍ (Total Sheet):</span>
                        <span className="text-sm font-mono font-black text-amber-400">{totalParentSheets} ແຜ່ນ</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Post-Press Finishing & Binding Row */}
                <div className="p-2.5 bg-slate-100/80 rounded-lg border border-slate-300 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-black text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                      Post-Press Finishing
                    </span>
                    <span className="text-slate-700">
                      <strong>ເຄືອບ:</strong> {lamination}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-700">
                      <strong>ເຂົ້າເລ່ມ:</strong> {binding}
                    </span>
                    {spine && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className="text-purple-800 font-bold">
                          <strong>ສັນໜາ:</strong> {spine}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                    <span>Quality Grade: ISO-9001 Factory Run</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Production Special Instructions & Remarks */}
      <div className="space-y-1.5 p-3.5 border-2 border-slate-300 rounded-xl bg-slate-50 text-xs">
        <span className="text-[10px] font-black uppercase text-slate-600 block tracking-wider">
          ໝາຍເຫດການຜະລິດພິເສດ (Special Production Notes & Quality Controls)
        </span>
        <p className="font-semibold text-slate-800 italic bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed min-h-[44px]">
          {notes}
        </p>
      </div>

      {/* 5. Production Workflow Quality Checklists (Checkbox Matrix) */}
      <div className="border-2 border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ຂັ້ນຕອນການກວດສອບຄຸນນະພາບ & ເຊັນຮັບຮອງ (Sign-Off & QA Matrix)</span>
          </span>
          <span className="text-[10px] font-bold text-slate-500">
            ກະລຸນາໝາຍ [x] ແລະ ເຊັນຊື່ທຸກຂັ້ນຕອນ
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          
          {/* Step 1: Pre-Press Check */}
          <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg space-y-2">
            <div className="flex items-center justify-between font-black text-slate-800 border-b border-slate-200 pb-1">
              <span>1. ກວດໄຟລ໌ (Pre-Press)</span>
              <span className="w-4 h-4 border border-slate-400 rounded flex items-center justify-center text-[10px]"></span>
            </div>
            <div className="text-[10px] text-slate-600 space-y-0.5 font-medium">
              <p>• CMYK Color Space</p>
              <p>• Bleed Margin 2-3mm</p>
              <p>• 300 DPI Resolution</p>
            </div>
            <div className="pt-2 border-t border-slate-200 text-[10px]">
              <span className="text-slate-400 block">ຊ່າງກວດໄຟລ໌:</span>
              <div className="h-6 border-b border-dashed border-slate-400 mt-1"></div>
            </div>
          </div>

          {/* Step 2: Press Printing Check */}
          <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg space-y-2">
            <div className="flex items-center justify-between font-black text-slate-800 border-b border-slate-200 pb-1">
              <span>2. ພິມແຜ່ນງານ (Press Run)</span>
              <span className="w-4 h-4 border border-slate-400 rounded flex items-center justify-center text-[10px]"></span>
            </div>
            <div className="text-[10px] text-slate-600 space-y-0.5 font-medium">
              <p>• Density & Color Tone</p>
              <p>• Front/Back Register</p>
              <p>• Clean No Streak/Spot</p>
            </div>
            <div className="pt-2 border-t border-slate-200 text-[10px]">
              <span className="text-slate-400 block">ຊ່າງພິມ (Operator):</span>
              <div className="h-6 border-b border-dashed border-slate-400 mt-1"></div>
            </div>
          </div>

          {/* Step 3: Cutting & Binding Check */}
          <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg space-y-2">
            <div className="flex items-center justify-between font-black text-slate-800 border-b border-slate-200 pb-1">
              <span>3. ຕັດ & ເຂົ້າເລ່ມ (Finishing)</span>
              <span className="w-4 h-4 border border-slate-400 rounded flex items-center justify-center text-[10px]"></span>
            </div>
            <div className="text-[10px] text-slate-600 space-y-0.5 font-medium">
              <p>• Cut Size Tolerance ±0.5mm</p>
              <p>• Lamination Adhesion</p>
              <p>• Spine & Wire-O Firmness</p>
            </div>
            <div className="pt-2 border-t border-slate-200 text-[10px]">
              <span className="text-slate-400 block">ຊ່າງຕັດ/ເຂົ້າເລ່ມ:</span>
              <div className="h-6 border-b border-dashed border-slate-400 mt-1"></div>
            </div>
          </div>

          {/* Step 4: Final QA & Packaging */}
          <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg space-y-2">
            <div className="flex items-center justify-between font-black text-slate-800 border-b border-slate-200 pb-1">
              <span>4. ກວດຮັບ QC & ແພັກ</span>
              <span className="w-4 h-4 border border-slate-400 rounded flex items-center justify-center text-[10px]"></span>
            </div>
            <div className="text-[10px] text-slate-600 space-y-0.5 font-medium">
              <p>• Count Qty 100% Correct</p>
              <p>• Clean Packaging / Box</p>
              <p>• Label / Tracking Attached</p>
            </div>
            <div className="pt-2 border-t border-slate-200 text-[10px]">
              <span className="text-slate-400 block">ຜູ້ກວດ QC ສຸດທ້າຍ:</span>
              <div className="h-6 border-b border-dashed border-slate-400 mt-1"></div>
            </div>
          </div>

        </div>
      </div>

      {/* 6. Footer Disclaimer & Print Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 text-[10px] text-slate-500 font-mono border-t border-slate-200">
        <div>
          <span>ISO-12647 Standard Color Management System • Som Sing Printing ERP</span>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer text-xs"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentLang === 'lo' ? 'ພິມໃບສັ່ງຜະລິດ (Print A4)' : 'Print Job Ticket (A4)'}</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

/**
 * PaperCuttingTicketCard Component (For display in dashboard or modals)
 */
export const PaperCuttingTicketCard: React.FC<JobTicketProps> = ({
  order,
  currentLang = 'lo',
  onPrint
}) => {
  return (
    <div className="space-y-4">
      <IndustrialJobTicket order={order} currentLang={currentLang} onPrint={onPrint} />
    </div>
  );
};

export default PaperCuttingTicketCard;
