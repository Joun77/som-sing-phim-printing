import React from 'react';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  QrCode, 
  Printer, 
  FileText,
  CreditCard,
  Truck
} from 'lucide-react';

export interface CustomerInvoiceTemplateProps {
  order: any;
  currentLang?: string;
  formatLAK?: (n: number) => string;
  showBankQR?: boolean;
}

export const CustomerInvoiceTemplate: React.FC<CustomerInvoiceTemplateProps> = ({
  order,
  currentLang = 'lo',
  formatLAK = (n: number) => `${Number(n || 0).toLocaleString()} ₭`,
  showBankQR = true,
}) => {
  if (!order) return null;

  const orderNo = order.orderNo || order.order_no || order.orderNumber || order.id || 'ORDER';
  const invoiceNo = `INV-${orderNo.toString().replace(/^SSP-|^ORD-|^#/, '')}`;
  const customerName = order.customerName || order.customer_name || order.customer || 'Somphavath DOUANGSVA';
  const customerPhone = order.phone || order.customer_phone || '020 5886 6339';
  const customerAddress = order.address || order.delivery_address || 'Saysettha, Vientiane (ຮັບເອງ ຫຼື ຂົນສົ່ງ)';
  const courier = order.deliveryMethod || order.shippingCourier || order.courier || 'Anousith Express';
  const invoiceDate = order.date || new Date().toISOString().split('T')[0];
  const promisedDate = order.promisedDeliveryDate || order.delivery_date || invoiceDate;

  // Financial calculations
  const totalAmountLAK = Number(order.totalPriceCharged || order.totalAmount || order.total_amount_lak || order.total_price || 0);
  const depositPaid = Number(order.depositAmountPaid || order.deposit_lak || order.depositAmount || 0);
  const shippingFee = Number(order.shippingFee || order.shipping_fee || 0);
  const discountAmount = Number(order.discountAmount || order.discount || 0);
  
  const rawSubtotal = totalAmountLAK - shippingFee + discountAmount;
  const subtotalLAK = rawSubtotal > 0 ? rawSubtotal : totalAmountLAK;
  const remainingLAK = order.remainingUnpaidBalance !== undefined 
    ? Number(order.remainingUnpaidBalance) 
    : (order.remaining_lak !== undefined ? Number(order.remaining_lak) : Math.max(0, totalAmountLAK - depositPaid));

  const isFullyPaid = order.paymentStatus === 'Paid' || order.paymentStatus === 'PAID' || remainingLAK === 0;

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
    {
      name: order.product_name || order.specs?.name || 'Custom Print Job',
      quantity: order.quantity || 1,
      paperType: order.specs?.paperType || 'Art Card 260g',
      paperSize: order.specs?.size || 'A4',
      pages: order.specs?.pages || 1,
      binding: order.specs?.binding,
      coating: order.specs?.lamination,
      unitPrice: totalAmountLAK / (order.quantity || 1),
      totalPrice: totalAmountLAK,
    }
  ];

  const getBindingLabel = (method?: string) => {
    switch (method) {
      case 'WIRE_O': return currentLang === 'lo' ? 'ສັນຫ່ວງຂົດລວດ (Wire-O)' : 'Wire-O Binding';
      case 'SADDLE_STITCH': return currentLang === 'lo' ? 'ຫຍິບມຸງກົກ (Saddle Stitch)' : 'Saddle Stitch';
      case 'PERFECT_HOT_GLUE': return currentLang === 'lo' ? 'ໄສກາວຮ້ອນ (Perfect Glue)' : 'Perfect Glue Binding';
      case 'CALENDAR': return currentLang === 'lo' ? 'ສັນປະຕິທິນ (Calendar)' : 'Calendar Wire-O';
      case 'CORNER_STAPLE': return currentLang === 'lo' ? 'ແມັກມຸມ (Corner Staple)' : 'Corner Staple';
      default: return method || '';
    }
  };

  const getCoatingLabel = (coating?: string) => {
    switch (coating) {
      case 'GLOSS': return currentLang === 'lo' ? 'ເຄືອບເງົາ (Gloss)' : 'Gloss Lamination';
      case 'MATTE': return currentLang === 'lo' ? 'ເຄືອບດ້ານ (Matte)' : 'Matte Lamination';
      case 'SPOT_UV': return currentLang === 'lo' ? 'Spot UV ສະເພາະຈຸດ' : 'Spot UV';
      default: return coating || '';
    }
  };

  return (
    <div className="bg-white text-slate-900 font-sans p-8 sm:p-10 max-w-4xl mx-auto border border-slate-200 shadow-xs rounded-xl print:border-none print:shadow-none print:p-6 print:max-w-none">
      
      {/* 1. Header: Shop Identity & Invoice Title */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-xl shadow-xs">
              SSP
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                ສົມສິງ ພິມ • SOM SING PRINTING
              </h1>
              <p className="text-xs font-bold text-slate-600">
                ໂຮງພິມດິຈິຕອລ & ອັອບເຊັດ ຄົບວົງຈອນ (Commercial & Digital Print ERP)
              </p>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-slate-600 space-y-0.5">
            <p className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>ບ້ານ ໂພນທັນ, ເມືອງ ໄຊເສດຖາ, ນະຄອນຫຼວງວຽງຈັນ, ສປປ ລາວ</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono font-bold">Tel / WhatsApp: +856 20 5886 6339</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono">somsingprinting@gmail.com</span>
            </p>
          </div>
        </div>

        {/* Invoice Top Right Meta */}
        <div className="text-right space-y-2">
          <div className="inline-block px-4 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 text-right shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-600 block">
              OFFICIAL INVOICE
            </span>
            <span className="text-sm font-black font-mono tracking-wider text-slate-900">
              {invoiceNo}
            </span>
          </div>

          <div className="text-xs text-slate-600 space-y-1 mt-2">
            <div>
              <span className="text-slate-400 font-medium">ວັນທີອອກບິນ: </span>
              <strong className="text-slate-900 font-mono">{invoiceDate}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-medium">ກຳນົດສົ່ງມອບ: </span>
              <strong className="text-slate-900 font-mono">{promisedDate}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-medium">ເລກທີອໍເດີ: </span>
              <strong className="text-amber-700 font-mono">#{orderNo}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Customer & Bill To Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-xs">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            {currentLang === 'lo' ? 'ຂໍ້ມູນລູກຄ້າ / ຜູ້ສັ່ງຊື້ (Billed To):' : 'Billed To:'}
          </span>
          <strong className="text-sm font-black text-slate-950 block">{customerName}</strong>
          <span className="text-slate-600 block mt-0.5 font-mono">ເບີໂທ: {customerPhone}</span>
        </div>

        <div className="sm:border-l sm:border-slate-200 sm:pl-4">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            {currentLang === 'lo' ? 'ສະຖານທີ່ຈັດສົ່ງ & ຂົນສົ່ງ (Ship To):' : 'Ship To:'}
          </span>
          <span className="text-slate-700 font-medium block">{customerAddress}</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-bold text-[10.5px]">
              ຂົນສົ່ງ: {courier}
            </span>
            {order.trackingNumber && (
              <span className="font-mono text-blue-700 font-bold text-[10.5px]">
                Tracking: {order.trackingNumber}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Itemized Customer Products Table (Strictly NO Internal Material Cost Markup) */}
      <div className="overflow-hidden border border-slate-200 rounded-2xl mb-6">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-3.5 text-center w-12">#</th>
              <th className="py-3 px-4">{currentLang === 'lo' ? 'ລາຍການສິນຄ້າ & ສະເປກງານພິມ' : 'Product & Specifications'}</th>
              <th className="py-3 px-3.5 text-center w-20">{currentLang === 'lo' ? 'ຈຳນວນ' : 'Qty'}</th>
              <th className="py-3 px-4 text-right w-28">{currentLang === 'lo' ? 'ລາຄາ/ໜ່ວຍ' : 'Unit Price'}</th>
              <th className="py-3 px-4 text-right w-32">{currentLang === 'lo' ? 'ລວມເງິນ' : 'Total (LAK)'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.map((it: any, idx: number) => {
              const qty = Number(it.quantity || 1);
              const itemTotal = Number(it.totalPrice || it.total_price_lak || it.total_price || (totalAmountLAK / items.length));
              const itemUnitPrice = Number(it.unitPrice || it.unit_price_lak || (itemTotal / qty));
              
              // Specs formatting for customer
              const sizeText = it.jobWidth && it.jobHeight ? `${it.jobWidth}×${it.jobHeight}mm (${it.paperSize || 'Custom'})` : (it.paperSize || 'A4');
              const paperText = it.paperSku || it.paperId || it.paperType || it.paper_name || 'Art Card 260g';
              const totalPages = it.pagesPerBook || it.page_count || it.pages || 1;
              const bindingDesc = it.bindingMethod ? getBindingLabel(it.bindingMethod) : (it.binding ? getBindingLabel(it.binding) : null);
              const coatingDesc = it.coating ? getCoatingLabel(it.coating) : null;

              return (
                <tr key={it.id || idx} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-3.5 text-center font-mono font-bold text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <strong className="text-slate-900 block text-xs font-black">
                      {it.name || it.item_name || it.job_name || `Print Product #${idx + 1}`}
                    </strong>
                    
                    {/* Customer Spec Chips */}
                    <div className="flex flex-wrap gap-1.5 mt-1 text-[10px] text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                        ຂະໜາດ: {sizeText}
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                        ເຈ້ຍ: {paperText}
                      </span>
                      {totalPages > 1 && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                          {totalPages} ໜ້າ
                        </span>
                      )}
                      {bindingDesc && (
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-0.5 rounded font-bold">
                          {bindingDesc}
                        </span>
                      )}
                      {coatingDesc && (
                        <span className="bg-purple-50 text-purple-700 border border-purple-200/60 px-2 py-0.5 rounded font-bold">
                          {coatingDesc}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3.5 text-center font-mono font-bold text-slate-900">
                    {qty.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">
                    {formatLAK(itemUnitPrice)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-black text-slate-950">
                    {formatLAK(itemTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 4. Financial Summary Ledger & Payment QR */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start mb-8">
        
        {/* Left: Bank Account Details & QR Code */}
        <div className="sm:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentLang === 'lo' ? 'ຊ່ອງທາງການຊຳລະເງິນ (Bank Payment):' : 'Bank Payment Transfer:'}</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              BCEL One Ready
            </span>
          </div>

          <div className="flex items-start gap-4">
            {/* QR Code Container */}
            {showBankQR && (
              <div className="w-24 h-24 bg-white border border-slate-300 rounded-xl p-1.5 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BCELONE_SOM_SING_PRINTING_02058866339"
                  alt="BCEL One QR"
                  className="w-full h-full object-contain"
                />
                <span className="text-[8px] font-black uppercase text-slate-500 mt-0.5 tracking-tighter">BCEL One</span>
              </div>
            )}

            <div className="space-y-1 text-xs">
              <div>
                <span className="text-slate-400 text-[10.5px] block font-bold">ທະນາຄານການຄ້າຕ່າງປະເທດລາວ (BCEL):</span>
                <strong className="text-slate-900 font-mono text-sm block">160-12-00-01984210-001</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10.5px] block font-bold">ຊື່ບັນຊີ / Account Name:</span>
                <strong className="text-slate-900 text-xs block">SOM SING PRINTING (ສົມສິງ ພິມ)</strong>
              </div>
              <p className="text-[10px] text-slate-500 italic mt-1 leading-tight">
                * ກະລຸນາແນບສະລິບໂອນເງິນພ້ອມລະບຸເລກທີບິນ <span className="font-mono font-bold text-slate-700">{invoiceNo}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Subtotal & Balance Breakdown (Bright Sky Theme) */}
        <div className="sm:col-span-5 bg-sky-50 border border-sky-200 text-slate-900 rounded-2xl p-4.5 space-y-2.5 shadow-xs">
          <div className="flex justify-between text-xs text-slate-600 font-semibold">
            <span>{currentLang === 'lo' ? 'ມູນຄ່າລວມສິນຄ້າ (Subtotal):' : 'Subtotal:'}</span>
            <span className="font-mono font-bold text-slate-800">{formatLAK(subtotalLAK)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-xs text-rose-600 font-semibold">
              <span>{currentLang === 'lo' ? 'ສ່ວນຫຼຸດ (Discount):' : 'Discount:'}</span>
              <span className="font-mono font-bold">-{formatLAK(discountAmount)}</span>
            </div>
          )}

          {shippingFee > 0 && (
            <div className="flex justify-between text-xs text-slate-600 font-semibold">
              <span>{currentLang === 'lo' ? 'ຄ່າຈັດສົ່ງ (Shipping Fee):' : 'Shipping:'}</span>
              <span className="font-mono font-bold text-slate-800">+{formatLAK(shippingFee)}</span>
            </div>
          )}

          <div className="border-t border-sky-200 pt-2 flex justify-between items-center">
            <span className="text-xs font-black text-sky-800 uppercase tracking-wider">
              {currentLang === 'lo' ? 'ຍອດລວມສຸດທິ (Grand Total):' : 'Grand Total:'}
            </span>
            <strong className="text-base font-black font-mono text-sky-700">
              {formatLAK(totalAmountLAK)}
            </strong>
          </div>

          <div className="border-t border-sky-200 pt-2 flex justify-between text-xs text-emerald-700 font-bold">
            <span>{currentLang === 'lo' ? 'ຊຳລະແລ້ວ / ມັດຈຳ (Paid):' : 'Deposit / Paid:'}</span>
            <span className="font-mono font-bold">{formatLAK(depositPaid)}</span>
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-sky-200">
            <span className="text-xs font-bold text-slate-700">
              {currentLang === 'lo' ? 'ຍອດຄ້າງຊຳລະ (Remaining):' : 'Remaining Balance:'}
            </span>
            <span className={`font-mono font-black text-sm ${
              remainingLAK === 0 ? 'text-emerald-700' : 'text-slate-900'
            }`}>
              {formatLAK(remainingLAK)}
            </span>
          </div>
        </div>

      </div>

      {/* 5. Signatures & Official Stamp Footer */}
      <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-xs text-center">
        <div>
          <span className="text-slate-500 font-bold block mb-12">
            {currentLang === 'lo' ? 'ລາຍເຊັນຜູ້ຮັບສິນຄ້າ / Customer Signature' : 'Customer Received By'}
          </span>
          <div className="border-b border-slate-300 w-48 mx-auto mb-1"></div>
          <span className="text-[10px] text-slate-400 block font-mono">ວັນທີ / Date: ____/____/2026</span>
        </div>

        <div>
          <span className="text-slate-500 font-bold block mb-12">
            {currentLang === 'lo' ? 'ຜູ້ມີອຳນາດລົງນາມ / Authorized Stamp & Signature' : 'Authorized Stamp & Signature'}
          </span>
          <div className="border-b border-slate-300 w-48 mx-auto mb-1"></div>
          <span className="text-[10px] text-slate-400 block font-mono">ສົມສິງ ພິມ • Som Sing Printing</span>
        </div>
      </div>

      {/* Bottom Legal Note */}
      <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
        {currentLang === 'lo' 
          ? 'ຂອບໃຈທີ່ໄວ້ວາງໃຈໃຊ້ບໍລິການ ໂຮງພິມ ສົມສິງ ພິມ • ຕິດຕໍ່ສອບຖາມເພີ່ມເຕີມ: 020 5886 6339'
          : 'Thank you for choosing Som Sing Printing! • Inquiries & Support: +856 20 5886 6339'}
      </div>

    </div>
  );
};

export default CustomerInvoiceTemplate;
