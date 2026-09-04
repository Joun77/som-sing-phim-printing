import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface OrderIdCopyButtonProps {
  orderId: string;
  className?: string;
  showHash?: boolean;
}

export const OrderIdCopyButton: React.FC<OrderIdCopyButtonProps> = ({
  orderId,
  className = '',
  showHash = false,
}) => {
  const [copied, setCopied] = useState(false);

  // Clean string (e.g. ord-8833 stripped of '#')
  const cleanId = String(orderId || '').replace(/^#+/, '').trim();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(cleanId);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = cleanId;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy order ID: ', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Click to copy Order ID"
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-all cursor-pointer select-none text-xs font-mono font-bold ${
        copied
          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
          : 'bg-slate-100/80 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200'
      } ${className}`}
    >
      <span>{showHash ? `#${cleanId}` : cleanId}</span>
      {copied ? (
        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold font-sans">
          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
          <span>ຄັດລອກແລ້ວ</span>
        </span>
      ) : (
        <Copy className="w-3 h-3 text-slate-400 hover:text-slate-600 transition" />
      )}
    </button>
  );
};

export default OrderIdCopyButton;
