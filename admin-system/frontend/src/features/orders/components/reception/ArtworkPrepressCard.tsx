import React, { useState } from 'react';
import { 
  User, 
  FileText, 
  Printer, 
  ExternalLink, 
  Download, 
  Plus, 
  Layers, 
  BookOpen, 
  Ruler, 
  Sparkles,
  Link as LinkIcon,
  Check,
  X
} from 'lucide-react';

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
  onAttachArtwork?: (link: string) => void;
  onConfigureWorkflow?: () => void;
  productionWorkflow?: any;
}

export const ArtworkPrepressCard: React.FC<ArtworkPrepressCardProps> = ({
  orderIdDisplay,
  customerName,
  customerPhone,
  deliveryAddress,
  driveLink,
  items = [],
  isArtworkApproved,
  currentLang,
  onApproveArtwork,
  onRevertArtwork,
  onOpenDriveLink,
  onAttachArtwork,
  onConfigureWorkflow,
  productionWorkflow,
}) => {
  const [isAttaching, setIsAttaching] = useState(false);
  const [newLink, setNewLink] = useState('');

  const handleSaveNewLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLink.trim() && onAttachArtwork) {
      onAttachArtwork(newLink.trim());
      setIsAttaching(false);
      setNewLink('');
    }
  };

  const getBindingLabel = (method?: string) => {
    switch (method) {
      case 'WIRE_O': return currentLang === 'lo' ? 'ສັນຫ່ວງຂົດລວດ' : 'Wire-O';
      case 'SADDLE_STITCH': return currentLang === 'lo' ? 'ຫຍິບມຸງກົກ' : 'Saddle Stitch';
      case 'PERFECT_HOT_GLUE': return currentLang === 'lo' ? 'ໄສກາວຮ້ອນ' : 'Perfect Glue';
      case 'CALENDAR': return currentLang === 'lo' ? 'ສັນປະຕິທິນ' : 'Calendar';
      case 'CORNER_STAPLE': return currentLang === 'lo' ? 'ແມັກມຸມ' : 'Corner Staple';
      default: return currentLang === 'lo' ? 'ບໍ່ມີການເຂົ້າເລ່ມ' : 'None';
    }
  };

  const getCoatingLabel = (coating?: string) => {
    switch (coating) {
      case 'GLOSS': return currentLang === 'lo' ? 'ເຄືອບເງົາ' : 'Gloss';
      case 'MATTE': return currentLang === 'lo' ? 'ເຄືອບດ້ານ' : 'Matte';
      case 'SPOT_UV': return currentLang === 'lo' ? 'Spot UV' : 'Spot UV';
      default: return currentLang === 'lo' ? 'ບໍ່ເຄືອບ' : 'None';
    }
  };

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
                {currentLang === 'lo' ? '2. ຂໍ້ມູນລູກຄ້າ & ໄຟລ໌ງານພິມ' : '2. Customer Profile & Artwork File'}
              </h3>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border ${
            isArtworkApproved
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {isArtworkApproved ? (currentLang === 'lo' ? 'ໄຟລ໌ພ້ອມພິມ' : 'Approved') : (currentLang === 'lo' ? 'ລໍຖ້າກວດໄຟລ໌' : 'Pre-Press Check')}
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
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 to-purple-50/70 border border-blue-200/80 space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              {currentLang === 'lo' ? 'ໄຟລ໌ງານພິມທີ່ລູກຄ້າແນບມາ (Customer Artwork Files)' : 'Customer Artwork Files'}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-mono font-bold">
              {driveLink ? 'Cloud Vector' : 'Ready'}
            </span>
          </div>

          {driveLink ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-900 block truncate font-mono">
                  {driveLink}
                </span>
                <span className="text-[10.5px] text-slate-500 block mt-0.5 font-medium">
                  Google Drive / Canva Print Ready Vector • CMYK 300 DPI
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onOpenDriveLink}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm border-none"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{currentLang === 'lo' ? 'ເປີດໄຟລ໌ງານ' : 'Open Artwork'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-3.5 rounded-xl border border-dashed border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-700 block">
                  {currentLang === 'lo' ? 'ຍັງບໍ່ມີລິ້ງໄຟລ໌ອາດເວິກ' : 'No Artwork Link Attached Yet'}
                </span>
                <span className="text-[10.5px] text-slate-400 block mt-0.5">
                  {currentLang === 'lo' ? 'ກະລຸນາແນບລິ້ງ Google Drive ຫຼື Canva' : 'Please attach Google Drive or Canva Link'}
                </span>
              </div>

              {isAttaching ? (
                <form onSubmit={handleSaveNewLink} className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="url"
                    required
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="px-3 py-1.5 text-xs border rounded-lg bg-slate-50 font-mono w-full sm:w-48"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shrink-0"
                  >
                    {currentLang === 'lo' ? 'ບັນທຶກ' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAttaching(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 text-xs flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAttaching(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>{currentLang === 'lo' ? 'ແນບໄຟລ໌ງານພິມ' : 'Attach Artwork Link'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Itemized Comprehensive Print Specifications */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 block text-[10.5px] font-black uppercase tracking-wider">
              {currentLang === 'lo' ? `ລາຍການສັ່ງພິມທັງໝົດ (${items.length} Jobs):` : `Print Jobs Specifications (${items.length} Jobs):`}
            </span>
          </div>

          {Array.isArray(items) && items.length > 0 ? (
            <div className="space-y-2.5 divide-y divide-slate-200/60">
              {items.map((it: any, idx: number) => {
                const sizeText = it.jobWidth && it.jobHeight ? `${it.jobWidth}×${it.jobHeight}mm (${it.paperSize || 'Custom'})` : (it.paperSize || 'A4');
                const paperText = it.paperSku || it.paperId || it.paperType || it.paper_name || 'Art Card 260g';
                const totalPages = it.pagesPerBook || it.page_count || it.pages || 1;
                const colorPages = it.colorPages || (it.colorPrintMode === 'MONO_K' ? 0 : totalPages);
                const bwPages = it.bwPages || (it.colorPrintMode === 'MONO_K' ? totalPages : 0);

                return (
                  <div key={it.id || idx} className="pt-2 text-slate-800 space-y-1.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="block text-xs font-black text-slate-900">
                          {idx + 1}. {it.name || it.item_name || it.job_name || `Job #${idx + 1}`}
                        </strong>
                        <div className="flex flex-wrap gap-1.5 text-slate-500 font-bold mt-1">
                          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px]">
                            ຂະໜາດ: {sizeText}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px]">
                            ເຈ້ຍ: {paperText}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px]">
                            ໜ້າ: {totalPages} ໜ້າ ({colorPages} ສີ / {bwPages} ຂາວດຳ)
                          </span>
                          {it.bindingMethod && it.bindingMethod !== 'none' && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px]">
                              ເຂົ້າເລ່ມ: {getBindingLabel(it.bindingMethod)}
                            </span>
                          )}
                          {it.coating && it.coating !== 'none' && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 text-[10px]">
                              ເຄືອບ: {getCoatingLabel(it.coating)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-mono font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0 ml-2">
                        x{it.quantity || 1}
                      </span>
                    </div>
                  </div>
                );
              })}
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 py-3 px-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-black flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Printer className="w-4 h-4 text-purple-600 shrink-0" />
                <div className="min-w-0">
                  <span className="block truncate">{currentLang === 'lo' ? 'ໄຟລ໌ພ້ອມພິມ & ກຳລັງດຳເນີນການຜະລິດ' : 'In Production Queue'}</span>
                  {productionWorkflow?.templateName && (
                    <span className="text-[10px] text-purple-600 block truncate font-medium">
                      Template: {productionWorkflow.templateNameLao || productionWorkflow.templateName} ({productionWorkflow.steps?.length || 0} steps)
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {onConfigureWorkflow && (
                <button
                  type="button"
                  onClick={onConfigureWorkflow}
                  className="py-3 px-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-black transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
                  title="Configure Workflow"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>{currentLang === 'lo' ? 'ສາຍງານ' : 'Workflow'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onRevertArtwork}
                className="py-3 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-amber-700 border border-slate-200 text-xs font-black transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
                title="Revert / Edit artwork"
              >
                <span>{currentLang === 'lo' ? 'ແກ້ໄຂ' : 'Revert'}</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onConfigureWorkflow || onApproveArtwork}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black shadow-md shadow-amber-500/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-none"
          >
            <Printer className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ເລີ່ມຕົ້ນການຜະລິດ & ກຳນົດສາຍງານ (Workflow Setup)' : 'Configure Workflow & Start Production'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ArtworkPrepressCard;
