import React from 'react';
import { User, FileText, Printer, ExternalLink } from 'lucide-react';

interface ArtworkPrepressCardProps {
  orderIdDisplay: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  driveLink?: string;
  items?: any[];
  isArtworkApproved: boolean;
  currentLang: string;
  onApproveArtwork: () => void;
  onRevertArtwork: () => void;
  onOpenDriveLink: () => void;
}

export const ArtworkPrepressCard: React.FC<ArtworkPrepressCardProps> = ({
  orderIdDisplay,
  customerName,
  customerPhone,
  deliveryAddress,
  driveLink,
  items,
  isArtworkApproved,
  currentLang,
  onApproveArtwork,
  onRevertArtwork,
  onOpenDriveLink,
}) => {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-5">
      <div>
        {/* Card Title */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider block">Step 2</span>
              <h3 className="text-sm font-black text-slate-900">
                {currentLang === 'lo' ? '2. ຂໍ້ມູນລູກຄ້າ & ໄຟລ໌ງານພິມ (Customer & Artwork)' : '2. Customer Profile & Artwork File'}
              </h3>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border ${
            isArtworkApproved
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {isArtworkApproved ? (currentLang === 'lo' ? '✓ ໄຟລ໌ພ້ອມພິມ' : 'Approved') : (currentLang === 'lo' ? '⏳ ລໍຖ້າກວດໄຟລ໌' : 'Pre-Press Check')}
          </span>
        </div>

        {/* Customer Contact Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
          <div>
            <span className="text-slate-400 block text-[10.5px] font-bold">{currentLang === 'lo' ? 'ຊື່ລູກຄ້າ:' : 'Customer Name:'}</span>
            <strong className="text-slate-900 block text-sm mt-0.5">{customerName}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10.5px] font-bold">{currentLang === 'lo' ? 'ເບີໂທຕິດຕໍ່:' : 'Phone:'}</span>
            <a href={`tel:${customerPhone}`} className="text-blue-600 font-mono font-bold block mt-0.5 hover:underline">
              {customerPhone}
            </a>
          </div>
          <div className="sm:col-span-2 border-t border-slate-200 pt-2 mt-1">
            <span className="text-slate-400 block text-[10.5px] font-bold">{currentLang === 'lo' ? 'ສະຖານທີ່ຈັດສົ່ງ:' : 'Delivery Address:'}</span>
            <span className="text-slate-700 block font-medium mt-0.5">{deliveryAddress}</span>
          </div>
        </div>

        {/* Attached Customer Artwork File (Google Drive / Canva / Cloud File) */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/60 to-purple-50/60 border border-blue-200/80 space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              {currentLang === 'lo' ? 'ໄຟລ໌ງານພິມທີ່ລູກຄ້າແນບມາ (Customer Artwork File)' : 'Customer Artwork File'}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-mono font-bold">
              Cloud Vector
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-900 block truncate font-mono">
                {driveLink || `artwork_SSP_${orderIdDisplay}_master.pdf`}
              </span>
              <span className="text-[10.5px] text-slate-500 block mt-0.5 font-medium">
                Google Drive / Canva Print Ready Vector • CMYK 300 DPI
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenDriveLink}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm border-none"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{currentLang === 'lo' ? 'ເປີດໄຟລ໌ງານ' : 'Open Artwork'}</span>
            </button>
          </div>
        </div>

        {/* Itemized Print Specifications */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
          <span className="text-slate-500 block text-[10.5px] font-black uppercase tracking-wider">
            {currentLang === 'lo' ? 'ລາຍການສັ່ງພິມ (Print Items Specs):' : 'Print Items Specs:'}
          </span>
          {Array.isArray(items) && items.length > 0 ? (
            <div className="space-y-1.5 divide-y divide-slate-200/60">
              {items.map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center pt-1 text-slate-800">
                  <div>
                    <strong className="block text-xs text-slate-900">{it.name || it.item_name || 'Custom Print Job'}</strong>
                    <span className="text-[10.5px] text-slate-500 block">{it.paperSize || 'A4'} • {it.paperType || 'Art 80g'} • {it.finishing || 'Standard'}</span>
                  </div>
                  <span className="font-mono font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    x{it.quantity || 1}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-between text-slate-800">
              <span>Custom Print Product</span>
              <span className="font-mono font-bold text-amber-600">x1</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Button for Artwork & Press Order (Step 2 Toggle State) */}
      <div className="pt-2">
        {isArtworkApproved ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 py-3 px-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-black flex items-center justify-center gap-2 shadow-xs">
              <Printer className="w-4 h-4 text-purple-600" />
              <span>{currentLang === 'lo' ? '✓ ໄຟລ໌ພ້ອມພິມ & ກຳລັງດຳເນີນການຜະລິດ' : 'In Production Queue'}</span>
            </div>
            <button
              type="button"
              onClick={onRevertArtwork}
              className="py-3 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-amber-700 border border-slate-200 text-xs font-black transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Revert / Edit artwork"
            >
              <span>↺ ແກ້ໄຂ</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onApproveArtwork}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black shadow-md shadow-amber-500/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-none"
          >
            <Printer className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ຢືນຢັນໄຟລ໌ & ສັ່ງຜະລິດ (Send to Press Queue)' : 'Approve Artwork & Release to Press'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ArtworkPrepressCard;
