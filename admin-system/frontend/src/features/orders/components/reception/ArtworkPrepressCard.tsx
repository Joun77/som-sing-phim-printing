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
  Eye
} from 'lucide-react';

interface ArtworkPrepressCardProps {
  orderIdDisplay: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  driveLink?: string;
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
  driveLink,
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

        {/* Revision Alert Banner: Display when customer requested revision */}
        {(orderStatus === 'PROOF_REJECTED' || (proofRejectionReason && !proofApprovedAt)) && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 mb-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-800 font-black text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{currentLang === 'lo' ? 'ລູກຄ້າຂໍແກ້ໄຂແບບພິມ (Revision Requested)' : 'Customer Requested Proof Revision'}</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold">
                {proofRejectedAt ? new Date(proofRejectedAt).toLocaleDateString() : 'Action Needed'}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-rose-200/80 text-xs font-semibold text-rose-900 shadow-xs">
              "{proofRejectionReason}"
            </div>
          </div>
        )}

        {/* Proof Approved Banner */}
        {(proofApprovedAt || orderStatus === 'FILE_CONFIRMED' || orderStatus === 'READY_TO_PRINT') && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-black text-emerald-900 mb-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{currentLang === 'lo' ? 'ລູກຄ້າຢືນຢັນແບບພິມແລ້ວ (Proof Approved)' : 'Customer Approved Digital Proof'}</span>
            </div>
            <span className="text-[10.5px] font-mono text-emerald-700 font-bold bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
              {proofApprovedAt ? new Date(proofApprovedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Confirmed'}
            </span>
          </div>
        )}

        {/* Digital Proof Preview File (Pre-press to Customer) */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-600" />
              {currentLang === 'lo' ? 'ໄຟລ໌ຕົວຢ່າງ Digital Proof (ສົ່ງໃຫ້ລູກຄ້າກວດ)' : 'Digital Proof Preview (Customer Review)'}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
              proofUrl ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {proofUrl ? (orderStatus === 'WAITING_APPROVAL' ? 'Waiting Sign-off' : 'Proof Ready') : 'No Proof Sent'}
            </span>
          </div>

          {proofUrl ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-indigo-200/80 shadow-xs">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-900 block truncate font-mono">
                  {proofUrl}
                </span>
                <span className="text-[10.5px] text-slate-500 block mt-0.5 font-medium">
                  {currentLang === 'lo' ? 'ລິ້ງ Digital Proof ສົ່ງຫາລູກຄ້າທາງ SMS / WhatsApp' : 'Customer Sign-off Digital Proof Link'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.open(proofUrl, '_blank')}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs border-none"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{currentLang === 'lo' ? 'ເບິ່ງ Proof' : 'View Proof'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAttachingProof(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  <span>{currentLang === 'lo' ? 'ປ່ຽນໄຟລ໌' : 'Change'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-3.5 rounded-xl border border-dashed border-indigo-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {currentLang === 'lo' ? 'ຍັງບໍ່ໄດ້ອັບໂຫຼດໄຟລ໌ Proof ໃຫ້ລູກຄ້າ' : 'No Proof Uploaded Yet'}
                </span>
                <span className="text-[10.5px] text-slate-400 block mt-0.5">
                  {currentLang === 'lo' ? 'ອັບໂຫຼດຮູບ ຫຼື PDF ຕົວຢ່າງເພື່ອສົ່ງໃຫ້ລູກຄ້າກວດສອບ' : 'Upload Proof Image or PDF for customer verification'}
                </span>
              </div>

              {isAttachingProof ? (
                <form onSubmit={handleSaveProofLink} className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="url"
                    required
                    value={newProofLink}
                    onChange={(e) => setNewProofLink(e.target.value)}
                    placeholder="https://..."
                    className="px-3 py-1.5 text-xs border rounded-lg bg-slate-50 font-mono w-full sm:w-48"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shrink-0"
                  >
                    {currentLang === 'lo' ? 'ສົ່ງ Proof' : 'Send'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAttachingProof(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 text-xs flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAttachingProof(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs border-none"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{currentLang === 'lo' ? 'ອັບໂຫຼດ & ສົ່ງ Proof' : 'Upload & Send Proof'}</span>
                </button>
              )}
            </div>
          )}

          {isAttachingProof && proofUrl && (
            <form onSubmit={handleSaveProofLink} className="flex items-center gap-2 bg-white p-3 rounded-xl border border-indigo-200">
              <input
                type="url"
                required
                value={newProofLink}
                onChange={(e) => setNewProofLink(e.target.value)}
                placeholder="https://..."
                className="px-3 py-1.5 text-xs border rounded-lg bg-slate-50 font-mono flex-1"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shrink-0"
              >
                {currentLang === 'lo' ? 'ບັນທຶກ' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setIsAttachingProof(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 text-xs flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
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
