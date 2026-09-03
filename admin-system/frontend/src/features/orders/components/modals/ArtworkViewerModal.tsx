import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Eye, 
  Copy, 
  Check, 
  Layers, 
  FileCode, 
  Image as ImageIcon,
  FolderArchive,
  CloudDownload,
  AlertCircle,
  BookOpen,
  Ruler
} from 'lucide-react';
import { FormModalTemplate } from '../../../../components/common/FormModalTemplate';

export interface ArtworkViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  currentLang?: string;
  showToast?: (msg: string, type?: string) => void;
}

interface ArtworkJobItem {
  id: string | number;
  jobName: string;
  specsSummary?: string;
  sizeText?: string;
  paperText?: string;
  pagesText?: string;
  bindingText?: string;
  coatingText?: string;
  quantity?: number;
  fileUrl?: string;
  fileName?: string;
  isDriveLink: boolean;
  driveUrl?: string;
  fileType?: 'PDF' | 'IMAGE' | 'DRIVE' | 'UNKNOWN';
  coverUrl?: string;
  innerUrl?: string;
}

export const ArtworkViewerModal: React.FC<ArtworkViewerModalProps> = ({
  isOpen,
  onClose,
  order,
  currentLang = 'lo',
  showToast,
}) => {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const orderIdentifier = order.orderNo || order.order_no || order.orderNumber || order.id || 'ORDER';
  const customerName = order.customerName || order.customer_name || 'Customer';

  const getBindingLabel = (method?: string) => {
    switch (method) {
      case 'WIRE_O': return currentLang === 'lo' ? 'ສັນຫ່ວງຂົດລວດ' : 'Wire-O';
      case 'SADDLE_STITCH': return currentLang === 'lo' ? 'ຫຍິບມຸງກົກ' : 'Saddle Stitch';
      case 'PERFECT_HOT_GLUE': return currentLang === 'lo' ? 'ໄສກາວຮ້ອນ' : 'Perfect Glue';
      case 'CALENDAR': return currentLang === 'lo' ? 'ສັນປະຕິທິນ' : 'Calendar';
      case 'CORNER_STAPLE': return currentLang === 'lo' ? 'ແມັກມຸມ' : 'Corner Staple';
      default: return '';
    }
  };

  const getCoatingLabel = (coating?: string) => {
    switch (coating) {
      case 'GLOSS': return currentLang === 'lo' ? 'ເຄືອບເງົາ' : 'Gloss';
      case 'MATTE': return currentLang === 'lo' ? 'ເຄືອບດ້ານ' : 'Matte';
      case 'SPOT_UV': return 'Spot UV';
      default: return '';
    }
  };

  // Extract jobs/items from order with all potential file sources
  const extractedJobs: ArtworkJobItem[] = [];

  if (Array.isArray(order.items) && order.items.length > 0) {
    order.items.forEach((item: any, idx: number) => {
      const jName = item.name || item.item_name || item.job_name || item.product_name || `Job #${idx + 1}`;
      const fUrl = item.artwork?.file_url || item.artworkUrl || item.artwork_url || item.file_url || item.fileUrl || item.specs?.file_url || item.specs?.fileUrl || '';
      const fName = item.artwork?.file_name || item.artworkFileName || item.artwork_file_name || item.file_name || item.fileName || item.specs?.file_name || item.specs?.fileName || (fUrl ? fUrl.split('/').pop()?.split('?')[0] : '');
      const dLink = item.google_drive_link || item.drive_url || item.driveUrl || item.drive_link || (fUrl.includes('drive.google.com') ? fUrl : order.driveLink || order.googleDriveLink || order.artworkLink);
      const isDrive = Boolean(dLink) || fUrl.includes('drive.google.com') || fUrl.includes('docs.google.com') || fUrl.includes('canva.com');

      const sizeText = item.jobWidth && item.jobHeight ? `${item.jobWidth}×${item.jobHeight}mm (${item.paperSize || 'Custom'})` : (item.paperSize || 'A4');
      const paperText = item.paperSku || item.paperId || item.paperType || item.paper_name || 'Standard Paper';
      const totalPages = item.pagesPerBook || item.page_count || item.pages || 1;
      const colorPages = item.colorPages || (item.colorPrintMode === 'MONO_K' ? 0 : totalPages);
      const bwPages = item.bwPages || (item.colorPrintMode === 'MONO_K' ? totalPages : 0);

      extractedJobs.push({
        id: item.id || `job-${idx + 1}`,
        jobName: jName,
        sizeText,
        paperText,
        pagesText: `${totalPages} ໜ້າ (${colorPages} ສີ / ${bwPages} ຂາວດຳ)`,
        bindingText: getBindingLabel(item.bindingMethod || item.binding_type),
        coatingText: getCoatingLabel(item.coating || item.lamination),
        quantity: Number(item.quantity || 1),
        specsSummary: `${sizeText} • ${paperText} • x${item.quantity || 1}`,
        fileUrl: isDrive ? undefined : fUrl,
        fileName: fName || `${jName.replace(/[^a-zA-Z0-9_-]/g, '_')}_artwork.pdf`,
        isDriveLink: isDrive,
        driveUrl: dLink || (isDrive ? fUrl : undefined),
        fileType: isDrive ? 'DRIVE' : (fUrl.endsWith('.pdf') || fUrl.includes('application/pdf') ? 'PDF' : 'IMAGE'),
        coverUrl: item.cover_file_url || item.coverUrl,
        innerUrl: item.inner_file_url || item.innerUrl,
      });
    });
  }

  // Also include order-level files if no items or standalone order-level link exists
  if (extractedJobs.length === 0 || order.google_drive_link || order.artworkLink || order.driveLink) {
    const topDrive = order.google_drive_link || order.driveLink || (order.artworkLink?.includes('drive.google.com') || order.artworkLink?.includes('canva.com') ? order.artworkLink : '');
    const topFile = order.artworkLink && !order.artworkLink.includes('drive.google.com') && !order.artworkLink.includes('canva.com') ? order.artworkLink : '';

    if (topDrive || topFile) {
      const exists = extractedJobs.some(j => j.driveUrl === topDrive || j.fileUrl === topFile);
      if (!exists) {
        extractedJobs.unshift({
          id: 'order-master',
          jobName: order.jobName || order.title || `Master Artwork (#${orderIdentifier})`,
          specsSummary: `Order Master Source File`,
          fileUrl: topFile || undefined,
          fileName: order.artworkFileName || `artwork_SSP_${orderIdentifier}_master.pdf`,
          isDriveLink: Boolean(topDrive),
          driveUrl: topDrive || undefined,
          fileType: topDrive ? 'DRIVE' : (topFile.endsWith('.pdf') ? 'PDF' : 'IMAGE'),
        });
      }
    }
  }

  // Fallback if empty
  if (extractedJobs.length === 0) {
    extractedJobs.push({
      id: 'fallback-1',
      jobName: order.product_name || `Artwork #${orderIdentifier}`,
      specsSummary: 'Print Job File',
      isDriveLink: false,
      fileUrl: '',
      fileName: 'No artwork attached',
      fileType: 'UNKNOWN',
    });
  }

  const handleCopy = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    if (showToast) {
      showToast(currentLang === 'lo' ? 'ຄັດລອກລິ້ງສຳເລັດ!' : 'Copied link to clipboard!', 'success');
    }
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleDownloadAll = () => {
    let count = 0;
    extractedJobs.forEach((job) => {
      if (job.fileUrl) {
        count++;
        const a = document.createElement('a');
        a.href = job.fileUrl;
        a.download = job.fileName || `artwork_${job.id}.pdf`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (job.driveUrl) {
        count++;
        window.open(job.driveUrl, '_blank');
      }
    });

    if (count === 0 && showToast) {
      showToast(currentLang === 'lo' ? 'ບໍ່ມີຟາຍທີ່ພ້ອມດາວໂຫຼດ' : 'No downloadable files available', 'warning');
    } else if (showToast) {
      showToast(currentLang === 'lo' ? `ກຳລັງດາວໂຫຼດ / ເປີດ ${count} ຟາຍ...` : `Opening/Downloading ${count} files...`, 'success');
    }
  };

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<Layers className="w-6 h-6" />}
      title={currentLang === 'lo' ? 'ເບິ່ງຟາຍອາດເວິກ & ສະເປກແຍກຕາມຈັອບ' : 'View & Download Artwork per Job'}
      subtitle={`Order #${orderIdentifier} • ${customerName}`}
      badgeText={`${extractedJobs.length} Jobs`}
      maxWidthClass="max-w-4xl"
      footerActions={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500 font-medium">
            {currentLang === 'lo' ? `ພົບທັງໝົດ ${extractedJobs.length} ລາຍການ Job` : `Total ${extractedJobs.length} artwork jobs`}
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer"
            >
              {currentLang === 'lo' ? 'ປິດ' : 'Close'}
            </button>
            <button
              type="button"
              onClick={handleDownloadAll}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer border-none"
            >
              <CloudDownload className="w-4 h-4" />
              <span>{currentLang === 'lo' ? 'ດາວໂຫຼດທຸກຟາຍ (Download All)' : 'Download All Files'}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {extractedJobs.map((job, idx) => (
          <div 
            key={job.id || idx}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition space-y-3"
          >
            {/* Job Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-black text-xs">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>{job.jobName}</span>
                    {job.isDriveLink ? (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 font-sans">
                        <FolderArchive className="w-3 h-3" />
                        Google Drive / Cloud
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 font-sans">
                        <FileText className="w-3 h-3" />
                        Direct File ({job.fileType})
                      </span>
                    )}
                  </h4>

                  {/* Spec Badges Row */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.sizeText && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        ຂະໜາດ: {job.sizeText}
                      </span>
                    )}
                    {job.paperText && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        ເຈ້ຍ: {job.paperText}
                      </span>
                    )}
                    {job.pagesText && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        ໜ້າ: {job.pagesText}
                      </span>
                    )}
                    {job.bindingText && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                        ເຂົ້າເລ່ມ: {job.bindingText}
                      </span>
                    )}
                    {job.coatingText && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                        ເຄືອບ: {job.coatingText}
                      </span>
                    )}
                    {job.quantity && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono font-black">
                        x{job.quantity}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* File Details & Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1">
              
              {/* Left Details */}
              <div className="sm:col-span-7 space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-700 truncate">
                  {job.isDriveLink && job.driveUrl ? (
                    <span className="truncate text-blue-600 font-bold underline cursor-pointer" onClick={() => window.open(job.driveUrl, '_blank')}>
                      {job.driveUrl}
                    </span>
                  ) : job.fileUrl ? (
                    <span className="truncate text-slate-800 font-bold">
                      {job.fileName || job.fileUrl}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      ຍັງບໍ່ມີຟາຍອັບໂຫລດ (No file uploaded)
                    </span>
                  )}
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="sm:col-span-5 flex items-center justify-end gap-2 flex-wrap">
                {job.isDriveLink && job.driveUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCopy(job.driveUrl!)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      title="Copy Drive Link"
                    >
                      {copiedLink === job.driveUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink === job.driveUrl ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href={job.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>ເປີດ Google Drive</span>
                    </a>
                  </>
                ) : job.fileUrl ? (
                  <>
                    <a
                      href={job.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>ເບິ່ງຕົວຢ່າງ (Preview)</span>
                    </a>
                    <a
                      href={job.fileUrl}
                      download={job.fileName || `artwork_job_${idx + 1}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ດາວໂຫຼດ (Download)</span>
                    </a>
                  </>
                ) : null}
              </div>

            </div>

          </div>
        ))}
      </div>
    </FormModalTemplate>
  );
};

export default ArtworkViewerModal;
