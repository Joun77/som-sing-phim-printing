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
        colorPages: result.color_pages_count,
        monoPages: result.mono_pages_count,
        jobWidth: result.target_width_mm || 210,
        jobHeight: result.target_height_mm || 297,
        avgCovC: result.color_pages_avg_c || result.avg_cov_c,
        avgCovM: result.color_pages_avg_m || result.avg_cov_m,
        avgCovY: result.color_pages_avg_y || result.avg_cov_y,
        avgCovK: (result.color_pages_count || 0) > 0 ? (result.color_pages_avg_k || result.avg_cov_k) : (result.mono_pages_avg_k || result.avg_cov_k),
        colorMode: (result.color_pages_count || 0) > 0 ? 'CMYK' : 'MONO_K',
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
