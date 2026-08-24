import React, { useState, useMemo } from 'react';
import type { CustomerTrackingOrder, LanguageToken, TimelineStepItem } from '../../types/tracking';

interface OrderStatusTimelineProps {
  order: CustomerTrackingOrder;
  language?: LanguageToken;
}

const LIFECYCLE_STEPS: TimelineStepItem[] = [
  {
    status: 'PENDING_PAYMENT',
    labelLao: '1. ຮັບອໍເດີ & ກວດສອບສະລິບ',
    labelThai: '1. รับคำสั่งซื้อ & ตรวจสอบสลิป',
    labelEn: '1. Order Received & Payment Verification',
    descLao: 'ໄດ້ຮັບລາຍການສັ່ງຊື້ແລ້ວ ກຳລັງກວດສອບຍອດໂອນ BCEL OnePay',
    descThai: 'ได้รับรายการสั่งซื้อแล้ว กำลังตรวจสอบยอดโอนชำระเงิน',
    descEn: 'Order received. Verifying payment confirmation.',
  },
  {
    status: 'ORDER_CREATED',
    labelLao: '2. ກວດສອບໄຟລ໌ & Preflight',
    labelThai: '2. ตรวจสอบไฟล์ & Preflight',
    labelEn: '2. File Preflight & Artwork Check',
    descLao: 'ກວດສອບຄວາມລະອຽດ, ຂອບຕັດ Bleed ແລະ Color Profile',
    descThai: 'ตรวจสอบความละเอียด, ระยะตัดตก และโปรไฟล์สี CMYK',
    descEn: 'Verifying image resolution, bleed, and CMYK color profiles.',
  },
  {
    status: 'FILE_CONFIRMED',
    labelLao: '3. ຢືນຢັນແບບພິມ (Proof Approved)',
    labelThai: '3. ยืนยันแบบพิมพ์ (Proof Approved)',
    labelEn: '3. Digital Proof Approved',
    descLao: 'ລູກຄ້າ ແລະ ຊ່າງພິມກວດສອບຢືນຢັນໄຟລ໌ຕົວຢ່າງຮຽບຮ້ອຍ',
    descThai: 'ลูกค้าและช่างพิมพ์ตรวจสอบยืนยันตัวอย่างแบบพิมพ์เรียบร้อย',
    descEn: 'Print-ready artwork proof is verified and signed off.',
  },
  {
    status: 'IN_PRODUCTION',
    labelLao: '4. ກຳລັງດຳເນີນການພິມ (Printing)',
    labelThai: '4. กำลังดำเนินการพิมพ์ (Printing)',
    labelEn: '4. In Production (Printing)',
    descLao: 'ຕັດສະຕັອກວັດສະດຸ ແລະ ສົ່ງຄິວພິມລົງເຄື່ອງພິມດິຈິຕອນມາດຕະຖານ',
    descThai: 'ตัดสต็อกวัสดุและส่งคิวพิมพ์ลงเครื่องพิมพ์ความละเอียดสูง',
    descEn: 'Materials allocated from stock and running on digital press.',
  },
  {
    status: 'POST_PRESS',
    labelLao: '5. ຕັດ, ພັບ, ເຄືອບ & QC (Finishing)',
    labelThai: '5. ตัด, พับ, เคลือบ & QC (Finishing)',
    labelEn: '5. Finishing, Lamination & QC',
    descLao: 'ຂັ້ນຕອນຫຼັງການພິມ ໄດຄັດຕາມແບບ ແລະ ກວດສອບຄຸນນະພາບ',
    descThai: 'ขั้นตอนหลังการพิมพ์ เคลือบ ไดคัต เข้าเล่ม และตรวจสอบคุณภาพ',
    descEn: 'Post-press operations, lamination, die-cutting, and quality inspection.',
  },
  {
    status: 'COMPLETED',
    labelLao: '6. ສົ່ງມອບ / ຈັດສົ່ງສຳເລັດ (Completed)',
    labelThai: '6. ส่งมอบ / จัดส่งสำเร็จ (Completed)',
    labelEn: '6. Dispatched & Delivered',
    descLao: 'ສິນຄ້າພ້ອມຮັບ ຫຼື ສົ່ງມອບຂົນສົ່ງພ້ອມເລກ Tracking ຮຽບຮ້ອຍ',
    descThai: 'สินค้าพร้อมรับหน้าร้าน หรือส่งมอบให้บริษัทขนส่งพร้อมเลขพัสดุ',
    descEn: 'Ready for pickup or handed over to courier with tracking code.',
  },
];

