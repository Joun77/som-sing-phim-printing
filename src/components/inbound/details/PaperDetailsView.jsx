import React from 'react';
import { Package, Layers, Tag, DollarSign, Boxes, Truck, PhoneCall, FileText } from 'lucide-react';
import InboundStatusBadge from '../components/InboundStatusBadge';
import InboundMediaPreview from '../components/InboundMediaPreview';
import DynamicKeyValueGrid from './DynamicKeyValueGrid';

export default function PaperDetailsView({ item }) {
  const formatLAK = (num) => new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num || 0).replace('LAK', '₭');

  const itemName = item?.itemName || item?.name || 'Unassigned Paper Item';
  const paperSpec = item?.paperSpec || item?.spec || '-';
  const unitPrice = item?.unitPrice || item?.costPerUnit || item?.purchasePrice;
  const qty = item?.qty || item?.quantity || item?.initialQty;
  const unitName = item?.unitName || item?.purchaseUnit || 'Ream';
  const supplierName = item?.supplierName || '-';
  const supplierContact = item?.supplierContact || item?.note || '-';

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <InboundStatusBadge categoryType="Materials" materialType="Paper Stock" labelOverride="ໝວດ A: ເຈ້ຍ (Paper Stock)" />
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{itemName}</h2>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-600" />
          <span>ລາຍລະອຽດສະເປັກເຈ້ຍ (Paper Specifications & Financials)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500"><Tag className="w-4 h-4 text-sky-600" /><span className="text-[10px] font-black uppercase">ໝວດໝູ່ (Category)</span></div>
            <p className="text-sm font-black text-slate-900">ເຈ້ຍ (Paper Stock)</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500"><Layers className="w-4 h-4 text-sky-600" /><span className="text-[10px] font-black uppercase">ປະເພດເຈ້ຍ (Paper Spec)</span></div>
            <p className="text-sm font-black text-slate-900">{paperSpec}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500"><DollarSign className="w-4 h-4 text-sky-600" /><span className="text-[10px] font-black uppercase">ລາຄາ/ໜ່ວຍ (Unit Price)</span></div>
            <p className="text-sm font-black font-mono text-emerald-700">{formatLAK(unitPrice)}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500"><Boxes className="w-4 h-4 text-sky-600" /><span className="text-[10px] font-black uppercase">ຈຳນວນນຳເຂົ້າ (Quantity)</span></div>
            <p className="text-sm font-black text-slate-900">{qty ? `${Number(qty).toLocaleString()} ${unitName}` : '-'}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm sm:col-span-2">
            <div className="flex items-center gap-2 text-slate-500"><Truck className="w-4 h-4 text-sky-600" /><span className="text-[10px] font-black uppercase">ຜູ້ສະໜອງ (Supplier)</span></div>
            <p className="text-sm font-black text-slate-900">{supplierName}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm sm:col-span-2">
            <div className="flex items-center gap-2 text-slate-500"><PhoneCall className="w-4 h-4 text-sky-600" /><span className="text-[10px] font-black uppercase">ຕິດຕໍ່/ໝາຍເຫດ (Contact / Note)</span></div>
            <p className="text-sm font-black text-slate-900">{supplierContact}</p>
          </div>
        </div>

        <DynamicKeyValueGrid item={item} />
        <InboundMediaPreview itemPhoto={item?.itemPhoto || item?.imageUrl} paymentSlip={item?.paymentSlip} />
      </div>
    </div>
  );
}
