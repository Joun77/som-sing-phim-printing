import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck, 
  RefreshCw 
} from 'lucide-react';
import { CATEGORY_MENU_OPTIONS, InboundItemFormData } from '../forms/types';
import { 
  downloadInboundCategoryTemplate, 
  parseInboundExcel 
} from '../../utils/inboundExcelHelper';

interface InboundExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (items: InboundItemFormData[]) => void;
  currentLang?: string;
}

export const InboundExcelModal: React.FC<InboundExcelModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  currentLang = 'lo',
}) => {
  const [activeTab, setActiveTab] = useState<'TEMPLATE' | 'IMPORT'>('TEMPLATE');
  const [selectedCategory, setSelectedCategory] = useState<string>('PAPER');
  const [machinerySubCategory, setMachinerySubCategory] = useState<string>('MACHINERY_LASER');

  // Import State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedPreviewItems, setParsedPreviewItems] = useState<InboundItemFormData[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const isLao = currentLang === 'lo';

  // Effective category for Machinery vs others
  const effectiveCategory = selectedCategory === 'MACHINERY' ? machinerySubCategory : selectedCategory;

  // Handle Template Download
  const handleDownload = () => {
    downloadInboundCategoryTemplate(effectiveCategory, isLao);
  };

  // Handle File Drop / Select
  const handleFileChange = async (file: File, targetCat: string = effectiveCategory) => {
    setUploadFile(file);
    setParseError(null);
    setIsParsing(true);
    try {
      const res = await parseInboundExcel(file, targetCat);
      setParsedPreviewItems(res.items);
    } catch (err: any) {
      setParseError(err?.message || (isLao ? 'ບໍ່ສາມາດອ່ານໄຟລ໌ Excel ໄດ້' : 'Failed to parse Excel file'));
      setParsedPreviewItems([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        handleFileChange(file);
      } else {
        setParseError(isLao ? 'ກະລຸນາເລືອກສະເພາະໄຟລ໌ Excel (.xlsx, .xls)' : 'Please select Excel file only (.xlsx, .xls)');
      }
    }
  };

  const handleConfirmImport = () => {
    if (parsedPreviewItems.length === 0) return;
    onImportSuccess(parsedPreviewItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-800">
                {isLao ? 'ຈັດການຂໍ້ມູນ Excel (Excel Template & Import)' : 'Excel Bulk Management'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isLao 
                  ? 'ດາວໂຫລດແມ່ແບບ ແລະ ອັບໂຫລດລາຍການນຳເຂົ້າແບບຊຸດ (9 ໝວດ)' 
                  : 'Download templates and bulk import inbound items (9 categories)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex gap-2 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('TEMPLATE')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'TEMPLATE'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{isLao ? '1. ດາວໂຫລດແມ່ແບບ (Template)' : '1. Download Template'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('IMPORT')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'IMPORT'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{isLao ? '2. ອັບໂຫລດນຳເຂົ້າ (Import Excel)' : '2. Bulk Upload'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {isLao ? 'ເລືອກໝວດໝູ່ສິນຄ້າທີ່ຕ້ອງການດຳເນີນການ:' : 'Select Target Category:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORY_MENU_OPTIONS.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      if (uploadFile) {
                        handleFileChange(uploadFile, cat.id === 'MACHINERY' ? machinerySubCategory : cat.id);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-800 truncate">{cat.label}</div>
                      <div className="text-[10px] text-slate-400 font-medium truncate">{cat.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sub-Category Selector for MACHINERY (5 Specific Types) */}
            {selectedCategory === 'MACHINERY' && (
              <div className="mt-3 p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-900">
                    {isLao ? 'ເລືອກປະเภทย่อยของเครื่องจักร (Sub-Template):' : 'Select Machinery Sub-Type Template:'}
                  </span>
                  <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-md">
                    5 ປະເພດຍ່ອຍ
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: 'MACHINERY_LASER', label: isLao ? 'Laser ເລເຊີ' : 'Laser Printer' },
                    { id: 'MACHINERY_INKJET', label: isLao ? 'Inkjet ອິ້ງເຈັດ' : 'Inkjet Printer' },
                    { id: 'MACHINERY_CUTTER', label: isLao ? 'ເຄື່ອງຕັດ Cutter' : 'Cutter' },
                    { id: 'MACHINERY_LAMINATOR', label: isLao ? 'ເຄື່ອງເຄືອບ Laminator' : 'Laminator' },
                    { id: 'MACHINERY_BINDER', label: isLao ? 'ເຄື່ອງເຂົ້າເຫຼັ້ມ Binder' : 'Binder' },
                  ].map((sub) => {
                    const isSubActive = machinerySubCategory === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setMachinerySubCategory(sub.id);
                          if (uploadFile) {
                            handleFileChange(uploadFile, sub.id);
                          }
                        }}
                        className={`py-2 px-2.5 rounded-xl text-[11px] font-black transition cursor-pointer text-center truncate ${
                          isSubActive
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-white/80 border border-indigo-100'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* TAB 1: DOWNLOAD TEMPLATE */}
          {activeTab === 'TEMPLATE' && (
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 font-black text-xs">
                  <FileCheck className="w-4 h-4" />
                  <span>{isLao ? 'ຄຳແນະນຳໃນການໃຊ້ງານ Template:' : 'Template Usage Instructions:'}</span>
                </div>
                <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4 font-medium">
                  <li>{isLao ? 'ຟາຍມີຫົວຕາຕະລາງ ແລະ ຕົວຢ່າງຂໍ້ມູນສຳລັບໝວດທີ່ເລືອກໃຫ້ພ້ອມໃຊ້ງານ' : 'Includes formatted headers and sample data for the selected category'}</li>
                  <li>{isLao ? 'ຊ່ອງ SKU / Barcode ສາມາດປະຫວ່າງໄວ້ໄດ້ ລະບົບຈະສ້າງໃຫ້ອັດຕະໂນມັດ' : 'SKU / Barcode column can be left blank for automatic generation'}</li>
                  <li>{isLao ? 'ຫຼັງຈາກຕື່ມຂໍ້ມູນແລ້ວ ສາມາດບັນທຶກ ແລະ ນຳມາອັບໂຫລດໃນແທັບ "ອັບໂຫລດນຳເຂົ້າ"' : 'Save the file and upload via the "Bulk Upload" tab'}</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2.5 transition shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {selectedCategory === 'MACHINERY'
                    ? (isLao 
                        ? `ດາວໂຫລດ Excel Template (${machinerySubCategory.replace('MACHINERY_', '')})`
                        : `Download Excel Template (${machinerySubCategory.replace('MACHINERY_', '')})`)
                    : (isLao 
                        ? `ດາວໂຫລດ Excel Template (${CATEGORY_MENU_OPTIONS.find(c => c.id === selectedCategory)?.label.split(' ')[1] || selectedCategory})`
                        : `Download Excel Template for ${selectedCategory}`)}
                </span>
              </button>
            </div>
          )}

          {/* TAB 2: IMPORT EXCEL */}
          {activeTab === 'IMPORT' && (
            <div className="space-y-4 pt-2">
              {/* File Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-6 text-center transition flex flex-col items-center justify-center gap-2 ${
                  isDragging 
                    ? 'border-indigo-600 bg-indigo-50/50' 
                    : uploadFile 
                      ? 'border-emerald-500 bg-emerald-50/30' 
                      : 'border-slate-200 hover:border-indigo-400 bg-slate-50/60'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  uploadFile ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {uploadFile ? <CheckCircle2 className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                </div>

                <div className="text-center">
                  <p className="text-xs font-black text-slate-800">
                    {uploadFile 
                      ? uploadFile.name 
                      : (isLao ? 'ລາກໄຟລ໌ Excel ມາວາງທີ່ນີ້ ຫຼື ກົດເລືອກໄຟລ໌' : 'Drag & drop Excel file here or click to browse')}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {uploadFile 
                      ? `${(uploadFile.size / 1024).toFixed(1)} KB` 
                      : (isLao ? 'ຮອງຮັບສະເພາະໄຟລ໌ .xlsx, .xls' : 'Supports .xlsx, .xls')}
                  </p>
                </div>

                <label className="mt-2 py-2 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs">
                  {isLao ? 'ເລືອກໄຟລ໌ Excel' : 'Choose File'}
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Parsing Progress / Error */}
              {isParsing && (
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 py-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isLao ? 'ກຳລັງອ່ານ ແລະ ປະມວນຜົນຂໍ້ມູນ Excel...' : 'Parsing Excel data...'}</span>
                </div>
              )}

              {parseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Preview Summary */}
              {!isParsing && parsedPreviewItems.length > 0 && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 font-black text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        {isLao 
                          ? `ພົບຂໍ້ມູນຖືກຕ້ອງທັງໝົດ ${parsedPreviewItems.length} ລາຍການ` 
                          : `Successfully parsed ${parsedPreviewItems.length} items`}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Ready to add
                    </span>
                  </div>
                  
                  {/* Sample rows preview */}
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pt-1">
                    {parsedPreviewItems.slice(0, 5).map((item, idx) => (
                      <div key={item.id || idx} className="text-[11px] font-semibold bg-white/80 p-2 rounded-xl border border-emerald-100 flex items-center justify-between text-slate-700">
                        <span className="truncate max-w-[240px]">
                          {idx + 1}. {item.paperName || item.inkColorName || item.machineModel || item.sparePartName || `${item.importType} Item`}
                        </span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          Qty: {item.importQty} {item.importUnit}
                        </span>
                      </div>
                    ))}
                    {parsedPreviewItems.length > 5 && (
                      <div className="text-[10px] text-center text-slate-400 font-bold py-1">
                        + {isLao ? `ອີກ ${parsedPreviewItems.length - 5} ລາຍການ` : `${parsedPreviewItems.length - 5} more items`}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Confirm Import Button */}
              <button
                type="button"
                disabled={isParsing || parsedPreviewItems.length === 0}
                onClick={handleConfirmImport}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed active:scale-98 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2.5 transition shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isLao 
                    ? `ເພີ່ມເຂົ້າຊຸດນຳເຂົ້າ (${parsedPreviewItems.length} ລາຍການ)` 
                    : `Add to Inbound Batch (${parsedPreviewItems.length} items)`}
                </span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
