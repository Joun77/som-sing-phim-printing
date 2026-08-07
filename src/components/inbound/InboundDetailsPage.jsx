import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Edit3, 
  ShieldAlert,
  Tag,
  Package,
  Layers,
  DollarSign,
  Boxes,
  Truck,
  PhoneCall,
  Image as ImageIcon,
  Receipt,
  Printer,
  Zap,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import InboundEditForm from './InboundEditForm';

// 1. Helper — returns null (hidden) if no value found across all aliases
const getValue = (record, keys) => {
  for (const k of keys) {
    const v = record?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return null;
};

// 2. Dynamic Schema Engine — exact keys saved by InboundEntryPage
const getFieldSchema = (record) => {
  const isCategoryA =
    record?.categoryType === 'Materials' ||
    record?.type === 'Material' ||
    (record?.materialType && record?.categoryType !== 'Machinery');

  if (isCategoryA) {
    return [
      { label: 'ໝວດໝູ່ (Category)', keys: ['materialType', 'category'], icon: Tag },
      { label: 'ຊື່ລາຍການ (Item Name)', keys: ['itemName', 'name'], icon: Package },
      { label: 'ສະເປັກ (Spec)', keys: ['paperSpec'], icon: Layers },
      { label: 'ລາຄາ/ໜ່ວຍ (Unit Price)', keys: ['unitPrice', 'costPerUnit'], isCurrency: true, icon: DollarSign },
      { label: 'ຈຳນວນ (Qty)', keys: ['qty'], suffix: ` ${record?.unitName || 'Units'}`, icon: Boxes },
      { label: 'ຜູ້ສະໜອງ (Supplier)', keys: ['supplierName'], icon: Truck },
      { label: 'ຕິດຕໍ່/ໝາຍເຫດ', keys: ['supplierContact'], icon: PhoneCall, isFullWidth: true },
    ];
  }

  // Category B base fields (all equipment types)
  const baseB = [
    { label: 'ປະເພດ (Type)', keys: ['itemType'], icon: Tag },
    { label: 'ຊື່ (Name)', keys: ['itemName', 'name'], icon: Package },
    { label: 'ລາຄາຊື້ (Cost)', keys: ['totalCost', 'purchaseCost', 'unitPrice'], isCurrency: true, icon: DollarSign },
    { label: 'ອາຍຸໃຊ້ງານ (Lifespan)', keys: ['lifespanYears'], suffix: ' ປີ', icon: Clock },
    { label: 'ຄວາມຈຸລວມ (Capacity)', keys: ['lifetimeCapacity', 'printedPagesCapacity'], isNumberFormat: true, suffix: ' ແຜ່ນ', icon: Layers },
    { label: 'ຜູ້ສະໜອງ (Supplier)', keys: ['supplierName'], icon: Truck },
    { label: 'ຕິດຕໍ່/ໝາຍເຫດ', keys: ['supplierContact'], icon: PhoneCall, isFullWidth: true },
  ];

  if (record?.itemType === 'Cutter') {
    baseB.push(
      { label: 'ຄວາມຈຸຕັດ (Cut Capacity)', keys: ['cutCapacity'], suffix: ' ແຜ່ນ', icon: Layers },
      { label: 'ຄ່າເສື່ອມ/ຕັດ (Blade Dep.)', keys: ['bladeDepreciationPerCut'], isCurrency: true, icon: DollarSign },
    );
  } else if (record?.itemType === 'Laminator') {
    baseB.push({ label: 'ໜ້າກວ້າງ (Width)', keys: ['laminationWidth'], icon: Layers });
  } else if (record?.itemType === 'Binder') {
    baseB.push({ label: 'ວິທີເຂົ້າຫົວ (Method)', keys: ['bindingMethod'], icon: Layers });
  }

  return baseB;
};


export default function InboundDetailsPage({ poId, onBack }) {
  const { purchaseOrders, setPurchaseOrders, showToast } = useApp();

  const po = purchaseOrders ? purchaseOrders.find(p => (p.poId || p.id) === poId) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (!po) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center font-sans">
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-md w-full">
          <p className="text-slate-600 font-bold text-sm">ບໍ່ພົບຂໍ້ມູນການນຳເຂົ້າ</p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-xs font-black shadow-sm transition active:scale-95"
          >
            ກັບຄືນ
          </button>
        </div>
      </div>
    );
  }

  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num || 0).replace('LAK', '₭');
  };

  const handleSave = (updatedData) => {
    if (!setPurchaseOrders) return;

    setPurchaseOrders(prev => prev.map(p => {
      if ((p.poId || p.id) === poId) {
        return {
          ...p,
          ...updatedData
        };
      }
      return p;
    }));

    setIsEditing(false);
    showToast('ອັບເດດຂໍ້ມູນການນຳເຂົ້າສຳເລັດ!', 'success');
  };

  const handleDeleteRecord = () => {
    if (!setPurchaseOrders) return;

    setPurchaseOrders(prev => prev.filter(p => (p.poId || p.id) !== poId));
    showToast(`ລຶບລາຍການ PO #${poId} ສຳເລັດແລ້ວ!`, 'info');
    setIsDeleteModalOpen(false);
    onBack();
  };

  const isMachinery = po.categoryType === 'Machinery' || po.type === 'Equipment';
  // isPrinter: must have itemType === 'Printer' AND actual printer data (blackYieldPages) saved
  const isPrinter = isMachinery && po.itemType === 'Printer' && (po.blackYieldPages || po.inkType);

  const getCategoryBadge = () => {
    if (isPrinter) return 'ໝວດ B: ເຄື່ອງພິມ (Printing Machine)';
    if (isMachinery) return `ໝວດ B: ເຄື່ອງຈັກ (${getValue(po, ['itemType', 'machineCategory', 'equipmentCategory'])})`;
    return `ໝວດ A: ວັດສະດຸ (${getValue(po, ['materialType', 'categoryType', 'subCategory'])})`;
  };

  const activeSchema = getFieldSchema(po);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 space-y-6 animate-fade-in text-slate-800 font-sans pb-12">
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-200 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 bg-slate-100 rounded-2xl border border-slate-200 active:scale-95 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ກັບໜ້າການນຳເຂົ້າ</span>
        </button>

        <div className="text-right font-mono">
          <span className="text-[10px] text-slate-400 font-black block uppercase">PO ID</span>
          <span className="text-sm font-black text-slate-800">{po.poId || po.id}</span>
        </div>
      </div>

      {/* Main Details Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className={`inline-flex items-center px-3 py-1 font-mono font-black text-xs rounded-full border uppercase ${
              isMachinery ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-sky-50 text-sky-700 border-sky-200'
            }`}>
              {getCategoryBadge()}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {getValue(po, ['itemName', 'name']) || getValue(po, ['machineName']) || '-'}
            </h2>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            {isMachinery ? <Printer className="w-4 h-4 text-purple-600" /> : <Package className="w-4 h-4 text-sky-600" />}
            <span>ລາຍລະອຽດຂໍ້ມູນນຳເຂົ້າ (Inbound Specifications)</span>
          </h3>

          {/* Dynamic Grid — hides any field whose value is null */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeSchema
              .map((field) => ({ field, rawValue: getValue(po, field.keys) }))
              .filter(({ rawValue }) => rawValue !== null)
              .map(({ field, rawValue }, idx) => {
              let displayValue = rawValue;

              if (field.isCurrency) {
                displayValue = formatLAK(Number(rawValue));
              } else if (field.isNumberFormat) {
                displayValue = Number(rawValue).toLocaleString();
              }

              if (field.suffix) displayValue = `${displayValue}${field.suffix}`;

              const IconComp = field.icon;

              return (
                <div
                  key={idx}
                  className={`bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-sm ${
                    field.isFullWidth ? 'sm:col-span-2 lg:col-span-2' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 text-slate-500">
                    {IconComp && <IconComp className="w-4 h-4 text-sky-600" />}
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {field.label}
                    </span>
                  </div>
                  <p className={`text-sm font-black truncate ${field.isCurrency ? 'font-mono text-emerald-700' : 'text-slate-900'}`}>
                    {String(displayValue)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* SPECIAL PRINTER INK TECHNICAL SPEC SECTION */}
          {isPrinter && (
            <div className="bg-purple-50/70 border border-purple-200 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  🖨️ PRINTER TECHNICAL SPECS & INK YIELD PARAMETERS (ISO 5%)
                </span>
                <span className="px-3 py-0.5 bg-purple-200/60 text-purple-900 font-black text-[10px] rounded-full">
                  {getValue(po, ['inkType'])} Ink
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold">
                <div className="bg-white p-3.5 rounded-2xl border border-purple-100 space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase">ປະເພດໝຶກ (Ink Type)</p>
                  <p className="font-black text-slate-900 text-sm">{po.inkType || '-'}</p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-purple-100 space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase">ໝຶກດຳ (Black Yield / ml)</p>
                  <p className="font-black text-slate-900 text-sm">
                    {po.blackYieldPages || '-'} pages / {po.blackCapacityMl || '-'} ml
                  </p>
                  {po.blackMlPerSheet && (
                    <p className="text-[11px] text-purple-700 font-mono font-black pt-0.5">
                      Rate: {Number(po.blackMlPerSheet).toFixed(4)} ml/ແຜ່ນ
                    </p>
                  )}
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-purple-100 space-y-1">
                  <p className="text-[10px] text-purple-700 uppercase">ຊຸດໝຶກສີ (Color Yield / ml)</p>
                  <p className="font-black text-purple-900 text-sm">
                    {po.colorYieldPages || '-'} pages / {po.colorCapacityMl || '-'} ml
                  </p>
                  {po.colorMlPerSheet && (
                    <p className="text-[11px] text-purple-700 font-mono font-black pt-0.5">
                      Rate: {Number(po.colorMlPerSheet).toFixed(4)} ml/ແຜ່ນ
                    </p>
                  )}
                </div>
              </div>

              {po.linkedInkSku && (
                <div className="bg-white p-3 rounded-2xl border border-purple-200 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">ລະຫັດໝຶກໃນຄັງ (Linked Ink SKU):</span>
                  <span className="font-mono font-black text-purple-800">{po.linkedInkSku}</span>
                </div>
              )}
            </div>
          )}

          {/* 2 ATTACHMENT IMAGES AT THE BOTTOM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <ImageIcon className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-black uppercase tracking-wider">ຮູບພາບສິນຄ້າ / ເຄື່ອງຈັກ (Item Photo)</span>
              </div>
              {po.itemPhotoUrl || po.itemPhoto ? (
                <div className="h-52 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center">
                  <img src={po.itemPhotoUrl || po.itemPhoto} alt="Item Photo" className="w-full h-full object-contain rounded-lg" />
                </div>
              ) : (
                <div className="h-52 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">
                  <ImageIcon className="w-8 h-8 mb-1 text-slate-300" />
                  <span>ບໍ່ມີຮູບພາບ</span>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black uppercase tracking-wider">ຫຼັກຖານການຈ່າຍເງິນ / ສະລິບ (Payment Slip)</span>
              </div>
              {po.paymentSlipUrl || po.paymentSlip ? (
                <div className="h-52 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center">
                  <img src={po.paymentSlipUrl || po.paymentSlip} alt="Payment Slip" className="w-full h-full object-contain rounded-lg" />
                </div>
              ) : (
                <div className="h-52 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">
                  <Receipt className="w-8 h-8 mb-1 text-slate-300" />
                  <span>ບໍ່ມີສະລິບ</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions Footer */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-end gap-3">
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-2xl font-black text-xs transition active:scale-95"
        >
          <Trash2 className="w-4 h-4" />
          <span>ລຶບລາຍການ</span>
        </button>
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black text-xs shadow-sm transition active:scale-95"
        >
          <Edit3 className="w-4 h-4" />
          <span>ແກ້ໄຂຂໍ້ມູນ</span>
        </button>
      </div>

      {/* Edit Inbound Modal Overlay */}
      {isEditing && (
        <InboundEditForm
          initialData={po}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert className="w-7 h-7" />
              <div>
                <h3 className="font-black text-base text-slate-900">ຢືນຢັນການລຶບລາຍການ</h3>
                <p className="text-xs text-slate-500 font-semibold">ທ່ານແນ່ໃຈຫຼືບໍ່ວ່າຕ້ອງການລຶບລາຍການນີ້?</p>
              </div>
            </div>

            <div className="p-3 bg-red-50 rounded-2xl border border-red-100 text-xs font-bold text-red-900">
              PO #{po.poId || po.id} - {getValue(po, ['itemName', 'machineName', 'name'])} ({formatLAK(getValue(po, ['totalCost', 'purchaseCost', 'unitPrice']))})
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-50"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                onClick={handleDeleteRecord}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs shadow-sm"
              >
                ລຶບລາຍການ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



