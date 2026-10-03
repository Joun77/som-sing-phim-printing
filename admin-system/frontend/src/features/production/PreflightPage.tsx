import React from 'react';
import { useApp } from '../../store/AppContext';
import { PreflightChecker } from '../../components/PreflightChecker';
import { mapPreflightToSpecs } from '../pricing/utils/preflightMapper';
import type { PreflightResult } from '../orders/types';

export const PreflightPage: React.FC<{
  onSendToQuotation?: (result: PreflightResult) => void;
}> = ({ onSendToQuotation }) => {
  const { setActiveTab, setPrefilledOrderSpecs, showToast } = useApp();

  const handleSendToQuotation = (result: PreflightResult) => {
    if (onSendToQuotation) {
      onSendToQuotation(result);
      return;
    }

    if (setPrefilledOrderSpecs) {
      setPrefilledOrderSpecs(mapPreflightToSpecs(result, 0));
    }
    setActiveTab('quotation');
    if (showToast) {
      showToast('ສົ່ງຄ່າສີ, ຂະໜາດຕັດ ແລະ ຈຳນວນຮູບໄປຍັງໃບສະເໜີລາຄາຮຽບຮ້ອຍ!', 'success');
    }
  };

  const handleSkipToManual = () => {
    setActiveTab('quotation');
  };

  return (
    <div className="space-y-6 py-4">
      <PreflightChecker
        onSendToQuotation={handleSendToQuotation}
        onSkipToManual={handleSkipToManual}
      />
    </div>
  );
};
