import React from 'react';
import { FileText } from 'lucide-react';

export default function ProcurementDetailCard({ item, currentLang }: { item: any; currentLang: string }) {
  const specs = item.specs || item.technical_specs || {};
  const supplierPhone = item.supplier_phone || specs.supplier_phone;
  const purchaseLink = item.purchase_link || specs.purchase_link;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
        <FileText className="w-4 h-4 text-sky-600" />
        <span>{currentLang === 'lo' ? 'ລາຍລະອຽດການສັ່ງຊື້ & ນຳເຂົ້າ (Procurement Details)' : 'Procurement Details'}</span>
      </h3>
      <div className="grid grid-cols-2 gap-4 text-xs font-medium">
        <div>
          <span className="text-slate-400 block text-[11px]">PO / Ref ID:</span>
          <span className="font-mono text-slate-800 font-extrabold">{item.poNumber || item.id}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">SKU Code:</span>
          <span className="font-mono text-slate-800 font-bold">{item.sku || item.id}</span>
        </div>
        {item.receiptDate && (
          <div>
            <span className="text-slate-400 block text-[11px]">{currentLang === 'lo' ? 'ວັນທີນຳເຂົ້າ:' : 'Import Date:'}</span>
            <span className="text-slate-800 font-bold">{item.receiptDate}</span>
          </div>
        )}
        {item.paymentMethod && (
          <div>
            <span className="text-slate-400 block text-[11px]">{currentLang === 'lo' ? 'ຊ່ອງທາງຊຳລະເງິນ:' : 'Payment Method:'}</span>
            <span className="font-bold text-slate-800">
              {item.paymentMethod === 'TRANSFER' 
                ? (currentLang === 'lo' ? 'ໂອນເງິນ (Bank Transfer)' : 'Bank Transfer (โอนจ่าย)') 
                : item.paymentMethod === 'CASH' 
                ? (currentLang === 'lo' ? 'ເງິນສົດ (Cash)' : 'Cash (เงินสด)')
                : item.paymentMethod}
            </span>
          </div>
        )}
        {supplierPhone && (
          <div>
            <span className="text-slate-400 block text-[11px]">{currentLang === 'lo' ? 'ເບີໂທຜູ້ຂາຍ:' : 'Supplier Phone:'}</span>
            <span className="font-bold text-slate-800">{supplierPhone}</span>
          </div>
        )}
        {purchaseLink && (
          <div className="col-span-2">
            <span className="text-slate-400 block text-[11px]">{currentLang === 'lo' ? 'ລິ້ງຈັດຊື້:' : 'Purchase Link:'}</span>
            <a href={purchaseLink} target="_blank" rel="noopener noreferrer" className="font-bold text-sky-600 hover:underline truncate block">
              {purchaseLink}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
