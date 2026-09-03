import React from 'react';
import { FileText, Download, ExternalLink, Eye, Image as ImageIcon, Sparkles } from 'lucide-react';

interface ArtworkPreviewCardProps {
  orderIdDisplay: string;
  order?: any;
  driveLink?: string;
  artworkThumbnailUrl?: string;
  currentLang: string;
  onOpenDriveLink: () => void;
  onDownloadArtwork?: () => void;
  setLightbox?: (v: { src: string; title: string } | null) => void;
}

export const ArtworkPreviewCard: React.FC<ArtworkPreviewCardProps> = ({
  orderIdDisplay,
  order,
  driveLink,
  artworkThumbnailUrl,
  currentLang,
  onOpenDriveLink,
  onDownloadArtwork,
  setLightbox,
}) => {
  const fileName = driveLink ? driveLink.split('/').pop() || `artwork_SSP_${orderIdDisplay}_master.pdf` : `artwork_SSP_${orderIdDisplay}_master.pdf`;

  const customerName = order?.customer_name || order?.customerName || order?.customer?.name || 'General Customer';
  const customerPhone = order?.customer_phone || order?.customerPhone || order?.customer?.phone || order?.phone || '';
  const customerAddress = order?.customer_address || order?.customerAddress || order?.customer?.address || order?.address || '';

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
      <div>
        {/* Title */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider block">Artwork Asset & Client</span>
              <h3 className="text-sm font-black text-slate-900">
                {currentLang === 'lo' ? 'ໄຟລ໌ງານພິມ & ຂໍ້ມູນລູກຄ້າ' : 'Customer Artwork & Client Profile'}
              </h3>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
            Approved (CMYK)
          </span>
        </div>

        {/* Customer Snapshot Box */}
        <div className="mb-3.5 p-3 bg-purple-50/50 border border-purple-100 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="truncate">
            <span className="font-black text-slate-900 block truncate">{customerName}</span>
            <span className="text-[11px] font-mono text-purple-700 font-bold block">{customerPhone || 'No Phone Number'}</span>
            {customerAddress && <span className="text-[10px] text-slate-500 block truncate mt-0.5">{customerAddress}</span>}
          </div>
        </div>

        {/* Interactive Artwork Preview Box */}
        <div 
          onClick={() => {
            if (artworkThumbnailUrl && setLightbox) {
              setLightbox({ src: artworkThumbnailUrl, title: `Artwork Preview - Order #${orderIdDisplay}` });
            } else {
              onOpenDriveLink();
            }
          }}
          className="w-full min-h-[190px] max-h-[220px] rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-4 overflow-hidden cursor-pointer hover:border-purple-400 transition relative group shadow-inner text-white"
          title={currentLang === 'lo' ? 'ຄລິກເພື່ອເບິ່ງໄຟລ໌ງານຕົວຢ່າງ' : 'Click to preview artwork file'}
        >
          {artworkThumbnailUrl ? (
            <>
              <img 
                src={artworkThumbnailUrl} 
                alt="Artwork Preview" 
                className="max-h-[180px] max-w-full object-contain rounded-xl shadow-md"
              />
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition rounded-2xl flex items-center justify-center gap-2 text-xs font-black text-amber-400">
                <Eye className="w-4 h-4" />
                <span>{currentLang === 'lo' ? 'ຄລິກເພື່ອເບິ່ງ Preview ເຕັມຈໍ' : 'Click for Fullscreen Preview'}</span>
              </div>
            </>
          ) : (
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-300 flex items-center justify-center mx-auto border border-sky-500/30">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block truncate max-w-[260px] font-mono">
                  {fileName}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Vector PDF • CMYK 300 DPI • Bleed 3mm
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-300 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ພ້ອມຍິງອອກແທ່ນພິມ (Press Ready)</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons: Preview & Download */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onOpenDriveLink}
          className="py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
        >
          <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
          <span>{currentLang === 'lo' ? 'ເປີດໄຟລ໌ງານ' : 'Open Artwork'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (onDownloadArtwork) {
              onDownloadArtwork();
            } else if (driveLink) {
              window.open(driveLink, '_blank');
            } else {
              onOpenDriveLink();
            }
          }}
          className="py-3 px-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-black transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/25 text-center border-none"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{currentLang === 'lo' ? 'ດາວໂຫຼດໄຟລ໌ພິມ' : 'Download File'}</span>
        </button>
      </div>
    </div>
  );
};

export default ArtworkPreviewCard;
