import React from 'react';
import {
  X,
  Eye,
  Download,
  FileText
} from 'lucide-react';
import type { MasterOrderItem } from '../../../orders/types';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white border border-sky-100 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-sky-600" />
              <span>{title}</span>
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              {item.item_name} • ຂະໜາດ: {item.paper_size || 'A4'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CMYK Breakdown */}
        <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-4 space-y-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            ຄ່າສີ CMYK Coverage (Preflight Analysis)
          </span>
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-black">
            <div className="bg-white border border-cyan-200 py-2 rounded-xl text-cyan-700">
              C: {item.avg_cov_c || 2.5}%
            </div>
            <div className="bg-white border border-pink-200 py-2 rounded-xl text-pink-700">
              M: {item.avg_cov_m || 2.5}%
            </div>
            <div className="bg-white border border-amber-200 py-2 rounded-xl text-amber-700">
              Y: {item.avg_cov_y || 2.5}%
            </div>
            <div className="bg-white border border-slate-200 py-2 rounded-xl text-slate-800">
              K: {item.avg_cov_k || 5.0}%
            </div>
          </div>
        </div>

        {/* Preview File Display */}
        <div className="min-h-[200px] bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-600">
          <FileText className="w-12 h-12 text-sky-500 mb-2" />
          <p className="text-sm font-bold text-slate-800">ໄຟລ໌ອັດຕະໂນມັດພ້ອມພິມ (Ready for Press)</p>
          <p className="text-xs text-slate-400 font-mono mt-1 break-all max-w-md">
            {url}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            ປິດ
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-sky-500/20"
          >
            <Download className="w-4 h-4" />
            <span>ດາວໂຫຼດໄຟລ໌ PDF</span>
          </a>
        </div>
      </div>
    </div>
  );
};
