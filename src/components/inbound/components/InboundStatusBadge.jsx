import React from 'react';

export default function InboundStatusBadge({ categoryType, itemType, materialType, isPrinter, labelOverride }) {
  const isMachinery = categoryType === 'Machinery' || itemType === 'Equipment' || (categoryType && !['Material', 'Materials'].includes(categoryType));

  if (labelOverride) {
    return (
      <span className={`inline-flex items-center px-3 py-1 font-mono font-black text-xs rounded-full border uppercase ${
        isMachinery ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-sky-50 text-sky-700 border-sky-200'
      }`}>
        {labelOverride}
      </span>
    );
  }

  let label = 'ໝວດ A: ວັດສະດຸ';
  if (isPrinter) {
    label = 'ໝວດ B: ເຄື່ອງພິມ (Printing Machine)';
  } else if (isMachinery) {
    label = `ໝວດ B: ເຄື່ອງຈັກ (${itemType || 'Equipment'})`;
  } else {
    label = `ໝວດ A: ວັດສະດຸ (${materialType || categoryType || 'Materials'})`;
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 font-mono font-black text-xs rounded-full border uppercase ${
      isMachinery ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-sky-50 text-sky-700 border-sky-200'
    }`}>
      {label}
    </span>
  );
}