function getActiveStepIndex(status: string): number {
  const map: Record<string, number> = {
    QUOTATION: 0,
    PENDING_PAYMENT: 0,
    PENDING_SLIP_CHECK: 0,
    PAID_PREPRESS: 1,
    ORDER_CREATED: 1,
    PREPRESS_CHECK: 1,
    WAITING_APPROVAL: 2,
    PROOF_REJECTED: 1,
    FILE_CONFIRMED: 2,
    READY_TO_PRINT: 2,
    IN_PRODUCTION: 3,
    POST_PRESS: 4,
    FINISHING: 4,
    SHIPPED: 5,
    READY_FOR_DELIVERY: 5,
    DELIVERED: 5,
    COMPLETED: 5,
  };
  return map[status] ?? 0;
}

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  order,
  language: initialLang = 'lo',
}) => {
  const [lang, setLang] = useState<LanguageToken>(initialLang);
  const [copiedTracking, setCopiedTracking] = useState<boolean>(false);

  const activeIndex = useMemo(() => getActiveStepIndex(order.overall_status), [order.overall_status]);

  const copyTracking = () => {
    const code = order.tracking_code || order.order_no;
    navigator.clipboard.writeText(code);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header card with order summary */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Official Order Tracking
              </span>
              <div className="flex items-center rounded-lg border border-slate-200 p-0.5 text-[11px] font-medium bg-slate-50">
                <button
                  type="button"
                  onClick={() => setLang('lo')}
                  className={`px-2 py-0.5 rounded ${lang === 'lo' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-500'}`}
                >
                  ລາວ
                </button>
                <button
                  type="button"
                  onClick={() => setLang('th')}
                  className={`px-2 py-0.5 rounded ${lang === 'th' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-500'}`}
                >
                  ไทย
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2 py-0.5 rounded ${lang === 'en' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-500'}`}
                >
                  EN
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 font-mono">
                {order.tracking_code || order.order_no}
              </h2>
              <button
                type="button"
                onClick={copyTracking}
                className="text-xs text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                {copiedTracking ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'en' ? 'Customer' : lang === 'th' ? 'ลูกค้า' : 'ລູກຄ້າ'}:{' '}
              <strong className="text-slate-800">{order.customer_name}</strong>
              {order.customer_phone && ` (${order.customer_phone})`}
            </p>
          </div>

          <div className="text-right flex flex-col items-start md:items-end">
            <span className="text-xs text-slate-500">{lang === 'en' ? 'Total Retail Price' : lang === 'th' ? 'ราคารวมสุทธิ' : 'ຍອດເງິນລວມ'}</span>
            <div className="text-2xl font-black text-amber-600 font-mono">
              {order.total_amount_lak.toLocaleString()} ₭ ({order.currency || 'LAK'})
            </div>
            <div className="flex items-center gap-2 mt-1">
              {order.deposit_lak > 0 && (
                <span className="text-xs text-slate-600">
                  {lang === 'en' ? 'Deposit' : 'ມັດຈຳ'}: {order.deposit_lak.toLocaleString()} ₭
                </span>
              )}
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  order.overall_status === 'COMPLETED' || order.overall_status === 'DELIVERED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-indigo-100 text-indigo-800 border-indigo-300 animate-pulse'
                }`}
              >
                {order.status_text || order.overall_status}
              </span>
            </div>
          </div>
        </div>

        {/* Courier Info if Shipped */}
        {(order.courier_name || order.shipping_tracking_number) && (
          <div className="mt-4 p-3 bg-sky-50/70 border border-sky-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚚</span>
              <div>
                <span className="text-xs font-bold text-sky-900 block">
                  {lang === 'en' ? 'Dispatched via' : lang === 'th' ? 'จัดส่งผ่าน' : 'ຈັດສົ່ງຜ່ານ'}:{' '}
                  {order.courier_name || 'Anousith Express'}
                </span>
                <span className="text-xs font-mono font-semibold text-sky-700">
                  Tracking: {order.shipping_tracking_number || 'Pending'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Responsive Lifecycle Timeline */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-base font-bold text-slate-900 mb-6">
          {lang === 'en'
            ? 'Production & Delivery Progress'
            : lang === 'th'
            ? 'สถานะขั้นตอนการผลิตและการจัดส่ง'
            : 'ຂັ້ນຕອນການຜະລິດ ແລະ ການຈັດສົ່ງ'}
        </h3>

        <div className="relative pl-6 md:pl-0">
          <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-6 gap-2 relative">
            {LIFECYCLE_STEPS.map((step, index) => {
              const isPast = index < activeIndex;
              const isCurrent = index === activeIndex;

              const title = lang === 'en' ? step.labelEn : lang === 'th' ? step.labelThai : step.labelLao;
              const desc = lang === 'en' ? step.descEn : lang === 'th' ? step.descThai : step.descLao;

              return (
                <div
                  key={step.status}
                  className={`relative flex md:flex-col items-start md:items-center text-left md:text-center group transition-all ${
                    isCurrent ? 'scale-105' : ''
                  }`}
                >
                  {/* Step Dot */}
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 transition-all ${
                      isPast
                        ? 'bg-emerald-500 text-white shadow-sm ring-4 ring-emerald-100'
                        : isCurrent
                        ? 'bg-amber-500 text-white shadow-md ring-4 ring-amber-200 animate-bounce'
                        : 'bg-slate-100 text-slate-400 border border-slate-300'
                    }`}
                  >
                    {isPast ? '✓' : index + 1}
                  </div>

                  {/* Text */}
                  <div className="ml-3 md:ml-0 md:mt-3">
                    <h4
                      className={`text-xs font-bold ${
                        isCurrent
                          ? 'text-amber-600'
                          : isPast
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug hidden md:block">
                      {desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Item Specs & Retail Breakdown (Authoritative from Backend without internal cost leaks) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-base font-bold text-slate-900 mb-4">
          {lang === 'en' ? 'Ordered Items & Print Specs' : lang === 'th' ? 'รายการสินค้าและสเปกการพิมพ์' : 'ລາຍການສິນຄ້າ ແລະ ສະເປັກງານພິມ'}
        </h3>

        <div className="divide-y divide-slate-200">
          {order.items && order.items.length > 0 ? (
            order.items.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">{item.job_name || item.item_name}</h4>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium">
                      ຈຳນວນ: {item.quantity.toLocaleString()} ຊິ້ນ
                    </span>
                    {item.paper_size && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        ຂະໜາດ: {item.paper_size}
                      </span>
                    )}
                    {item.specs?.paper && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        ກະດາດ: {item.specs.paper}
                      </span>
                    )}
                    {item.specs?.finishing && item.specs.finishing !== 'Normal' && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        ເຄືອບ/ເຂົ້າເລັ່ມ: {item.specs.finishing}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-bold font-mono text-slate-900">
                    {item.total_price_lak.toLocaleString()} ₭
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    @{item.unit_price_lak.toLocaleString()} ₭ / ຊິ້ນ
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 py-4">ບໍ່ມີລາຍການສິນຄ້າລະອຽດ</p>
          )}
        </div>
      </div>
    </div>
  );
};
