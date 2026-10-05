import ArtworkThumbnail from '@components/common/ArtworkThumbnail';
import { getMediaViewerCopy } from '@components/common/mediaViewerCopy';
import ArtworkPartsPanel from '../ArtworkPartsPanel';
import { getArtworkFiles, formatArtworkSize, getArtworkParts, getArtworkPartCosts } from '../../utils/artworkParts';
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { 
  User, 
  FileText, 
  Printer, 
  ExternalLink, 
  Download,
  LoaderCircle,
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
  MapPin,
  Images,
  Image as ImageIcon,
  ZoomIn,
  Loader2
} from 'lucide-react';
import { useApp } from '@store/AppContext';
import { FormModalTemplate } from '@components/common/FormModalTemplate';
import { downloadPhotosAsZip } from '@utils/zipDownloader';
import { downloadAuthenticatedFile } from '../../../../api/client';

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
  proofStatus?: string;
  proofVersion?: number;
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
  onUploadProofFile?: (file: File) => Promise<void>;
  onConfigureWorkflow?: () => void;
  productionWorkflow?: any;
  setLightbox?: (lb: any) => void;
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
  proofUrl, proofStatus, proofVersion,
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
  onUploadProof, onUploadProofFile,
  onConfigureWorkflow,
  productionWorkflow,
  setLightbox,
}) => {
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const markUnavailable = useCallback((url: string) => setUnavailable(previous => previous.includes(url) ? previous : [...previous, url]), []);
  const { customerCategories = [], showToast } = useApp();
  const categoryObj = customerCategories.find((c: any) => c.id === customerTier);
  const categoryLabel = categoryObj ? categoryObj.name : customerTier;

  const [isAttaching, setIsAttaching] = useState(false);
  const [newLink, setNewLink] = useState('');
  const [isAttachingProof, setIsAttachingProof] = useState(false);
  const proofGeneration = useRef(0);
  const proofWriting = useRef(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPending, setProofPending] = useState(false);
  const [proofError, setProofError] = useState('');
  useEffect(() => { proofGeneration.current++; proofWriting.current = false; setProofFile(null); setProofError(''); setProofPending(false); return () => { proofGeneration.current++; }; }, [orderIdDisplay]);
  const saveProofFile = async (file: File) => {
    if (proofWriting.current || !onUploadProofFile) return;
    const generation = proofGeneration.current; proofWriting.current = true;
    setProofPending(true); setProofError('');
    try { await onUploadProofFile(file); if (generation === proofGeneration.current) setProofFile(null); }
    catch (failure) { if (generation === proofGeneration.current) setProofError(failure instanceof Error ? failure.message : 'ບັນທຶກ Proof ບໍ່ສຳເລັດ'); }
    finally { if (generation === proofGeneration.current) { proofWriting.current = false; setProofPending(false); } }
  };
  const [newProofLink, setNewProofLink] = useState('');

  const [galleryModalItem, setGalleryModalItem] = useState<{ name: string; photos: { name: string; url: string }[] } | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [isDownloadingArtwork, setIsDownloadingArtwork] = useState<string | null>(null);

  const handleDownloadBatchZip = async (itemPhotos: { name: string; url: string }[], itemName: string) => {
    setIsZipping(true);
    try {
      const res = await downloadPhotosAsZip(
        itemPhotos,
        `${orderIdDisplay}_${itemName.replace(/\s+/g, '_')}_${itemPhotos.length}_images.zip`
      );
      if (res.failedCount > 0) {
        showToast(
          currentLang === 'lo'
            ? `ດາວໂຫຼດ ZIP ສຳເລັດແຕ່ຂາດ ${res.failedCount} ໄຟລ໌: ${res.failedFiles.join(', ')}`
            : `ZIP downloaded with ${res.failedCount} failed items: ${res.failedFiles.join(', ')}`,
          'warning'
        );
      } else {
        showToast(currentLang === 'lo' ? 'ດາວໂຫຼດ ZIP ຮຽບຮ້ອຍແລ້ວ' : 'ZIP downloaded successfully', 'success');
      }
    } catch (err: any) {
      console.error('ZIP download error:', err);
      showToast('ດາວໂຫຼດ ZIP ບໍ່ສຳເລັດ ກະລຸນາລອງອີກຄັ້ງ', 'error');
    } finally {
      setIsZipping(false);
    }
  };

  const handleSaveProofLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProofLink.trim() && onUploadProof) {
      try {
        await onUploadProof(newProofLink.trim());
        setIsAttachingProof(false);
        setNewProofLink('');
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'ບໍ່ສາມາດບັນທຶກ Proof ໄດ້');
      }
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

          {proofUrl && <section aria-label="Digital Proof" className="p-3 rounded-xl border border-blue-200 bg-blue-50 space-y-2">
            <p>Digital Proof • {({ PENDING_CUSTOMER: 'ລໍຖ້າລູກຄ້າຢືນຢັນ', APPROVED: 'ຢືນຢັນແລ້ວ', REJECTED: 'ປະຕິເສດ' } as Record<string, string>)[proofStatus || ''] || proofStatus || 'ບັນທຶກແລ້ວ'} • ເວີຊັນ {proofVersion ?? '—'}</p>
            <button type="button" disabled={!setLightbox} onClick={() => setLightbox?.({ src: proofUrl, title: 'Digital Proof', fileName: proofUrl.split('/').pop(), documentNumber: `#${orderIdDisplay}` })}>ເບິ່ງ Proof ທີ່ບັນທຶກແລ້ວ</button>
          </section>}
          {Array.isArray(items) && items.length > 0 ? (
            <div className="space-y-2.5 divide-y divide-slate-200/60">
              {items.map((it: any, idx: number) => {
                const sizeText = it.jobWidth && it.jobHeight ? `${it.jobWidth}×${it.jobHeight}mm (${it.paperSize || 'Custom'})` : (it.paperSize || 'A4');
                const paperText = it.paperSku || it.paperId || it.paperType || it.paper_name || 'Art Card 260g';
                const totalPages = it.pagesPerBook || it.page_count || it.pages || 1;
                const colorPages = it.colorPages || (it.colorPrintMode === 'MONO_K' ? 0 : totalPages);
                const bwPages = it.bwPages || (it.colorPrintMode === 'MONO_K' ? totalPages : 0);

                const itArtworkUrl = it.artwork?.file_url || it.artworkUrl || it.artwork_url || it.fileUrl || it.file_url || it.cover_file_url || it.inner_file_url || '';
                const itArtworkFileName = it.artwork?.file_name || it.artworkFileName || it.artwork_file_name || it.fileName || it.file_name || (itArtworkUrl ? itArtworkUrl.split('/').pop()?.split('?')[0] : '');
                const itArtworkSize = it.artwork?.file_size_bytes || it.artworkFileSize || it.artwork_file_size || it.fileSize || 0;
                const itFormattedSize = formatArtworkSize(itArtworkSize);

                // Extract all batch photos / artwork files
                const rawBatch: any[] = it.batch_files || it.batchFiles || it.specs?.batch_files || it.specifications?.batch_files || it.gallery_urls || it.galleryUrls || it.fileUrls || it.artworkUrls || [];
                const originalFiles = getArtworkFiles(rawBatch);
                const batchFiles = originalFiles.length ? originalFiles.map(file => file.url) : (itArtworkUrl ? [itArtworkUrl] : []);

                const hasBatch = batchFiles.length > 1;

                if (getArtworkParts(it).length) return <div key={it.id || idx} className="pt-2 space-y-2">
                  <strong>{idx + 1}. {it.name || it.item_name || it.job_name}</strong>
                  <ArtworkPartsPanel costs={getArtworkPartCosts(it)} parts={getArtworkParts(it)} />
                </div>;
                return (
                  <div key={it.id || idx} className="pt-2 text-slate-800 space-y-2">
                    {getArtworkParts(it).length > 0 && <ArtworkPartsPanel costs={getArtworkPartCosts(it)} parts={getArtworkParts(it)} />}
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

                              {!itArtworkUrl && !batchFiles.length && <p role="status">ລາຍການນີ້ຍັງບໍ່ມີໄຟລ໌ຕົ້ນສະບັບ</p>}
                        {/* Per-Job Artwork File Info & Quick Actions */}
                        {batchFiles.length > 0 && (
                          <div className="mt-2 p-2.5 rounded-xl bg-slate-100/90 border border-slate-200 space-y-2 text-[11px]">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {hasBatch ? (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-black text-[9px] uppercase shrink-0 flex items-center gap-1">
                                    <Images className="w-2.5 h-2.5" />
                                    {batchFiles.length} ຮູບ
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-[9px] uppercase shrink-0">
                                    {itArtworkFileName.toLowerCase().endsWith('.pdf') ? 'PDF' : 'ໄຟລ໌ງານພິມ'}
                                  </span>
                                )}
                                <span className="font-mono font-bold text-slate-700 break-all" title={itArtworkFileName}>
                                  {hasBatch ? `ຊຸດໄຟລ໌ຮູບພາບ (${batchFiles.length} ຮູບ)` : (itArtworkFileName || 'Job Artwork')}
                                </span>
                                {itFormattedSize && (
                                  <span className="text-slate-400 text-[10px] shrink-0 font-medium">({itFormattedSize})</span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (hasBatch) {
                                      const itemPhotos = batchFiles.map((url, i) => ({
                                        name: originalFiles[i]?.name || `${it.name || 'Photo'}_${String(i + 1).padStart(2, '0')}.jpg`,
                                        url
                                      }));
                                      handleDownloadBatchZip(itemPhotos, it.name || 'photos');
                                    } else if (itArtworkUrl) {
                                      try {
                                        setIsDownloadingArtwork(it.id || itArtworkFileName || 'artwork');
                                        await downloadAuthenticatedFile(itArtworkUrl, itArtworkFileName || 'artwork.pdf', undefined, itArtworkFileName || undefined);
                                        showToast(currentLang === 'lo' ? 'ດາວໂຫຼດໄຟລ໌ສຳເລັດ' : 'Artwork downloaded', 'success');
                                      } catch (err: any) {
                                        console.error('Download artwork error:', err);
                                        showToast('ດາວໂຫຼດຕົ້ນສະບັບບໍ່ສຳເລັດ ກະລຸນາລອງອີກຄັ້ງ', 'error');
                                      } finally {
                                        setIsDownloadingArtwork(null);
                                      }
                                    }
                                  }}
                                  className="px-2 py-1 rounded-lg bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500"
                                  disabled={(!itArtworkUrl && !batchFiles.length) || isZipping || isDownloadingArtwork !== null}
                                  aria-busy={isZipping || isDownloadingArtwork === (it.id || itArtworkFileName || 'artwork')}
                                  title={hasBatch ? 'ດາວໂຫຼດ ZIP' : 'ດາວໂຫຼດຕົ້ນສະບັບ'}
                                >
                                  {isZipping || isDownloadingArtwork === (it.id || itArtworkFileName || 'artwork') ? (
                                    <LoaderCircle aria-hidden="true" className="w-3 h-3 text-slate-600 animate-spin" />
                                  ) : (
                                    <Download className="w-3 h-3 text-slate-600" />
                                  )}
                                  <span>{isZipping || isDownloadingArtwork === (it.id || itArtworkFileName || 'artwork') ? 'ກຳລັງດາວໂຫຼດ…' : hasBatch ? 'ດາວໂຫຼດ ZIP' : 'ດາວໂຫຼດຕົ້ນສະບັບ'}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={!itArtworkUrl && !batchFiles.length}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (hasBatch && setLightbox) {
                                      const itemPhotos = batchFiles.map((url, i) => ({
                                        name: originalFiles[i]?.name || `${it.name || 'Photo'}_${String(i + 1).padStart(2, '0')}.jpg`,
                                        url,
                                        originalUrl: url,
                                        contentType: 'image/jpeg',
                                      }));
                                      setLightbox({
                                        src: batchFiles[0],
                                        title: `${it.name || 'Photo Prints'} (1/${batchFiles.length}) - #${orderIdDisplay}`,
                                        documentNumber: `#${orderIdDisplay}`,
                                        photos: itemPhotos,
                                        initialPhotoIndex: 0,
                                        onDownloadOriginal: async (item) => {
                                          await downloadAuthenticatedFile(item?.originalUrl || item?.url || batchFiles[0], item?.name || 'photo.jpg', undefined, item?.name);
                                        }
                                      });
                                    } else if (hasBatch) {
                                      const itemPhotos = batchFiles.map((url, i) => ({
                                        name: originalFiles[i]?.name || `${it.name || 'Photo'}_${String(i + 1).padStart(2, '0')}.jpg`,
                                        url
                                      }));
                                      setGalleryModalItem({ name: it.name || 'Photo Prints', photos: itemPhotos });
                                    } else if (setLightbox && (batchFiles[0] || itArtworkUrl)) {
                                      const targetUrl = itArtworkUrl || batchFiles[0];
                                      setLightbox({
                                        src: targetUrl,
                                        title: `${it.name || 'Artwork'} - #${orderIdDisplay}`,
                                        documentNumber: `#${orderIdDisplay}`,
                                        fileName: itArtworkFileName,
                                        onDownloadOriginal: async (item) => {
                                          await downloadAuthenticatedFile(item?.originalUrl || item?.url || targetUrl, item?.name || itArtworkFileName, undefined, item?.name || itArtworkFileName);
                                        }
                                      });
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                                  title="ເບິ່ງຕົວຢ່າງ"
                                >
                                  <Eye aria-hidden="true" className="w-3 h-3" />
                                  <span>ເບິ່ງຕົວຢ່າງ</span>
                                </button>
                              </div>
                            </div>

                            {batchFiles.some(url => url.startsWith('blob:') && unavailable.includes(url)) && <p role="alert" className="text-rose-700">{getMediaViewerCopy(currentLang).temporaryError}</p>}
                            {/* Batch Photos Thumbnail Strip (up to 6 thumbnails) */}
                            {hasBatch && (
                              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1">
                                {batchFiles.slice(0, 6).map((imgUrl: string, bIdx: number) => (
                                  <button type="button"
                                    key={bIdx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (setLightbox) {
                                        const itemPhotos = batchFiles.map((url, i) => ({
                                          name: originalFiles[i]?.name || `${it.name || 'Photo'}_${String(i + 1).padStart(2, '0')}.jpg`,
                                          url,
                                          originalUrl: url,
                                          contentType: 'image/jpeg',
                                        }));
                                        setLightbox({
                                          src: imgUrl,
                                          title: `${it.name || 'Photo'} (${bIdx + 1}/${batchFiles.length}) - #${orderIdDisplay}`,
                                          documentNumber: `#${orderIdDisplay}`,
                                          photos: itemPhotos,
                                          initialPhotoIndex: bIdx,
                                          fileName: `${it.name || 'photo'}_${String(bIdx + 1).padStart(2, '0')}.jpg`,
                                          onDownloadOriginal: async (item) => {
                                            await downloadAuthenticatedFile(item?.originalUrl || item?.url || imgUrl, item?.name || 'photo.jpg', undefined, item?.name);
                                          }
                                        });
                                      } else {
                                        window.open(imgUrl, '_blank');
                                      }
                                    }}
                                    className="w-11 h-11 rounded-lg border border-slate-200 bg-white overflow-hidden shrink-0 cursor-pointer hover:border-sky-500 hover:scale-105 transition-all relative group shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                                    title={`ເບິ່ງຕົວຢ່າງຮູບ ${bIdx + 1}`} aria-label={`ເບິ່ງຕົວຢ່າງຮູບ ${bIdx + 1}`}
                                  >
                                    <ArtworkThumbnail url={imgUrl} name={originalFiles[bIdx]?.name || 'photo.jpg'} alt={`ຮູບ ${bIdx + 1}`} onUnavailable={markUnavailable} />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[9px] font-bold text-white">
                                      #{bIdx + 1}
                                    </div>
                                  </button>
                                ))}
                                {batchFiles.length > 6 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const itemPhotos = batchFiles.map((url, i) => ({
                                        name: originalFiles[i]?.name || `${it.name || 'Photo'}_${String(i + 1).padStart(2, '0')}.jpg`,
                                        url
                                      }));
                                      setGalleryModalItem({ name: it.name || 'Photo Prints', photos: itemPhotos });
                                    }}
                                    className="w-11 h-11 rounded-lg border border-dashed border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 flex items-center justify-center font-black text-[10px] shrink-0 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500"
                                    title="View all photos in gallery"
                                  >
                                    +{batchFiles.length - 6}
                                  </button>
                                )}
                              </div>
                            )}
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
      {onUploadProofFile && <section className="p-3 rounded-xl border space-y-2" aria-label="Digital Proof">
        <label className="text-xs font-bold">ອັບໂຫຼດ Digital Proof<input type="file" accept=".pdf,.png,.jpg,.jpeg" aria-label="ອັບໂຫຼດ Digital Proof" disabled={proofPending} onChange={event => { const file = event.target.files?.[0]; if (file) { setProofFile(file); void saveProofFile(file); } }} /></label>
        {proofFile && <p className="text-xs">{proofFile.name}</p>}
        {proofError && <p role="alert" className="text-xs text-rose-700">{proofError}</p>}
        {proofFile && proofError && <button type="button" disabled={proofPending} onClick={() => void saveProofFile(proofFile)}>ລອງບັນທຶກ Proof ໃໝ່</button>}
      </section>}
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
                  className="py-3 px-3.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-black transition active:scale-95 cursor-pointer flex flex-wrap items-center gap-1.5"
                  title="Configure Production Process"
                >
                  <Layers className="w-3.5 h-3.5 text-sky-600" />
                  <span>{currentLang === 'lo' ? 'ຂະບວນການຜະລິດ' : 'Production Process'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onRevertArtwork}
                className="py-3 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-black transition active:scale-95 cursor-pointer flex flex-wrap items-center gap-1.5"
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

      {/* Universal Photo Batch Gallery Modal */}
      {galleryModalItem && (
        <FormModalTemplate
          isOpen={galleryModalItem !== null}
          onClose={() => setGalleryModalItem(null)}
          icon={<Images className="w-5 h-5 text-white" />}
          title={currentLang === 'lo' ? `ຄັງຮູບພາບງານພິມ (${galleryModalItem.photos.length} ຮູບ)` : `Artwork Gallery (${galleryModalItem.photos.length} Photos)`}
          subtitle={`ອໍເດີ #${orderIdDisplay} • ລາຍການ: ${galleryModalItem.name} • ລູກຄ້າ: ${customerName}`}
          maxWidthClass="max-w-4xl"
          badgeText={`${galleryModalItem.photos.length} ຮູບ`}
          footerActions={
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
              <span className="text-xs text-slate-500 font-semibold text-center sm:text-left">
                {currentLang === 'lo' 
                  ? `ລວມທັງໝົດ ${galleryModalItem.photos.length} ຮູບພາບ • ກົດທີ່ຮູບເພື່ອເບິ່ງ Preview ຄວາມລະອຽດສູງ` 
                  : `Total ${galleryModalItem.photos.length} photos ready for press`}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadBatchZip(galleryModalItem.photos, galleryModalItem.name)}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs cursor-pointer transition flex items-center gap-1.5 shadow-sm"
                >
                  {isZipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>ດາວໂຫຼດ ZIP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGalleryModalItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs cursor-pointer transition"
                >
                  {currentLang === 'lo' ? 'ປິດໜ້າຕ່າງ' : 'Close'}
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[60vh] overflow-y-auto p-1">
              {galleryModalItem.photos.map((photo, pIdx) => (
                <button type="button" aria-label={`ເບິ່ງຕົວຢ່າງຮູບ ${pIdx + 1}`}
                  key={pIdx}
                  onClick={() => {
                    if (setLightbox) {
                      setLightbox({
                        src: photo.url,
                        title: `${galleryModalItem.name} (${pIdx + 1}/${galleryModalItem.photos.length}) - #${orderIdDisplay}`,
                        documentNumber: `#${orderIdDisplay}`,
                        photos: galleryModalItem.photos.map((p, i) => ({
                          name: p.name || `Photo #${i + 1}`,
                          url: p.url,
                          originalUrl: p.url,
                          contentType: 'image/jpeg',
                        })),
                        initialPhotoIndex: pIdx,
                        onDownloadOriginal: async (item) => {
                          await downloadAuthenticatedFile(item?.originalUrl || item?.url || photo.url, item?.name || 'photo.jpg', undefined, item?.name);
                        }
                      });
                    }
                  }}
                  className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-sky-500 cursor-pointer shadow-2xs transition hover:shadow-md"
                >
                  <div className="aspect-square w-full overflow-hidden bg-slate-100">
                    <ArtworkThumbnail url={photo.url} name={photo.name} onUnavailable={markUnavailable} />
                  </div>
                  <div className="p-2 bg-white">
                    <span className="text-[10.5px] font-bold text-slate-700 block truncate" title={photo.name}>
                      {pIdx + 1}. {photo.name}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                    <ZoomIn className="w-5 h-5 text-sky-300" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </FormModalTemplate>
      )}
    </div>
  );
};

export default ArtworkPrepressCard;
