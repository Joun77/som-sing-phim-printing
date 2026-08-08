import React from 'react';
import { 
  Package, 
  Tag, 
  Layers, 
  DollarSign, 
  Boxes, 
  Truck, 
  PhoneCall 
} from 'lucide-react';
import InboundStatusBadge from '../components/InboundStatusBadge';
import InboundMediaPreview from '../components/InboundMediaPreview';

const getValue = (record, keys, defaultValue = null) => {
  if (!record) return defaultValue;
  for (const k of keys) {
    const v = record?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return defaultValue;
};

export default function MaterialDetailsView({ po }) {
  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num || 0).replace('LAK', '₭');
  };

  const matCat = getValue(po, ['materialType', 'category', 'categoryType', 'subCategory'], 'Materials & Supplies');
  const itemName = getValue(po, ['itemName', 'name', 'materialName'], 'Unassigned Item Name');
  const paperSpec = getValue(po, ['paperSpec']);
  const unitPrice = getValue(po, ['unitPrice', 'costPerUnit', 'purchasePrice']);
  const qty = getValue(po, ['qty', 'quantity', 'initialQty']);
  const unitName = getValue(po, ['unitName', 'purchaseUnit'], 'Units');
  const supplierName = getValue(po, ['supplierName']);
  const supplierContact = getValue(po, ['supplierContact', 'note', 'remarks']);

  const itemPhoto = getValue(po, ['itemPhoto', 'itemPhotoUrl', 'imageUrl']);
  const paymentSlip = getValue(po, ['paymentSlip', 'paymentSlipUrl', 'slipUrl']);

  const schema = [
    { label: 'ໝວດໝູ່ (Material Category)', value: matCat, icon: Tag },
    { label: 'ຊື່ລາຍການ (Material Item Name)', value: itemName, icon: Package },
    { label: 'ສະເປັກ (Paper Spec)', value: paperSpec, icon: Layers },
    { label: 'ລາຄາ/ໜ່ວຍ (Unit Price)', value: unitPrice ? formatLAK(Number(unitPrice)) : null, isCurrency: true, icon: DollarSign },
    { label: 'ຈຳນວນນຳເຂົ້າ (Inbound Quantity)', value: qty ? `${Number(qty).toLocaleString()} ${unitName}` : null, icon: Boxes },
    { label: 'ຜູ້ສະໜອງ (Supplier Name)', value: supplierName, icon: Truck },
    { label: 'ໝາຍເຫດ/ຕິດຕໍ່ (Reference Note / Contact)', value: supplierContact, icon: PhoneCall, isFullWidth: true }
  ];

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <InboundStatusBadge categoryType="Materials" materialType={matCat} />
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {itemName}
          </h2>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Package className="w-4 h-4 text-sky-600" />
          <span>ລາຍລະອຽດຂໍ້ມູນນຳເຂົ້າ (Materials & Supplies Specifications)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {schema
            .filter(item => item.value !== null && item.value !== undefined)
            .map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  className={`bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-sm ${
                    item.isFullWidth ? 'sm:col-span-2 lg:col-span-2' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 text-slate-500">
                    {IconComp && <IconComp className="w-4 h-4 text-sky-600" />}
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {item.label}
                    </span>
                  </div>
                  <p className={`text-sm font-black truncate ${item.isCurrency ? 'font-mono text-emerald-700' : 'text-slate-900'}`}>
                    {String(item.value)}
                  </p>
                </div>
              );
            })}
        </div>

        <InboundMediaPreview itemPhoto={itemPhoto} paymentSlip={paymentSlip} />
      </div>
    </div>
  );
}
