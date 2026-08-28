import React from 'react';
import { Package, Truck, Phone, MapPin, Printer } from 'lucide-react';

interface ShippingLabelTemplateProps {
  order: any;
  courierName?: string;
  trackingNumber?: string;
  format?: '100x150' | 'A4';
  senderInfo?: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
}

export const ShippingLabelTemplate: React.FC<ShippingLabelTemplateProps> = ({
  order,
  courierName = 'Anousith Express',
  trackingNumber = '',
  format = '100x150',
  senderInfo = {
    name: 'ຮ້ານ ສົມສິງພິມ (Som Sing Phim)',
    phone: '+856 20 5551 2345',
    address: 'ບ້ານ ດົງປ່າລານ, ເມືອງ ສີສັດຕະນາກ',
    city: 'ນະຄອນຫຼວງວຽງຈັນ'
  }
}) => {
  if (!order) return null;

  const orderNo = order.orderNo || order.order_no || order.orderNumber || order.id || 'ORD-001';
  const effectiveTracking = trackingNumber || order.trackingNumber || `LA-${Date.now().toString().slice(-8)}`;
  const effectiveCourier = courierName || order.courier || order.deliveryMethod || 'Anousith Express';
  const recipientName = order.customerName || order.customer_name || 'ລູກຄ້າ';
  const recipientPhone = order.customerPhone || order.customer_phone || order.phone || '020-XXXX-XXXX';
  const recipientAddress = order.customerAddress || order.customer_address || order.address || 'ນະຄອນຫຼວງວຽງຈັນ';
  const items = order.items || [];
  const unpaid = Number(order.remainingUnpaidBalance || 0);

  // Generate deterministic barcode lines based on tracking number
  const barcodeBars = Array.from({ length: 48 }, (_, i) => {
    const charCode = effectiveTracking.charCodeAt(i % effectiveTracking.length) || 65;
    const isThick = (charCode + i) % 3 === 0;
    const isGap = (charCode * i) % 7 === 0;
    return { isThick, isGap };
  });

  return (
    <div
      className={`shipping-label-printable bg-white text-black font-sans box-border ${
        format === 'A4'
          ? 'w-[210mm] min-h-[297mm] p-8 border border-slate-300'
          : 'w-[100mm] min-h-[150mm] max-w-[100mm] p-3 text-[11px] leading-tight border-2 border-black rounded-lg'
      }`}
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      {/* Top Header: Courier & Routing Badge */}
      <div className="border-b-2 border-black pb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 bg-black text-white rounded flex items-center justify-center font-black text-xs">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[14px] font-black tracking-tight block uppercase">{effectiveCourier}</span>
            <span className="text-[9px] font-bold text-slate-700 block">EXPRESS DELIVERY • STANDARD ROUTE</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[18px] font-mono font-black border-2 border-black px-2 py-0.5 rounded">
            {order.deliveryProvinceCode || 'VTE'}
          </span>
        </div>
      </div>

      {/* Barcode & Tracking Number */}
      <div className="py-2.5 px-1 border-b-2 border-black text-center flex flex-col items-center justify-center bg-slate-50/50">
        <svg className="w-full h-12 max-w-[85mm]" viewBox="0 0 240 48" preserveAspectRatio="none">
          {barcodeBars.map((bar, idx) => {
            if (bar.isGap) return null;
            const x = idx * 5;
            const width = bar.isThick ? 3.5 : 2;
            return <rect key={idx} x={x} y={0} width={width} height={48} fill="#000000" />;
          })}
        </svg>
        <span className="font-mono text-xs font-black tracking-widest mt-1 block">
          {effectiveTracking}
        </span>
      </div>

      {/* Grid: Sender & Recipient */}
      <div className="border-b-2 border-black divide-y-2 divide-black">
        {/* Recipient Section (Prominent) */}
        <div className="p-2 bg-slate-100/70">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase bg-black text-white px-1.5 py-0.5 rounded">
              ຜູ້ຮັບ (TO)
            </span>
            <span className="text-[11px] font-mono font-black">{recipientPhone}</span>
          </div>
          <p className="text-[13px] font-black text-black leading-snug">{recipientName}</p>
          <p className="text-[10.5px] font-bold text-slate-800 mt-1 leading-normal">
            {recipientAddress}
          </p>
        </div>

        {/* Sender Section */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] font-black uppercase text-slate-600">
              ຜູ້ສົ່ງ (FROM)
            </span>
            <span className="text-[9.5px] font-mono font-bold text-slate-700">{senderInfo.phone}</span>
          </div>
          <p className="text-[11px] font-black text-black">{senderInfo.name}</p>
          <p className="text-[9.5px] text-slate-600">
            {senderInfo.address}, {senderInfo.city}
          </p>
        </div>
      </div>

      {/* Package Items Summary */}
      <div className="p-2 border-b-2 border-black min-h-[35mm] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-1 mb-1">
            <span className="text-[9.5px] font-black uppercase text-slate-700">
              ລາຍການສິນຄ້າໃນພັດສະດຸ (ITEMS)
            </span>
            <span className="text-[9px] font-mono font-bold text-slate-500">
              #{orderNo}
            </span>
          </div>
          <div className="space-y-1">
            {items.length === 0 ? (
              <p className="text-[10px] font-bold text-slate-600">• ງານພິມຕາມສັ່ງ (Custom Print Job) × 1</p>
            ) : (
              items.slice(0, 4).map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between text-[10px] font-bold text-slate-800">
                  <span className="truncate max-w-[65mm]">• {it.name || it.productName || 'ງານພິມ'}</span>
                  <span className="font-mono font-black shrink-0">× {it.quantity || 1}</span>
                </div>
              ))
            )}
            {items.length > 4 && (
              <p className="text-[9px] font-bold text-slate-500 italic">+ ອື່ນໆອີກ {items.length - 4} ລາຍການ</p>
            )}
          </div>
        </div>

        {/* Payment / COD Indicator */}
        <div className="mt-2 pt-1 border-t-2 border-black flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-slate-800">ສະຖານະການຊຳລະ:</span>
          {unpaid > 0 ? (
            <span className="text-xs font-black font-mono px-2 py-0.5 bg-black text-white rounded">
              COD: {unpaid.toLocaleString()} LAK
            </span>
          ) : (
            <span className="text-xs font-black font-mono px-2 py-0.5 border-2 border-black rounded text-black bg-slate-100">
              PAID (ຊຳລະຄົບແລ້ວ)
            </span>
          )}
        </div>
      </div>

      {/* Bottom Footer: Date & Security QR / Checksum */}
      <div className="pt-2 flex items-center justify-between text-[9px] font-mono text-slate-600">
        <div>
          <span>ວັນທີ: {new Date().toISOString().split('T')[0]}</span>
          <span className="block text-[8px] text-slate-400">Som Sing Phim Printing Standard Label</span>
        </div>
        <div className="text-right">
          <span className="font-bold border border-black px-1.5 py-0.5 rounded text-[8px]">
            FRAGILE / ລະວັງແຕກ
          </span>
        </div>
      </div>
    </div>
  );
};

export default ShippingLabelTemplate;
