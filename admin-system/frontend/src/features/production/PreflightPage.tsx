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
      const isBatch = (result as any).is_batch_photo || result.file_name.includes('Photo Prints') || !!(result as any).batch_files;
      const isMono = !isBatch && (result.color_pages_count || 0) === 0 && (result.mono_pages_count || 0) > 0;
      const covC = result.color_pages_avg_c !== undefined ? result.color_pages_avg_c : (result.avg_cov_c ?? 0);
      const covM = result.color_pages_avg_m !== undefined ? result.color_pages_avg_m : (result.avg_cov_m ?? 0);
      const covY = result.color_pages_avg_y !== undefined ? result.color_pages_avg_y : (result.avg_cov_y ?? 0);
      const covK = (result.color_pages_count || 0) > 0
        ? (result.color_pages_avg_k !== undefined ? result.color_pages_avg_k : (result.avg_cov_k ?? 0))
        : (result.mono_pages_avg_k !== undefined ? result.mono_pages_avg_k : (result.avg_cov_k ?? 0));
      const targetSize = result.target_paper_size || result.suggested_paper || (isBatch ? '4x6" (A6)' : 'A4');
      setPrefilledOrderSpecs({
        jobName: result.file_name.replace(/\.[^/.]+$/, ''),
        pageCount: isBatch ? 1 : result.total_pages,
        orderQuantity: isBatch ? result.total_pages : 1,
        colorPages: isBatch ? result.total_pages : result.color_pages_count,
        monoPages: isBatch ? 0 : result.mono_pages_count,
        jobWidth: result.target_width_mm || (isBatch ? 100 : 210),
        jobHeight: result.target_height_mm || (isBatch ? 150 : 297),
        suggestedPaper: result.suggested_paper || (isBatch ? 'Photo Glossy 230gsm' : targetSize),
        jobSizePreset: targetSize,
        avgCovC: covC,
        avgCovM: covM,
        avgCovY: covY,
        avgCovK: covK,
        cCoverage: covC,
        mCoverage: covM,
        yCoverage: covY,
        kCoverage: covK,
        colorMode: isMono ? 'MONO_K' : 'CMYK',
        fileUrl: result.file_url,
        fileName: result.file_name,
        preflightData: result,
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
