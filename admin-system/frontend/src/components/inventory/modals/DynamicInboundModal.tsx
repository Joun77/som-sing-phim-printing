import React from 'react';
import ImportForm from '../../inbound/ImportForm';

export default function DynamicInboundModal({ onSubmit, onClose }: { onSubmit: (type: string, data: any) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <ImportForm onSubmit={onSubmit} onClose={onClose} />
      </div>
    </div>
  );
}
