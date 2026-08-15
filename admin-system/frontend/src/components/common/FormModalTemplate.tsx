import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface FormModalTemplateProps {
  isOpen?: boolean;
  onClose: () => void;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badgeText?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
}

/**
 * FormModalTemplate: Unified, ultra-clean modal design system component for all forms in Som-Sing Phim ERP.
 * Features corporate navy gradient header, circular glowing sky-blue icon badges, symmetrical slate-50 body, and React createPortal full-screen backdrop.
 */
export const FormModalTemplate: React.FC<FormModalTemplateProps> = ({
  isOpen = true,
  onClose,
  icon,
  title,
  subtitle,
  badgeText,
  maxWidthClass = 'max-w-5xl',
  children,
  footerActions,
}) => {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/50 backdrop-blur-md animate-fade-in">
      <div className={`bg-slate-50 ${maxWidthClass} w-full rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up`}>
        {/* Rich Corporate Navy Gradient Header */}
        <div className="bg-gradient-to-r from-primary-navy via-slate-900 to-primary-navy text-white px-6 sm:px-8 py-5 flex items-center justify-between shrink-0 border-b border-slate-800 shadow-md">
          <div className="flex items-center gap-3.5">
            {icon && (
              <div className="w-11 h-11 bg-accent-sky text-white rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/30 border border-sky-400/30 [&>svg]:text-white [&>svg]:w-5.5 [&>svg]:h-5.5">
                {icon}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black tracking-wide font-sans text-white">
                  {title}
                </h3>
                {badgeText && (
                  <span className="px-2.5 py-0.5 bg-accent-sky/20 text-sky-300 text-[11px] font-black rounded-lg border border-sky-400/30 uppercase tracking-wider">
                    {badgeText}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs font-semibold text-slate-300/80 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content Body with Soft Slate-50 Background */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-5 flex-1 bg-slate-50/70">
          {children}
        </div>

        {/* Standard Action Buttons Footer */}
        {footerActions && (
          <div className="px-6 py-4 bg-white border-t border-slate-200/80 flex items-center justify-end gap-3 shrink-0">
            {footerActions}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export interface FormSectionProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({ icon, title, subtitle, children }) => {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        {icon && <span className="text-accent-sky [&>svg]:w-4 [&>svg]:h-4">{icon}</span>}
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
            {title}
          </h4>
          {subtitle && (
            <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};
