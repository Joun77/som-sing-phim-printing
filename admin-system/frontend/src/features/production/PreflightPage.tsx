import React from 'react';
import { useApp } from '../../store/AppContext';
import { PreflightChecker } from '../../components/PreflightChecker';
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
      setPrefilledOrderSpecs({
        jobName: result.file_name.replace(/\.[^/.]+$/, ''),
        pageCount: result.total_pages,
        avgCovC: result.avg_cov_c,
        avgCovM: result.avg_cov_m,
        avgCovY: result.avg_cov_y,
        avgCovK: result.avg_cov_k,
        fileUrl: result.file_url,
        fileName: result.file_name,
      });
    }
    setActiveTab('quotation');
    if (showToast) {
      showToast('ສົ່ງຄ່າສີ ແລະ ຈຳນວນໜ້າໄປຍັງໃບສະເໜີລາຄາຮຽບຮ້ອຍ!', 'success');
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
