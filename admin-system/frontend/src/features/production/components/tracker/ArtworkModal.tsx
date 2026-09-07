import React, { useState } from 'react';
import {
  Eye,
  Download,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  ZoomIn
} from 'lucide-react';
import type { MasterOrderItem } from '../../../orders/types';
import { FormModalTemplate } from '../../../../components/common/FormModalTemplate';

interface ArtworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  item: MasterOrderItem;
}

export const ArtworkModal: React.FC<ArtworkModalProps> = ({
  isOpen,
  onClose,
  title,
  url,
  item,
}) => {
  const [imageError, setImageError] = useState(false);

  if (!isOpen) return null;

  const isPdf = url.toLowerCase().includes('.pdf');
  const isImage = !isPdf && (
    url.match(/\.(jpeg|jpg|png|webp|gif|svg)(\?.*)?$/i) ||
    url.includes('images.unsplash.com') ||
    url.startsWith('data:image/') ||
    !url.includes('.')
  );

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<Eye className="w-5 h-5 text-white" />}
      title={title || 'ເບິ່ງໄຟລ໌ອາດເວິກ / ຮູບພາບ'}
      subtitle={`${item.item_name || 'Print Job'} • ຂະໜາດ: ${item.paper_size || 'A4'}`}
      badgeText={isImage ? 'IMAGE' : isPdf ? 'PDF' : 'ARTWORK'}
      maxWidthClass="max-w-3xl"
      footerActions={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500 font-medium truncate max-w-sm">
            {url}
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              ປິດ
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-sky-500/20"
            >
              <Download className="w-4 h-4" />
              <span>ດາວໂຫຼດໄຟລ໌</span>
            </a>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* CMYK Breakdown */}
        <div className="bg-white border border-sky-100 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              ຄ່າສີ CMYK Coverage (Preflight Analysis)
            </span>
            <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
              Preflight OK
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-black">
            <div className="bg-sky-50/50 border border-cyan-200 py-2 rounded-xl text-cyan-700">
              <span className="text-[10px] text-cyan-600 block">Cyan</span>
              {item.avg_cov_c || 2.5}%
            </div>
            <div className="bg-pink-50/50 border border-pink-200 py-2 rounded-xl text-pink-700">
              <span className="text-[10px] text-pink-600 block">Magenta</span>
              {item.avg_cov_m || 2.5}%
            </div>
            <div className="bg-amber-50/50 border border-amber-200 py-2 rounded-xl text-amber-700">
              <span className="text-[10px] text-amber-600 block">Yellow</span>
              {item.avg_cov_y || 2.5}%
            </div>
            <div className="bg-slate-50 border border-slate-200 py-2 rounded-xl text-slate-800">
              <span className="text-[10px] text-slate-600 block">Key (Black)</span>
              {item.avg_cov_k || 5.0}%
            </div>
          </div>
        </div>

        {/* Preview File Display */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[300px] max-h-[55vh] overflow-hidden relative group">
          {isImage && !imageError ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={url}
                alt={title}
                onError={() => setImageError(true)}
                className="max-h-[50vh] max-w-full object-contain rounded-xl shadow-xs"
              />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2 p-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow-sm"
                title="ເບິ່ງຮູບຂະໜາດເຕັມ"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-600 space-y-2">
              {isPdf ? (
                <FileText className="w-12 h-12 text-sky-500" />
              ) : (
                <ImageIcon className="w-12 h-12 text-slate-400" />
              )}
              <p className="text-sm font-bold text-slate-800">
                {isPdf ? 'ໄຟລ໌ PDF ພ້ອມພິມ (Ready for Press)' : 'ໄຟລ໌ຮູບພາບ / ອາດເວິກ'}
              </p>
              <p className="text-xs text-slate-400 font-mono break-all max-w-md">
                {url}
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>ເປີດໄຟລ໌ໃນແຖບໃໝ່</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </FormModalTemplate>
  );
};
