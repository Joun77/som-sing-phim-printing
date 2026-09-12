import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  FileText, 
  Microchip, 
  Vault, 
  CreditCard, 
  Image as ImageIcon, 
  DollarSign, 
  Calendar, 
  Truck, 
  Phone, 
  Layers, 
  CheckCircle2, 
  Package, 
  Maximize2,
  X,
  ExternalLink as LinkIcon,
  Download
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@store/AppContext';
import DynamicSpecDetail from '@features/inventory/components/details/DynamicSpecDetail';
import PrinterInkComparisonCard from '@features/inventory/components/details/PrinterInkComparisonCard';
import ConfirmDeleteModal from '@components/common/ConfirmDeleteModal';

interface InboundItemDetailsPageProps {
  item: any;
  onBack: () => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}

export default function InboundItemDetailsPage({
  item,
  onBack,
  onEdit,
  onDelete
}: InboundItemDetailsPageProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const { formatCurrency, inventory, equipment } = useApp();

  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const formatLAK = (amount: number) => {
    return formatCurrency ? formatCurrency(amount) : `LAK ${Number(amount || 0).toLocaleString()}`;
  };

  const specs = item.specs || item.technical_specs || {};
  const cat = (item.category || item.categoryPill || '').toUpperCase();
  const rawQty = Number(item.initialQty || item.currentQty || item.quantity) || 1;
  const totalPrice = Number(item.totalPrice) || 0;

  // Paper & quantity calculations
  const isPaper = cat === 'PAPER' || cat === 'MATERIAL' || (item.name || '').toLowerCase().includes('paper') || (item.name || '').toLowerCase().includes('double a');
  const isPrinter = cat === 'PRINTER' || 
    cat === 'MACHINERY' || 
    cat === 'EQUIPMENT' || 
    (specs.machineryTypeCategory && ['laser', 'inkjet'].includes(specs.machineryTypeCategory.toLowerCase())) ||
    (item.name || '').toLowerCase().includes('printer') ||
    (item.name || '').toLowerCase().includes('ecotank') ||
    (item.name || '').toLowerCase().includes('l15150') ||
    (item.name || '').toLowerCase().includes('epson') ||
    (item.name || '').toLowerCase().includes('fuji') ||
    (item.name || '').toLowerCase().includes('brother') ||
    (item.name || '').toLowerCase().includes('canon') ||
    (item.name || '').toLowerCase().includes('ເຄື່ອງພິມ') ||
    (Array.isArray(specs.oemBaselineInks) && specs.oemBaselineInks.length > 0) ||
    (Array.isArray(specs.printerInkSlots) && specs.printerInkSlots.length > 0);
  
  const paperFormatLower = (specs.paperFormat || item.paperFormat || '').toLowerCase();
  const isRoll = paperFormatLower === 'roll';
  const isSheet = isPaper && !isRoll;

  const unitStr = (item.unit || specs.packagingType || '').toLowerCase();
  let defaultMultiplier = 500;
  if (unitStr.includes('ລັງ') || unitStr.includes('carton') || unitStr.includes('box')) {
    defaultMultiplier = 2500;
  } else if (unitStr.includes('ແພັກ') || unitStr.includes('pack')) {
    defaultMultiplier = (specs.paperType === 'Photo Paper' ? 50 : 100);
  } else if (unitStr.includes('ແຜ່ນ') || unitStr.includes('sheet')) {
    defaultMultiplier = 1;
  }

  let sheetsPerPack = Number(
    specs.sheetsPerPack || 
    specs.sheets_per_ream || 
    specs.sheets_per_pack || 
    item.sheetsPerPack || 
    item.sheets_per_ream ||
    item.purchaseMultiplier ||
    defaultMultiplier
  );

  if (!sheetsPerPack || sheetsPerPack <= 0) {
    const invItem = inventory.find(i => 
      i.id === specs.materialId || 
      i.sku === item.sku || 
      i.id === item.id || 
      (i.name && item.name && i.name.toLowerCase().trim() === item.name.toLowerCase().trim())
    );
    sheetsPerPack = Number(invItem?.purchaseMultiplier || invItem?.purchase_multiplier || invItem?.specs?.sheetsPerPack || defaultMultiplier);
  }
  if (sheetsPerPack <= 0) sheetsPerPack = defaultMultiplier;

  const totalSheets = isSheet ? (rawQty * sheetsPerPack) : rawQty;
  const costPerSheet = isSheet && totalSheets > 0 ? (totalPrice / totalSheets) : null;
  const costPerUnit = totalPrice / Math.max(1, rawQty);

  // Supplier & logistics fields
  const supplierName = item.supplier || item.supplierName || specs.supplier_name || '-';
  const supplierPhone = item.supplier_phone || specs.supplier_phone || item.supplierPhone;
  const deliveryCourier = item.delivery_courier || specs.delivery_courier || item.courier;
  const trackingNumber = item.tracking_number || specs.tracking_number || item.trackingNo;
  const purchaseLink = item.purchase_link || specs.purchase_link || item.purchaseLink;
  const receiptTimestamp = item.receiptDate || item.inboundDate || item.created_at || '-';

  // Check matching inventory or equipment
  const matchingEquipment = equipment?.find(e => 
    e.id === item.id || 
    e.id === item.sku || 
    e.serialNumber === specs.serialNumber ||
    (e.name && item.name && e.name.toLowerCase().trim() === item.name.toLowerCase().trim())
  );

  const matchingInventory = inventory?.find(i => 
    i.id === item.id || 
    i.sku === item.sku || 
    (i.name && item.name && i.name.toLowerCase().trim() === item.name.toLowerCase().trim())
  );

  return (
    <div className="space-y-6 text-slate-800 animate-fadeIn">
      {/* 1. TOP NAVIGATION & HEADER ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 bg-slate-100 rounded-2xl border border-slate-200 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ກັບຄືນໜ້ານຳເຂົ້າສິນຄ້າ' : 'Back to Inbound Procurement'}</span>
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono font-extrabold text-blue-900 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">
                PO: {item.poNumber || item.id}
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                {item.categoryPill || item.category || 'General'}
              </span>
              {item.paymentMethod && (
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {item.paymentMethod === 'TRANSFER' 
                    ? (currentLang === 'lo' ? 'ໂອນເງິນ (Bank Transfer)' : 'Bank Transfer') 
                    : item.paymentMethod === 'CASH' 
                    ? (currentLang === 'lo' ? 'ເງິນສົດ (Cash)' : 'Cash') 
                    : item.paymentMethod}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {item.name || item.itemName || 'Inbound Procurement Item'}
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              SKU: {item.sku || item.skuCode || item.id} | {currentLang === 'lo' ? 'ວັນທີນຳເຂົ້າ:' : 'Inbound Date:'} {receiptTimestamp}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onEdit(item)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-2xl border border-sky-200 transition cursor-pointer active:scale-95 shadow-2xs"
          >
            <Edit3 className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ແກ້ໄຂຂໍ້ມູນ' : 'Edit Entry'}</span>
          </button>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-2xl border border-rose-200 transition cursor-pointer active:scale-95 shadow-2xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ລຶບລາຍການ' : 'Delete Entry'}</span>
          </button>
        </div>
      </div>

      {/* 2. KEY METRICS BENTO BAR (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cost */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">
              {currentLang === 'lo' ? 'ມູນຄ່ານຳເຂົ້າລວມ (Total Cost)' : 'Total Inbound Cost'}
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {formatLAK(totalPrice)}
          </div>
          <span className="text-[11px] text-slate-400 block font-medium">
            {currentLang === 'lo' ? 'ຍອດຊຳລະສຸດທິ' : 'Net purchase value'}
          </span>
        </div>

        {/* Quantity */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">
              {currentLang === 'lo' ? 'ຈຳນວນນຳເຂົ້າ (Inbound Qty)' : 'Inbound Quantity'}
            </span>
            <Package className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-700 font-mono">
            {(() => {
              if (cat === 'PRINTER' || cat === 'MACHINERY' || cat === 'EQUIPMENT') {
                return `${rawQty} ${currentLang === 'lo' ? 'ເຄື່ອງ' : 'Unit'}`;
              }
              if (cat === 'INK') {
                return `${rawQty} ${currentLang === 'lo' ? 'ຂວດ' : 'Bottle'}`;
              }
              if (isPaper && isSheet) {
                return `${totalSheets.toLocaleString()} ${currentLang === 'lo' ? 'ແຜ່ນ' : 'Sheets'}`;
              }
              return `${rawQty} ${item.unit || 'Unit'}`;
            })()}
          </div>
          <span className="text-[11px] text-slate-400 block font-medium">
            {isPaper && isSheet ? `(${rawQty} ${item.unit || 'ຣີມ'} x ${sheetsPerPack.toLocaleString()} ແຜ່ນ/${item.unit || 'ຣີມ'})` : `${rawQty} ${item.unit || 'Unit'}`}
          </span>
        </div>

        {/* Unit Cost */}
        <div className="bg-blue-50/60 p-5 rounded-3xl border border-blue-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-blue-900">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">
              {isPaper && isSheet 
                ? (currentLang === 'lo' ? 'ຕົ້ນທຶນຕໍ່ແຜ່ນ (Cost/Sheet)' : 'Cost Per Sheet')
                : (currentLang === 'lo' ? 'ຕົ້ນທຶນຕໍ່ໜ່ວຍ (Unit Cost)' : 'Unit Cost')}
            </span>
            <Layers className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-950 font-mono">
            {isPaper && isSheet && costPerSheet !== null ? (
              <span>{formatLAK(costPerSheet)} <span className="text-xs font-bold text-slate-500">/ {currentLang === 'lo' ? 'ແຜ່ນ' : 'sheet'}</span></span>
            ) : (
              <span>{formatLAK(costPerUnit)} <span className="text-xs font-bold text-slate-500">/ {item.unit || (cat.includes('PRINTER') || cat.includes('MACHINE') ? 'ເຄື່ອງ' : 'ໜ່ວຍ')}</span></span>
            )}
          </div>
          <span className="text-[11px] text-blue-900/80 block font-medium">
            {isPaper && isSheet ? `${formatLAK(costPerUnit)} / ${item.unit || 'ຣີມ'} (ຕົ້ນທຶນຊື້ຕໍ່${item.unit || 'ຣີມ'})` : 'Average inbound rate'}
          </span>
        </div>

        {/* Supplier Info */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">
              {currentLang === 'lo' ? 'ຜູ້ສະໜອງ (Supplier)' : 'Supplier'}
            </span>
            <Truck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-black text-slate-900 truncate">
            {supplierName}
          </div>
          <span className="text-[11px] text-slate-400 block truncate font-medium">
            {supplierPhone ? `${supplierPhone}` : (currentLang === 'lo' ? 'ບໍ່ມີເບີໂທ' : 'No phone recorded')}
          </span>
        </div>
      </div>

      {/* 3. MAIN FULL-WIDTH TWO-COLUMN BENTO CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (2/3 WIDTH): Technical Specs & Procurement Logistics */}
        <div className="lg:col-span-2 space-y-6">
          {/* ERP Technical Specifications */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
                  <Microchip className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {currentLang === 'lo' ? 'ສະເປັກທາງເຕັກນິກລະບົບ (ERP Technical Specifications)' : 'ERP Technical Specifications'}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {currentLang === 'lo' 
                      ? 'ຂໍ້ມູນຄຸນລັກສະນະວັດສະດຸ ແລະ ອະໄຫຼ່ສວມໃສ່ທີ່ນຳໃຊ້ໃນການຄິດໄລ່ຕົ້ນທຶນການຜະລິດ'
                      : 'Material engineering specs and wear parts used in production cost calculation'}
                  </p>
                </div>
              </div>
            </div>

            {/* Dynamic Spec Detail Engine Component */}
            <div className="pt-2">
              <DynamicSpecDetail item={item} currentLang={currentLang} hideInkComparisonCard={isPrinter} />
            </div>
          </div>

          {/* Procurement & Logistics Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-sky-50 text-sky-700 rounded-2xl border border-sky-100">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  {currentLang === 'lo' ? 'ຂໍ້ມູນການຈັດຊື້ ແລະ ການຈັດສົ່ງ (Procurement & Logistics)' : 'Procurement & Logistics'}
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {currentLang === 'lo' ? 'ລາຍລະອຽດຜູ້ຂາຍ, ເອກະສານອ້າງອີງ ແລະ ເລກຕິດຕາມພັດສະດຸ' : 'Vendor details, references, and delivery tracking'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-bold block mb-1">PO / Reference ID</span>
                <span className="font-mono text-slate-900 font-black text-sm">{item.poNumber || item.id}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-bold block mb-1">SKU Code</span>
                <span className="font-mono text-slate-900 font-black text-sm">{item.sku || item.skuCode || item.id}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-bold block mb-1">{currentLang === 'lo' ? 'ຊ່ອງທາງຊຳລະ' : 'Payment Method'}</span>
                <span className="font-bold text-slate-900 text-sm">
                  {item.paymentMethod === 'TRANSFER' 
                    ? (currentLang === 'lo' ? 'ໂອນເງິນ (Bank Transfer)' : 'Bank Transfer') 
                    : item.paymentMethod === 'CASH' 
                    ? (currentLang === 'lo' ? 'ເງິນສົດ (Cash)' : 'Cash') 
                    : item.paymentMethod || '-'}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-bold block mb-1">{currentLang === 'lo' ? 'ຜູ້ສະໜອງສິນຄ້າ' : 'Vendor / Supplier'}</span>
                <span className="font-bold text-slate-900 text-sm">{supplierName}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-bold block mb-1">{currentLang === 'lo' ? 'ເບີໂທຜູ້ສະໜອງ / ຜູ້ຈັດສົ່ງ' : 'Contact Phone'}</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{supplierPhone || '-'}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-bold block mb-1">{currentLang === 'lo' ? 'ຂົນສົ່ງ / ເລກພັດສະດຸ' : 'Courier / Tracking'}</span>
                <span className="font-bold text-slate-900 text-sm">
                  {deliveryCourier || trackingNumber ? `${deliveryCourier || ''} ${trackingNumber ? `(${trackingNumber})` : ''}` : '-'}
                </span>
              </div>

              {purchaseLink && (
                <div className="col-span-full bg-sky-50/50 p-3.5 rounded-2xl border border-sky-100">
                  <span className="text-[11px] text-sky-800 uppercase font-bold block mb-1">{currentLang === 'lo' ? 'ລິ້ງສັ່ງຊື້ສິນຄ້າ' : 'Purchase Link'}</span>
                  <a 
                    href={purchaseLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-bold text-sky-700 hover:text-sky-900 underline flex items-center gap-1.5 truncate"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{purchaseLink}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (1/3 WIDTH): Document Vault & System Linking */}
        <div className="space-y-6">
          {/* Document Vault Attachments */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-blue-50 text-blue-900 rounded-2xl border border-blue-100">
                <Vault className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Document Vault</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {currentLang === 'lo' ? 'ຫຼັກຖານຮູບສິນຄ້າ & ສະລິບການໂອນເງິນ' : 'Attached evidence and receipts'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Product Photo */}
              <div className="space-y-1.5">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{currentLang === 'lo' ? 'ຮູບພາບສິນຄ້າຕົວຈິງ' : 'Product Photo'}</span>
                </span>

                <div 
                  onClick={() => item.docs?.productPhoto && setLightboxImg(item.docs.productPhoto)}
                  className="group relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-video flex flex-col items-center justify-center cursor-pointer shadow-2xs hover:border-sky-300 transition"
                >
                  {item.docs?.productPhoto ? (
                    <>
                      <img 
                        src={item.docs.productPhoto} 
                        alt="Product Photo" 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                      />
                      <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-2 font-bold text-xs backdrop-blur-2xs">
                        <Maximize2 className="w-4 h-4" />
                        <span>{currentLang === 'lo' ? 'ກົດເພື່ອຂະຫຍາຍ' : 'View Full Image'}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4 text-slate-400 text-xs">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                      <span>{currentLang === 'lo' ? 'ບໍ່ມີຮູບພາບສິນຄ້າ' : 'No photo uploaded'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Slip */}
              <div className="space-y-1.5">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                  <span>{currentLang === 'lo' ? 'ສະລິບໂອນເງິນ' : 'Payment Slip'}</span>
                </span>

                <div 
                  onClick={() => item.docs?.paymentSlip && setLightboxImg(item.docs.paymentSlip)}
                  className="group relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-video flex flex-col items-center justify-center cursor-pointer shadow-2xs hover:border-sky-300 transition"
                >
                  {item.docs?.paymentSlip ? (
                    <>
                      <img 
                        src={item.docs.paymentSlip} 
                        alt="Payment Slip" 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                      />
                      <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-2 font-bold text-xs backdrop-blur-2xs">
                        <Maximize2 className="w-4 h-4" />
                        <span>{currentLang === 'lo' ? 'ກົດເພື່ອຂະຫຍາຍ' : 'View Full Slip'}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4 text-slate-400 text-xs">
                      <CreditCard className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                      <span>{currentLang === 'lo' ? 'ບໍ່ມີສະລິບໂອນເງິນ' : 'No payment slip attached'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ERP Inventory & Asset Linking Status */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{currentLang === 'lo' ? 'ສະຖານະການເຊື່ອມໂຍງລະບົບ ERP' : 'ERP System Linkage'}</span>
            </h3>

            <div className="space-y-3 text-xs">
              {matchingEquipment ? (
                <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-extrabold text-sky-800 uppercase block">
                    {currentLang === 'lo' ? 'ເຊື່ອມໂຍງກັບທະບຽນເຄື່ອງຈັກ' : 'Linked Equipment Profile'}
                  </span>
                  <div className="font-bold text-slate-900">{matchingEquipment.name}</div>
                  <span className="text-[11px] font-mono text-sky-700 block">ID: {matchingEquipment.id}</span>
                </div>
              ) : matchingInventory ? (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">
                    {currentLang === 'lo' ? 'ເຊື່ອມໂຍງກັບສາງວັດສະດຸ' : 'Linked Inventory Material'}
                  </span>
                  <div className="font-bold text-slate-900">{matchingInventory.name}</div>
                  <span className="text-[11px] font-mono text-emerald-700 block">SKU: {matchingInventory.sku || matchingInventory.id}</span>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500">
                  <span>{currentLang === 'lo' ? 'ລາຍການນຳເຂົ້າທົ່ວໄປ (ບັນທຶກໃນລະບົບແລ້ວ)' : 'Standard inbound procurement record'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. PRINTER INK BENCHMARK & SLOT LINKER (FULL WIDTH DEDICATED SUITE) */}
      {isPrinter && (
        <div className="w-full">
          <PrinterInkComparisonCard printerItem={item} currentLang={currentLang} />
        </div>
      )}

      {/* 4. LIGHTBOX IMAGE PREVIEW MODAL */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxImg(null)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full p-4 flex items-center justify-between border-b border-slate-800 text-white">
              <span className="text-xs font-bold text-slate-300">Document Image Viewer</span>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxImg}
                  download="inbound-document"
                  className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setLightboxImg(null)}
                  className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[80vh]">
              <img src={lightboxImg} alt="Preview" className="max-h-[75vh] w-auto object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {/* 5. CONFIRM DELETE MODAL */}
      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          title={currentLang === 'lo' ? 'ຢືນຢັນການລຶບລາຍການນຳເຂົ້າ' : 'Confirm Inbound Record Deletion'}
          itemName={item.name || item.itemName}
          description={currentLang === 'lo'
            ? `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບລາຍການ "${item.name}" (PO: ${item.poNumber || item.id})? ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກໄດ້.`
            : `Are you sure you want to delete "${item.name}" (PO: ${item.poNumber || item.id})? This action cannot be undone.`}
          onConfirm={() => {
            setIsDeleteModalOpen(false);
            onDelete(item.id);
          }}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}
    </div>
  );
}
