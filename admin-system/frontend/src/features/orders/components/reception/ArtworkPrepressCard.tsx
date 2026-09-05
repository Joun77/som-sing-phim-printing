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
  X,
  AlertTriangle,
  CheckCircle2,
  Send,
  Eye,
  Tag,
  MapPin
} from 'lucide-react';
import { useApp } from '@store/AppContext';

interface ArtworkPrepressCardProps {
  orderIdDisplay: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  customerTier?: string;
  village?: string;
  district?: string;
  province?: string;
  driveLink?: string;
  artworkFileName?: string;
  artworkFileSize?: number;
  proofUrl?: string;
  proofApprovedAt?: string;
  proofRejectedAt?: string;
  proofRejectionReason?: string;
  orderStatus?: string;
  items?: any[];
  isArtworkApproved: boolean;
  currentLang: string;
  onApproveArtwork: () => void;
  onRevertArtwork: () => void;
  onOpenDriveLink: () => void;
  onAttachArtwork?: (link: string) => void;
  onUploadProof?: (proofUrl: string) => void;
  onConfigureWorkflow?: () => void;
  productionWorkflow?: any;
}

export const ArtworkPrepressCard: React.FC<ArtworkPrepressCardProps> = ({
  orderIdDisplay,
  customerName,
  customerPhone,
  deliveryAddress,
  customerTier,
  village,
  district,
  province,
  driveLink,
  artworkFileName,
  artworkFileSize,
  proofUrl,
  proofApprovedAt,
  proofRejectedAt,
  proofRejectionReason,
  orderStatus,
  items = [],
  isArtworkApproved,
  currentLang,
  onApproveArtwork,
  onRevertArtwork,
  onOpenDriveLink,
  onAttachArtwork,
  onUploadProof,
  onConfigureWorkflow,
  productionWorkflow,
}) => {
  const { customerCategories = [] } = useApp();
  const categoryObj = customerCategories.find((c: any) => c.id === customerTier);
  const categoryLabel = categoryObj ? categoryObj.name : customerTier;

  const [isAttaching, setIsAttaching] = useState(false);
  const [newLink, setNewLink] = useState('');
  const [isAttachingProof, setIsAttachingProof] = useState(false);
  const [newProofLink, setNewProofLink] = useState('');

  const handleSaveProofLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProofLink.trim() && onUploadProof) {
      onUploadProof(newProofLink.trim());
      setIsAttachingProof(false);
      setNewProofLink('');
    }
  };

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
      case 'HARDCOVER_CASE_BINDING': return currentLang === 'lo' ? 'ເຂົ້າເຫຼັ້ມປົກແຂງ' : 'Hardcover Case';
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
            <div className="flex items-center gap-1.5 mt-0.5">
              <strong className="text-slate-900 text-sm">{customerName}</strong>
              {categoryLabel && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5 text-blue-600" />
                  <span>{categoryLabel}</span>
                </span>
              )}
            </div>
          </div>
          <div>
            <span className="text-slate-400 block text-[10.5px] font-bold">{currentLang === 'lo' ? 'ເບີໂທຕິດຕໍ່:' : 'Phone:'}</span>
            <a href={`tel:${customerPhone}`} className="text-blue-600 font-mono font-bold block mt-0.5 hover:underline">
              {customerPhone}
            </a>
          </div>
          <div className="sm:col-span-2 border-t border-slate-200/80 pt-2 mt-1 space-y-1">
            <span className="text-slate-400 block text-[10.5px] font-bold">{currentLang === 'lo' ? 'ສະຖານທີ່ຈັດສົ່ງ:' : 'Delivery Address:'}</span>
            {(village || district || province) ? (
              <div className="flex flex-wrap gap-1.5 text-[11px] font-bold text-slate-700">
                {village && <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">ບ້ານ: {village}</span>}
                {district && <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">ເມືອງ: {district}</span>}
                {province && <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">ແຂວງ: {province.replace('ແຂວງ', '').replace('ນະຄອນຫຼວງ', '').trim()}</span>}
              </div>
            ) : null}
            {deliveryAddress && (
              <span className="text-slate-700 block font-medium mt-0.5">{deliveryAddress}</span>
            )}
          </div>
        </div>

        {/* Itemized Comprehensive Print Specifications & Artwork */}
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

                const itArtworkUrl = it.artwork?.file_url || it.artworkUrl || it.artwork_url || it.fileUrl || it.file_url || it.cover_file_url || it.inner_file_url || driveLink;
                const itArtworkFileName = it.artwork?.file_name || it.artworkFileName || it.artwork_file_name || it.fileName || it.file_name || (itArtworkUrl ? itArtworkUrl.split('/').pop()?.split('?')[0] : '');
                const itArtworkSize = it.artwork?.file_size_bytes || it.artworkFileSize || it.artwork_file_size || it.fileSize || 0;
                const itFormattedSize = itArtworkSize > 0 ? `${(itArtworkSize / (1024 * 1024)).toFixed(2)} MB` : '';

                return (
                  <div key={it.id || idx} className="pt-2 text-slate-800 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <strong className="block text-xs font-black text-slate-900 truncate">
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
                            <span className="px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-sky-700 text-[10px]">
                              ເຂົ້າເລ່ມ: {getBindingLabel(it.bindingMethod)}
                            </span>
                          )}
                          {it.coating && it.coating !== 'none' && (
                            <span className="px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-sky-700 text-[10px]">
                              ເຄືອບ: {getCoatingLabel(it.coating)}
                            </span>
                          )}
                        </div>

                        {/* Per-Job Artwork File Info & Quick Actions */}
                        {itArtworkUrl && (
                          <div className="mt-2 flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-100/80 border border-slate-200 text-[11px]">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-[9px] uppercase shrink-0">
                                {itArtworkFileName.toLowerCase().endsWith('.pdf') ? 'PDF' : 'ARTWORK'}
                              </span>
                              <span className="font-mono font-bold text-slate-700 truncate" title={itArtworkFileName}>
                                {itArtworkFileName || 'Job Artwork'}
                              </span>
                              {itFormattedSize && (
                                <span className="text-slate-400 text-[10px] shrink-0 font-medium">({itFormattedSize})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  try {
                                    const link = document.createElement('a');
                                    link.href = itArtworkUrl;
                                    link.download = itArtworkFileName || 'artwork.pdf';
                                    link.target = '_blank';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  } catch (err) {
                                    window.open(itArtworkUrl, '_blank');
                                  }
                                }}
                                className="px-2 py-1 rounded-lg bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-bold flex items-center gap-1 transition"
                                title="Download Job Artwork"
                              >
                                <Download className="w-3 h-3 text-slate-600" />
                                <span>ໂຫຼດ</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(itArtworkUrl, '_blank');
                                }}
                                className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center gap-1 transition"
                                title="Open Job Artwork"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>ເບິ່ງ</span>
                              </button>
                            </div>
                          </div>
                        )}
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
            <div className="flex-1 py-3 px-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-black flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Printer className="w-4 h-4 text-sky-600 shrink-0" />
                <div className="min-w-0">
                  <span className="block truncate">{currentLang === 'lo' ? 'ໄຟລ໌ພ້ອມພິມ & ກຳລັງດຳເນີນການຜະລິດ' : 'In Production Queue'}</span>
                  {productionWorkflow?.templateName && (
                    <span className="text-[10px] text-sky-600 block truncate font-medium">
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
                  className="py-3 px-3.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-black transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
                  title="Configure Production Process"
                >
                  <Layers className="w-3.5 h-3.5 text-sky-600" />
                  <span>{currentLang === 'lo' ? 'ຂະບວນການຜະລິດ' : 'Production Process'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onRevertArtwork}
                className="py-3 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-black transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
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
            className="w-full py-3.5 px-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-black shadow-md shadow-sky-500/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-none"
          >
            <Printer className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ຂະບວນການຜະລິດ (Production Process)' : 'Configure Production Process'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ArtworkPrepressCard;
