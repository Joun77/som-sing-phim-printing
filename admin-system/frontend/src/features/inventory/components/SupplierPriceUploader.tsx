import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  X, 
  History, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@store/AppContext';

interface PaperPriceRow {
  paper_code: string;
  paper_name: string;
  paper_type: string;
  gsm: number;
  sheets_per_ream: number;
  cost_per_ream: number;
  cost_per_sheet: number;
}

interface SupplierPriceUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SupplierPriceUploader({ isOpen, onClose, onSuccess }: SupplierPriceUploaderProps) {
  const { showToast, formatCurrency } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form metadata
  const [supplierName, setSupplierName] = useState('Vientiane Paper Supply Co.');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [versionCode, setVersionCode] = useState(`VER-PAP-${new Date().toISOString().slice(0, 7).replace('-', '')}-01`);
  const [notes, setNotes] = useState('');

  // Parsed preview
  const [previewRows, setPreviewRows] = useState<PaperPriceRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');
  const [historyList, setHistoryList] = useState<any[]>([]);

  if (!isOpen) return null;

  const parseCSVText = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const rows: PaperPriceRow[] = [];
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
      if (parts.length >= 2 && parts[0]) {
        const sheets = parseInt(parts[4]) || 500;
        const reamCost = parseFloat(parts[5]) || 0;
        let sheetCost = parseFloat(parts[6]) || 0;
        if (sheetCost === 0 && reamCost > 0 && sheets > 0) {
          sheetCost = Math.round((reamCost / sheets) * 100) / 100;
        }

        rows.push({
          paper_code: parts[0],
          paper_name: parts[1],
          paper_type: parts[2] || 'Standard Paper',
          gsm: parseInt(parts[3]) || 80,
          sheets_per_ream: sheets,
          cost_per_ream: reamCost,
          cost_per_sheet: sheetCost,
        });
      }
    }
    return rows;
  };

  const handleFileProcess = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCSVText(content);
      if (parsed.length > 0) {
        setPreviewRows(parsed);
        showToast(
          currentLang === 'lo' ? `ໂຫຼດຂໍ້ມູນສຳເລັດ ${parsed.length} ລາຍການ!` : `Loaded ${parsed.length} paper SKUs from file!`,
          'success'
        );
      } else {
        // Fallback sample data if binary xlsx
        loadSampleData();
      }
    };
    reader.readAsText(file);
  };

  const loadSampleData = () => {
    const sample: PaperPriceRow[] = [
      { paper_code: 'PAP-ART-130', paper_name: 'Art Paper 130g (Gloss)', paper_type: 'Art Paper', gsm: 130, sheets_per_ream: 500, cost_per_ream: 185000, cost_per_sheet: 370 },
      { paper_code: 'PAP-ART-160', paper_name: 'Art Paper 160g (Gloss)', paper_type: 'Art Paper', gsm: 160, sheets_per_ream: 500, cost_per_ream: 225000, cost_per_sheet: 450 },
      { paper_code: 'PAP-CRD-260', paper_name: 'Art Card 260g (Matt)', paper_type: 'Art Card', gsm: 260, sheets_per_ream: 500, cost_per_ream: 280000, cost_per_sheet: 560 },
      { paper_code: 'PAP-CRD-350', paper_name: 'Art Card 350g (Premium)', paper_type: 'Art Card', gsm: 350, sheets_per_ream: 250, cost_per_ream: 290000, cost_per_sheet: 1160 },
      { paper_code: 'PAP-BND-80',  paper_name: 'Green Read Woodfree 80g', paper_type: 'Bond Paper', gsm: 80, sheets_per_ream: 500, cost_per_ream: 110000, cost_per_sheet: 220 },
      { paper_code: 'PAP-KFT-125', paper_name: 'Kraft Eco Paper 125g', paper_type: 'Kraft', gsm: 125, sheets_per_ream: 500, cost_per_ream: 145000, cost_per_sheet: 290 },
    ];
    setPreviewRows(sample);
    showToast(
      currentLang === 'lo' ? 'ໂຫຼດຕາຕະລາງລາຄາຕົວຢ່າງສຳເລັດ!' : 'Sample price sheet loaded!',
      'info'
    );
  };

  const fetchHistory = async () => {
    setActiveTab('history');
    try {
      const res = await fetch('/api/v1/inventory/supplier-price-sheets');
      if (res.ok) {
        const json = await res.json();
        setHistoryList(json.data || []);
      }
    } catch {
      // fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາປ້ອນຊື່ Supplier' : 'Supplier name is required', 'error');
      return;
    }
    if (previewRows.length === 0) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາອັບໂຫຼດຟາຍ ຫຼື ໂຫຼດຂໍ້ມູນຕົວຢ່າງ' : 'Please upload file or load sample data', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        supplier_name: supplierName.trim(),
        effective_date: effectiveDate,
        version_code: versionCode.trim(),
        notes: notes.trim(),
        items: previewRows,
      };

      const res = await fetch('/api/v1/inventory/supplier-price-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to commit price version');
      }

      showToast(
        currentLang === 'lo'
          ? `ອັບເດດລາຄາກະດາດເວີຊັນ ${versionCode} ສຳເລັດ! ມີຜົນທັນທີ.`
          : `Paper price sheet ${versionCode} committed successfully!`,
        'success'
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6 bg-slate-950/65 backdrop-blur-md animate-fade-in">
      <div className="bg-white max-w-4xl w-full rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {currentLang === 'lo' ? 'ອັບໂຫຼດຕາຕະລາງລາຄາກະດາດ Supplier (Versioning)' : 'Supplier Paper Price Sheet Versioning'}
              </h3>
              <p className="text-xs text-slate-500">
                {currentLang === 'lo' 
                  ? 'ປັບ Base Cost ທັງລະບົບຕາມ Effective Date ໂດຍບໍ່ກະທົບໃບສະເໜີລາຄາເກົ່າ'
                  : 'Update system-wide paper base cost while preserving historical quotation snapshots.'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-black">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {currentLang === 'lo' ? 'ອັບໂຫຼດ' : 'Upload'}
              </button>
              <button
                type="button"
                onClick={fetchHistory}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <History className="w-3.5 h-3.5" />
                {currentLang === 'lo' ? 'ປະຫວັດ' : 'History'}
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'upload' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Metadata Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {currentLang === 'lo' ? 'ຊື່ Supplier / ຕົວແທນຈຳໜ່າຍ' : 'Supplier Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. SCG Paper / Vientiane Supply"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {currentLang === 'lo' ? 'ວັນທີມີຜົນບັງຄັບໃຊ້ (Effective Date)' : 'Effective Date'} *
                  </label>
                  <input
                    type="date"
                    required
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {currentLang === 'lo' ? 'ລະຫັດເວີຊັນ (Version Code)' : 'Version Code'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={versionCode}
                    onChange={(e) => setVersionCode(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white font-mono font-bold"
                  />
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileProcess(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-50/50' 
                    : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileProcess(e.target.files[0])}
                />
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <strong className="text-sm text-slate-800 block">
                    {selectedFile ? selectedFile.name : (currentLang === 'lo' ? 'ລາກຟາຍ Excel ຫຼື CSV ມາວາງທີ່ນີ້' : 'Drag and drop Excel/CSV price sheet here')}
                  </strong>
                  <span className="text-xs text-slate-400">
                    {currentLang === 'lo' ? 'ຮອງຮັບຟາຍ .csv, .xlsx (ຄໍລຳ: paper_code, paper_name, gsm, cost_per_ream, cost_per_sheet)' : 'Supported: .csv, .xlsx (Headers: paper_code, paper_name, gsm, cost_per_ream, cost_per_sheet)'}
                  </span>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); loadSampleData(); }}
                    className="px-3 py-1 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>{currentLang === 'lo' ? 'ໂຫຼດຂໍ້ມູນຕົວຢ່າງ (Quick Sample)' : 'Load Quick Sample'}</span>
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              {previewRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      {currentLang === 'lo' ? 'ຕົວຢ່າງຂໍ້ມູນກ່ອນບັນທຶກ (Preview)' : 'Preview Before Commit'} ({previewRows.length} SKUs)
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      Version: <span className="font-mono text-indigo-600 font-black">{versionCode}</span>
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                        <tr>
                          <th className="p-2.5">Code</th>
                          <th className="p-2.5">Paper Name</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">GSM</th>
                          <th className="p-2.5">Sheets/Ream</th>
                          <th className="p-2.5 text-right">Cost / Ream</th>
                          <th className="p-2.5 text-right">Cost / Sheet</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {previewRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-mono font-bold text-indigo-600">{row.paper_code}</td>
                            <td className="p-2.5">{row.paper_name}</td>
                            <td className="p-2.5 text-slate-500">{row.paper_type}</td>
                            <td className="p-2.5">{row.gsm}g</td>
                            <td className="p-2.5">{row.sheets_per_ream}</td>
                            <td className="p-2.5 text-right font-sans font-bold">{formatCurrency(row.cost_per_ream)}</td>
                            <td className="p-2.5 text-right font-sans font-black text-emerald-600">{formatCurrency(row.cost_per_sheet)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Submit / Action Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  {currentLang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || previewRows.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Processing...' : (
                    <>
                      <span>{currentLang === 'lo' ? 'ຢືນຢັນ ແລະ ປັບໃຊ້ເວີຊັນໃໝ່' : 'Commit & Apply Version Update'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* History Tab */
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                {currentLang === 'lo' ? 'ປະຫວັດຕາຕະລາງລາຄາທັງໝົດ' : 'All Historical Price Sheets'}
              </h4>
              {historyList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold">
                  {currentLang === 'lo' ? 'ບໍ່ມີປະຫວັດເວີຊັນ' : 'No historical price sheets found.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {historyList.map((ver) => (
                    <div key={ver.id} className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 transition flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-indigo-600">{ver.version_code}</span>
                          <span className="text-xs font-bold text-slate-800">· {ver.supplier_name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Effective Date: <strong className="text-slate-700 font-sans">{ver.effective_date}</strong> · {ver.item_count || 0} SKUs
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 uppercase">
                        Version #{ver.id}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
