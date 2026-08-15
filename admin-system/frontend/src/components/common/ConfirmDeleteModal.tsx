import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Reusable Modern Delete Action Button & Confirmation Modal
 * @param {Function} onDelete - Callback when user confirms deletion
 * @param {string} title - Custom title or item name
 * @param {string} description - Extra context details
 * @param {boolean} isOpen - Modal visibility state
 * @param {Function} onClose - Close modal callback
 * @param {boolean} isIconButton - Render as compact icon button or full text button
 */
interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName
}: ConfirmDeleteModalProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-2 border-slate-900/15 overflow-hidden space-y-5 p-6 animate-scale-up">
        {/* Header Icon & Close */}
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Details */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-slate-900">
            {title || (currentLang === 'lo' ? 'ຢືນຢັນການລຶບລາຍການ' : 'Confirm Deletion')}
          </h3>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed">
            {description || (currentLang === 'lo' ? 'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບລາຍການນີ້? ຂໍ້ມູນທີ່ລຶບແລ້ວຈະບໍ່ສາມາດກູ້ຄືນໄດ້' : 'Are you sure you want to delete this record? This action cannot be undone.')}
          </p>
          {itemName && (
            <div className="mt-3 p-3 rounded-2xl bg-rose-50/60 border border-rose-100 font-mono text-xs font-bold text-rose-900 truncate">
              {itemName}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-extrabold text-xs hover:bg-slate-50 transition cursor-pointer"
          >
            {currentLang === 'lo' ? 'ຍົກເລີກ (Cancel)' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 transition active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ລຶບລາຍການ (Delete)' : 'Delete Record'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable Modern Delete Action Button with Hover Tooltip
 */
interface DeleteActionButtonProps {
  onClick: () => void;
  label?: string;
  compact?: boolean;
}

export function DeleteActionButton({ onClick, label, compact = false }: DeleteActionButtonProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  if (compact) {
    return (
      <button
        onClick={onClick}
        title={currentLang === 'lo' ? 'ລຶບລາຍການ' : 'Delete'}
        className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 flex items-center justify-center transition active:scale-95 cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl font-black text-xs transition active:scale-95 cursor-pointer"
    >
      <Trash2 className="w-4 h-4 text-rose-600" />
      <span>{label || (currentLang === 'lo' ? 'ລຶບລາຍການ (Delete)' : 'Delete Record')}</span>
    </button>
  );
}
