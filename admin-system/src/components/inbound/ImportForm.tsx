import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Upload, X, Plus, Trash, Layers, Settings, FileText, Printer, FileImage, ShieldAlert } from 'lucide-react';

export default function ImportForm({ onSubmit, onClose }) {
  const { t } = useTranslation();
  const { equipment, showToast } = useApp();

  const [importType, setImportType] = useState('PRINTER'); 
  // 'PRINTER' | 'INK' | 'PAPER' | 'LAMINATION' | 'MACHINERY' | 'BINDING' | 'SPARE_PARTS'

  // --- Dynamic Color Scheme Sub-Modal State (Update.01) ---
  const [colorSchemeOptions, setColorSchemeOptions] = useState([
    'CMYK',
    'Photo (6 Colors)',
    'Plotter (10-12 Colors)',
    'Monochrome'
  ]);
  const [isCustomSchemeModalOpen, setIsCustomSchemeModalOpen] = useState(false);
  const [newSchemeName, setNewSchemeName] = useState('');
  const [newSchemeSlots, setNewSchemeSlots] = useState(6);

  // --- Common Purchase Fields (Update.02) ---
  const [importQty, setImportQty] = useState(1);
  const [importUnit, setImportUnit] = useState('แผ่น');
  const [importCost, setImportCost] = useState('');
  const [importCurrency, setImportCurrency] = useState('LAK');
  const [importVendor, setImportVendor] = useState('');
  const [importDate, setImportDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
  const [productImage, setProductImage] = useState('');
  const [paymentSlip, setPaymentSlip] = useState('');
  const [taxInvoice, setTaxInvoice] = useState('');

  // --- Dynamic Custom Fields ---
  const [customFields, setCustomFields] = useState([]);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  // --- 1. PRINTER State ---
  const [printerAssetId, setPrinterAssetId] = useState(`PRN-${Date.now().toString().slice(-4)}`);
  const [printerSn, setPrinterSn] = useState('');
  const [printerBrand, setPrinterBrand] = useState('');
  const [printerModel, setPrinterModel] = useState('');
  const [printerCategory, setPrinterCategory] = useState('Laser');
  const [colorSchemeType, setColorSchemeType] = useState('CMYK');
  const [totalColorSlots, setTotalColorSlots] = useState(4);
  const [selectedFunctions, setSelectedFunctions] = useState(['Print']);
  const [selectedConnectivity, setSelectedConnectivity] = useState(['USB', 'Wi-Fi']);
  const [selectedOS, setSelectedOS] = useState(['Windows', 'macOS']);
  const [printerLocation, setPrinterLocation] = useState('Main Dept');
  const [printerWarrantyYear, setPrinterWarrantyYear] = useState(new Date().getFullYear() + 2);

  // --- 2. INK State ---
  const [inkCode, setInkCode] = useState(`INK-${Date.now().toString().slice(-4)}`);
  const [inkColorName, setInkColorName] = useState('');
  const [inkColorGroup, setInkColorGroup] = useState('Cyan');
  const [inkVolume, setInkVolume] = useState('100');
  const [inkBaseType, setInkBaseType] = useState('Dye');
  const [isCompatible, setIsCompatible] = useState(false);
  const [inkTargetPrinter, setInkTargetPrinter] = useState('');

  // --- 3. PAPER State ---
  const [paperName, setPaperName] = useState('');
  const [paperFormat, setPaperFormat] = useState('Sheet');
  const [paperSize, setPaperSize] = useState('A4');
  const [paperWidth, setPaperWidth] = useState('');
  const [paperLength, setPaperLength] = useState('');
  const [paperCore, setPaperCore] = useState('2"');
  const [coatingTech, setCoatingTech] = useState('');
  const [surfaceFinish, setSurfaceFinish] = useState('');
  const [printableSides, setPrintableSides] = useState('');
  const [grammage, setGrammage] = useState('');
  const [compatibilities, setCompatibilities] = useState([]);

  // --- 4. LAMINATION State ---
  const [laminationName, setLaminationName] = useState('');
  const [laminationFormat, setLaminationFormat] = useState('Sheet');
  const [laminationSize, setLaminationSize] = useState('A4');
  const [laminationThickness, setLaminationThickness] = useState('125 Micron');
  const [laminationMethod, setLaminationMethod] = useState('');
  const [laminationFinish, setLaminationFinish] = useState('');

  // --- 5. MACHINERY State ---
  const [machineryName, setMachineryName] = useState('');
  const [machineryModel, setMachineryModel] = useState('');
  const [machinerySn, setMachinerySn] = useState('');
  const [machineryWidth, setMachineryWidth] = useState('');
  const [machineryCapacity, setMachineryCapacity] = useState('');
  const [machineryDrive, setMachineryDrive] = useState('');

  // --- 6. BINDING State ---
  const [bindingName, setBindingName] = useState('');
  const [bindingType, setBindingType] = useState('Wire-O');
  const [bindingDiameter, setBindingDiameter] = useState('');
  const [bindingPitch, setBindingPitch] = useState('');
  const [bindingPageCapacity, setBindingPageCapacity] = useState('');

  // --- 7. SPARE PARTS State ---
  const [sparePartName, setSparePartName] = useState('');
  const [partSubCategory, setPartSubCategory] = useState('Spare Parts');
  const [partModelRef, setPartModelRef] = useState('');
  const [partYield, setPartYield] = useState('');

  // Constants
  const printerCategories = ['Laser', 'Inkjet', 'MFP', 'Plotter', 'UV Flatbed', 'Sublimation'];
  const functionOptions = ['Print', 'Scan', 'Copy', 'Fax'];
  const connectivityOptions = ['USB', 'Wi-Fi', 'Ethernet', 'Bluetooth'];
  const osOptions = ['Windows', 'macOS', 'Linux'];
  const colorGroups = ['Cyan', 'Magenta', 'Yellow', 'Black', 'Light Cyan', 'Light Magenta', 'White', 'Varnish', 'Other'];
  const inkBaseTypes = ['Dye', 'Pigment', 'Toner', 'UV Curable', 'Eco-Solvent'];
  const printersList = equipment.filter(eq => eq.category === 'Printer');

  const paperSizes = ['A4', 'A3', 'A3+', 'A5', 'B5', '4x6"', '5x7"', 'Custom'];
  const rollWidths = ['12"', '24"', '36"', '44"', '60"', 'Custom'];
  const coatingOptions = ['RC Coated', 'Cast Coated'];
  const finishOptions = ['Glossy', 'Luster/Satin', 'Matte', 'Silky', 'Canvas'];
  const sidesOptions = ['Single-Sided', 'Double-Sided'];
  const grammageOptions = ['180 gsm', '210 gsm', '230 gsm', '260 gsm', '300 gsm'];
  const compatibilityOptions = [
    { id: 'dye', label: 'Inkjet - Dye Ink (หมึกน้ำธรรมดา)' },
    { id: 'pigment', label: 'Inkjet - Pigment Ink (หมึกกันน้ำ)' },
    { id: 'toner', label: 'Laser / Digital Press (Toner) (ทนความร้อน)' },
    { id: 'solvent', label: 'Eco-Solvent / UV / Latex (สำหรับ Plotter)' }
  ];

  const laminationSizes = ['A4', 'A3', 'A5', 'B5'];
  const thicknessOptions = ['80 Micron', '100 Micron', '125 Micron', '150 Micron', '250 Micron'];
  const laminationMethods = ['Thermal Lamination', 'Cold Lamination'];
  const laminationFinishes = ['Glossy', 'Matte', 'Soft Touch'];

  const driveSystems = ['Manual', 'Electric', 'Hydraulic'];
  const bindingTypes = ['Wire-O', 'Plastic Comb', 'Hot Melt Glue Strip'];
  const pitchOptions = ['3:1', '2:1'];
  const partSubCategories = ['Spare Parts', 'Replacement Blades/Punches', 'Maintenance Chemicals', 'General Tools'];

  const handleFileUpload = (e, setUrlState) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setUrlState(uploadEvent.target.result);
      showToast('File uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleAddCustomField = () => {
    if (!newFieldKey.trim() || !newFieldValue.trim()) {
      showToast('Please fill in both key and value for custom field', 'warning');
      return;
    }
    setCustomFields([...customFields, { key: newFieldKey.trim(), value: newFieldValue.trim() }]);
    setNewFieldKey('');
    setNewFieldValue('');
  };

  const handleRemoveCustomField = (index) => {
    setCustomFields(customFields.filter((_, idx) => idx !== index));
  };

  const handleAddCustomScheme = (e) => {
    e.preventDefault();
    if (!newSchemeName.trim()) {
      showToast('Please enter a color scheme name', 'warning');
      return;
    }
    const name = newSchemeName.trim();
    const slots = Number(newSchemeSlots) || 1;
    if (!colorSchemeOptions.includes(name)) {
      setColorSchemeOptions([...colorSchemeOptions, name]);
    }
    setColorSchemeType(name);
    setTotalColorSlots(slots);
    setIsCustomSchemeModalOpen(false);
    setNewSchemeName('');
    setNewSchemeSlots(6);
    showToast('Custom color scheme added!', 'success');
  };

  const handleToggle = (item, list, setList) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let finalData: Record<string, any> = {
      importQty: Number(importQty),
      unit: importUnit,
      unitPrice: Number(importCost) || 0,
      currency: importCurrency,
      supplier: importVendor || null,
      importDate: importDate || null,
      paymentMethod: paymentMethod || null,
      imageUrl: productImage || null,
      receiptUrl: paymentSlip || null,
      taxInvoiceUrl: taxInvoice || null,
      customFields: customFields.reduce((acc, field) => {
        acc[field.key] = field.value;
        return acc;
      }, {})
    };

    if (importType === 'PRINTER') {
      if (!printerBrand || !printerModel || !printerSn) {
        showToast('Please fill in Brand, Model, and Serial Number', 'warning');
        return;
      }
      finalData = {
        ...finalData,
        id: printerAssetId,
        name: `${printerBrand} ${printerModel}`,
        serialNumber: printerSn,
        brand: printerBrand,
        model: printerModel,
        category: 'Printer',
        printerCategory,
        colorSchemeType,
        totalColorSlots: Number(totalColorSlots),
        functions: selectedFunctions,
        connectivity: selectedConnectivity,
        osCompatibility: selectedOS,
        purchaseDate: importDate,
        price: Number(importCost) || 0,
        vendor: importVendor,
        location: printerLocation,
        warrantyExpirationYear: printerWarrantyYear,
        components: [
          { name: 'Drum Unit (ຊຸດດຣຳ)', usage: 0, threshold: 90 },
          { name: 'Fuser Kit (ຊຸດຄວາມຮ້ອນ)', usage: 0, threshold: 90 },
          { name: 'Waste Toner (ກ່ອງໝຶກເສຍ)', usage: 0, threshold: 95 }
        ]
      };
    } else if (importType === 'INK') {
      if (!inkCode || !inkColorName || !importCost) {
        showToast('Please fill in Ink Code, Color Name, and Cost', 'warning');
        return;
      }
      finalData = {
        ...finalData,
        id: inkCode,
        name: `ໝຶກ ${inkColorName} (${inkBaseType})`,
        category: 'Ink',
        inkCode,
        colorName: inkColorName,
        colorGroup: inkColorGroup,
        volume: Number(inkVolume) || 100,
        stockQty: Number(importQty),
        inkBaseType,
        isCompatible,
        targetPrinterId: inkTargetPrinter
      };
    } else if (importType === 'PAPER') {
      if (!paperName) {
        showToast('Please fill in Paper/Media Name', 'warning');
        return;
      }
      finalData = {
        ...finalData,
        id: `PAP-${Date.now().toString().slice(-4)}`,
        name: paperName,
        category: 'Paper',
        stockQty: Number(importQty),
        specs: {
          paperFormat,
          paperSize: paperFormat === 'Sheet' ? paperSize : null,
          paperWidth: paperFormat === 'Roll' ? paperWidth : null,
          paperLength: paperFormat === 'Roll' ? paperLength : null,
          paperCore: paperFormat === 'Roll' ? paperCore : null,
          coatingTech: coatingTech || null,
          surfaceFinish: surfaceFinish || null,
          printableSides: printableSides || null,
          grammage: grammage || null,
          compatibilities
        }
      };
    } else if (importType === 'LAMINATION') {
      if (!laminationName) {
        showToast('Please fill in Lamination Name', 'warning');
        return;
      }
      finalData = {
        ...finalData,
        id: `LAM-${Date.now().toString().slice(-4)}`,
        name: laminationName,
        category: 'Lamination',
        stockQty: Number(importQty),
        specs: {
          laminationFormat,
          laminationSize: laminationFormat === 'Sheet' ? laminationSize : null,
          laminationThickness: laminationThickness || null,
          laminationMethod: laminationMethod || null,
          laminationFinish: laminationFinish || null
        }
      };
    } else if (importType === 'MACHINERY') {
      if (!machineryName || !machineryModel) {
        showToast('Please fill in Machinery Name and Model', 'warning');
        return;
      }
      finalData = {
        ...finalData,
        id: `MAC-${Date.now().toString().slice(-4)}`,
        name: `${machineryName} ${machineryModel}`,
        category: 'Machinery',
        serialNumber: machinerySn || null,
        specs: {
          machineryWidth: machineryWidth || null,
          machineryCapacity: machineryCapacity || null,
          machineryDrive: machineryDrive || null
        }
      };
    } else if (importType === 'BINDING') {
      if (!bindingName || !bindingType) {
        showToast('Please fill in Binding Supplies Name and Type', 'warning');
        return;
      }
      finalData = {
        ...finalData,
        id: `BIN-${Date.now().toString().slice(-4)}`,
        name: bindingName,
        category: 'Binding',
        stockQty: Number(importQty),
        specs: {
          bindingType,
          bindingDiameter: bindingDiameter || null,
          bindingPitch: bindingPitch || null,
          bindingPageCapacity: bindingPageCapacity || null
        }
      };
    } else if (importType === 'SPARE_PARTS') {
      if (!sparePartName) {
        showToast('Please fill in Item Name', 'warning');
        return;
      }
      finalData = {
        ...finalData,
        id: `PRT-${Date.now().toString().slice(-4)}`,
        name: sparePartName,
        category: 'SpareParts',
        stockQty: Number(importQty),
        specs: {
          partSubCategory,
          partModelRef: partModelRef || null,
          partYield: partYield || null
        }
      };
    }

    onSubmit(importType, finalData);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 max-w-4xl mx-auto relative">
      
      {/* Modal Close Corner Button */}
      <button 
        type="button"
        onClick={onClose} 
        className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="border-b border-slate-100 pb-4 mb-6">
        <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
          <Layers className="w-5 h-5 text-sky-600" />
          <span>ນຳເຂົ້າສິນຄ້າ / ອຸປະກອນໃໝ່ (Dynamic Inbound Form)</span>
        </h3>
        
        {/* Category Tab Selector */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-2xl mt-4">
          {[
            { id: 'PRINTER', label: 'เครื่องพิมพ์ (Printer)' },
            { id: 'INK', label: 'หมึกพิมพ์ (Ink)' },
            { id: 'PAPER', label: 'กระดาษ (Paper)' },
            { id: 'LAMINATION', label: 'ฟิล์มเคลือบ (Film)' },
            { id: 'MACHINERY', label: 'เครื่องจักร (Machinery)' },
            { id: 'BINDING', label: 'เข้าเล่ม (Binding)' },
            { id: 'SPARE_PARTS', label: 'อะไหล่ (Spare Parts)' }
          ].map(tab => (
            <button
              type="button"
              key={tab.id}
              onClick={() => {
                setImportType(tab.id);
                // Auto-adjust units for sensible defaults
                if (tab.id === 'PRINTER' || tab.id === 'MACHINERY') setImportUnit('เครื่อง');
                else if (tab.id === 'INK') setImportUnit('ขวด');
                else if (tab.id === 'PAPER') setImportUnit('แผ่น');
                else if (tab.id === 'LAMINATION') setImportUnit('ม้วน');
                else setImportUnit('กล่อง');
              }}
              className={`px-3 py-2 text-[11px] font-black rounded-xl transition ${
                importType === tab.id ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs font-semibold text-slate-700">
        
        {/* ----------------- 1. PRINTER FIELDS ----------------- */}
        {importType === 'PRINTER' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Asset ID *</label>
              <input
                type="text"
                value={printerAssetId}
                onChange={(e) => setPrinterAssetId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Serial Number (S/N) *</label>
              <input
                type="text"
                value={printerSn}
                onChange={(e) => setPrinterSn(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="Enter Serial Number"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Brand *</label>
              <input
                type="text"
                value={printerBrand}
                onChange={(e) => setPrinterBrand(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="e.g. Epson, Konica Minolta"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Model *</label>
              <input
                type="text"
                value={printerModel}
                onChange={(e) => setPrinterModel(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="e.g. TrueVIS VG3, AccurioPress"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Printer Category</label>
              <select
                value={printerCategory}
                onChange={(e) => setPrinterCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
              >
                {printerCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-black uppercase text-slate-400">Color Scheme Type</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomSchemeModalOpen(true)}
                    className="text-[10px] font-black text-sky-600 hover:text-sky-800 flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> เพิ่มสีเอง
                  </button>
                </div>
                <select
                  value={colorSchemeType}
                  onChange={(e) => setColorSchemeType(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                >
                  {colorSchemeOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Total Color Slots</label>
                <input
                  type="number"
                  value={totalColorSlots}
                  onChange={(e) => setTotalColorSlots(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                  min="1"
                  max="12"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div>
                <span className="block text-xs font-black uppercase text-slate-400 mb-2">Supported Functions</span>
                <div className="flex flex-wrap gap-2">
                  {functionOptions.map(opt => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleToggle(opt, selectedFunctions, setSelectedFunctions)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        selectedFunctions.includes(opt) ? 'bg-sky-50 text-sky-600 border-sky-200' : 'bg-white text-slate-500 border-slate-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="block text-xs font-black uppercase text-slate-400 mb-2">Connectivity Options</span>
                <div className="flex flex-wrap gap-2">
                  {connectivityOptions.map(opt => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleToggle(opt, selectedConnectivity, setSelectedConnectivity)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        selectedConnectivity.includes(opt) ? 'bg-sky-50 text-sky-600 border-sky-200' : 'bg-white text-slate-500 border-slate-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="block text-xs font-black uppercase text-slate-400 mb-2">OS Compatibility</span>
                <div className="flex flex-wrap gap-2">
                  {osOptions.map(opt => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleToggle(opt, selectedOS, setSelectedOS)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        selectedOS.includes(opt) ? 'bg-sky-50 text-sky-600 border-sky-200' : 'bg-white text-slate-500 border-slate-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Location / Dept</label>
              <input
                type="text"
                value={printerLocation}
                onChange={(e) => setPrinterLocation(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="Main Dept"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Warranty Expiry Year</label>
              <input
                type="number"
                value={printerWarrantyYear}
                onChange={(e) => setPrinterWarrantyYear(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
              />
            </div>
          </div>
        )}

        {/* ----------------- 2. INK FIELDS ----------------- */}
        {importType === 'INK' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Ink Item SKU Code *</label>
              <input
                type="text"
                value={inkCode}
                onChange={(e) => setInkCode(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Color Name *</label>
              <input
                type="text"
                value={inkColorName}
                onChange={(e) => setInkColorName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="e.g. Cyan, Magenta, Spot UV"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Color Group</label>
              <select
                value={inkColorGroup}
                onChange={(e) => setInkColorGroup(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
              >
                {colorGroups.map(grp => (
                  <option key={grp} value={grp}>{grp}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Volume per Bottle / Cartridge (ml)</label>
              <input
                type="text"
                value={inkVolume}
                onChange={(e) => setInkVolume(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="e.g. 100, 1000"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Ink Base Type</label>
              <select
                value={inkBaseType}
                onChange={(e) => setInkBaseType(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
              >
                {inkBaseTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Target Printer Link</label>
              <select
                value={inkTargetPrinter}
                onChange={(e) => setInkTargetPrinter(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
              >
                <option value="">-- Select Target Printer Link --</option>
                {printersList.map(pr => (
                  <option key={pr.id} value={pr.id}>{pr.name} ({pr.id})</option>
                ))}
              </select>
            </div>
            <div className="flex items-center pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCompatible}
                  onChange={(e) => setIsCompatible(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <span>เป็นหมึกเทียบเท่า / Compatible Ink (Non-OEM)</span>
              </label>
            </div>
          </div>
        )}

        {/* ----------------- 3. PAPER & MEDIA FIELDS ----------------- */}
        {importType === 'PAPER' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Paper/Media Name *</label>
              <input
                type="text"
                value={paperName}
                onChange={(e) => setPaperName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="e.g. เจ้ย A4 Double A 80gsm, กระดาษม้วน Photo Glossy"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">รูปแบบ (Format) *</label>
              <select
                value={paperFormat}
                onChange={(e) => setPaperFormat(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
              >
                <option value="Sheet">แบบแผ่น (Sheet)</option>
                <option value="Roll">แบบม้วน (Roll)</option>
              </select>
            </div>

            {paperFormat === 'Sheet' ? (
              <>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2">ขนาดมาตรฐาน (Standard Size)</label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                  >
                    {paperSizes.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2">หน้ากว้างม้วน (Roll Width)</label>
                  <select
                    value={paperWidth}
                    onChange={(e) => setPaperWidth(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                  >
                    <option value="">-- เลือกหน้ากว้าง --</option>
                    {rollWidths.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2">ความยาวม้วน (Roll Length) [Optional]</label>
                  <input
                    type="text"
                    value={paperLength}
                    onChange={(e) => setPaperLength(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                    placeholder="e.g. 50 เมตร, 100 เมตร"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2">ขนาดแกน (Core Size) [Optional]</label>
                  <select
                    value={paperCore}
                    onChange={(e) => setPaperCore(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                  >
                    <option value="2&quot;">แกน 2 นิ้ว</option>
                    <option value="3&quot;">แกน 3 นิ้ว</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Coating Technology [Optional]</label>
              <select
                value={coatingTech}
                onChange={(e) => setCoatingTech(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
              >
                <option value="">-- ไม่ระบุ --</option>
                {coatingOptions.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Surface Finish [Optional]</label>
              <select
                value={surfaceFinish}
                onChange={(e) => setSurfaceFinish(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
              >
                <option value="">-- ไม่ระบุ --</option>
                {finishOptions.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Printable Sides [Optional]</label>
              <select
                value={printableSides}
                onChange={(e) => setPrintableSides(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
              >
                <option value="">-- ไม่ระบุ --</option>
                {sidesOptions.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Grammage (gsm) [Optional]</label>
              <select
                value={grammage}
                onChange={(e) => setGrammage(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
              >
                <option value="">-- ไม่ระบุ --</option>
                {grammageOptions.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 space-y-2 pt-2 border-t border-slate-100">
              <span className="block text-xs font-black uppercase text-slate-400">ความรองรับเครื่องพิมพ์ (Printer & Ink Compatibility Matrix) [Optional]</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {compatibilityOptions.map(opt => (
                  <label key={opt.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-100 rounded-xl transition">
                    <input
                      type="checkbox"
                      checked={compatibilities.includes(opt.id)}
                      onChange={() => handleToggle(opt.id, compatibilities, setCompatibilities)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- 4. LAMINATION & FILM FIELDS ----------------- */}
        {importType === 'LAMINATION' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Lamination Film Name *</label>
              <input
                type="text"
                value={laminationName}
                onChange={(e) => setLaminationName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="e.g. ฟิล์มเคลือบใส 125 Micron A4"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">รูปแบบ (Format) *</label>
              <select
                value={laminationFormat}
                onChange={(e) => setLaminationFormat(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
              >
                <option value="Sheet">แบบแผ่น (Sheet)</option>
                <option value="Roll">แบบม้วน (Roll)</option>
              </select>
            </div>
            {laminationFormat === 'Sheet' && (
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">ขนาด (Size)</label>
                <select
                  value={laminationSize}
                  onChange={(e) => setLaminationSize(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                >
                  {laminationSizes.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">ความหนา (Micron Thickness) [Optional]</label>
              <select
                value={laminationThickness}
                onChange={(e) => setLaminationThickness(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
              >
                <option value="">-- ไม่ระบุ --</option>
                {thicknessOptions.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">ระบบเคลือบ (Lamination Method) [Optional]</label>
              <select
                value={laminationMethod}
                onChange={(e) => setLaminationMethod(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
              >
                <option value="">-- ไม่ระบุ --</option>
                {laminationMethods.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">ผิวสัมผัส (Lamination Finish) [Optional]</label>
              <select
                value={laminationFinish}
                onChange={(e) => setLaminationFinish(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
              >
                <option value="">-- ไม่ระบุ --</option>
                {laminationFinishes.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ----------------- 5. MACHINERY FIELDS ----------------- */}
        {importType === 'MACHINERY' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Machine Name *</label>
              <input
                type="text"
                value={machineryName}
                onChange={(e) => setMachineryName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="e.g. เครื่องเจาะกระดาษไฟฟ้า, เครื่องตัดกระดาษ"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Model Name *</label>
              <input
                type="text"
                value={machineryModel}
                onChange={(e) => setMachineryModel(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="e.g. MAC-A3-PRO"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Serial Number (S/N) [Optional]</label>
              <input
                type="text"
                value={machinerySn}
                onChange={(e) => setMachinerySn(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="S/N"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">ความกว้างหน้าทำงานสูงสุด (Max Working Width) [Optional]</label>
              <input
                type="text"
                value={machineryWidth}
                onChange={(e) => setMachineryWidth(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="e.g. 450 mm, A3+"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">กำลังการทำงานต่อครั้ง (Working Capacity) [Optional]</label>
              <input
                type="text"
                value={machineryCapacity}
                onChange={(e) => setMachineryCapacity(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="e.g. 400 แผ่น/ครั้ง, 50 mm"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">ระบบขับเคลื่อน (Drive System) [Optional]</label>
              <select
                value={machineryDrive}
                onChange={(e) => setMachineryDrive(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
              >
                <option value="">-- เลือกประเภทขับเคลื่อน --</option>
                {driveSystems.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ----------------- 6. BINDING SUPPLIES FIELDS ----------------- */}
        {importType === 'BINDING' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Binding Supply Name *</label>
              <input
                type="text"
                value={bindingName}
                onChange={(e) => setBindingName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="e.g. สันห่วงเหล็กกระดูกงู 8mm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">ประเภทอุปกรณ์ (Binding Type) *</label>
              <select
                value={bindingType}
                onChange={(e) => setBindingType(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                required
              >
                {bindingTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">ขนาดเส้นผ่านศูนย์กลาง (Diameter Size) [Optional]</label>
              <input
                type="text"
                value={bindingDiameter}
                onChange={(e) => setBindingDiameter(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="e.g. 6mm, 8mm, 10mm"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">ระยะห่างรูเจาะ (Pitch Ratio) [Optional]</label>
              <select
                value={bindingPitch}
                onChange={(e) => setBindingPitch(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
              >
                <option value="">-- เลือก Pitch Ratio --</option>
                {pitchOptions.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">ความหนาในการเข้าเล่ม (Page Capacity) [Optional]</label>
              <input
                type="text"
                value={bindingPageCapacity}
                onChange={(e) => setBindingPageCapacity(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="e.g. 100 sheets"
              />
            </div>
          </div>
        )}

        {/* ----------------- 7. SPARE PARTS & supplies FIELDS ----------------- */}
        {importType === 'SPARE_PARTS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Item Name *</label>
              <input
                type="text"
                value={sparePartName}
                onChange={(e) => setSparePartName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="e.g. ใบมีดคัตเตอร์ guillotine, หัวพิมพ์ทดแทน"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">ประเภทอะไหล่ (Sub-Category) *</label>
              <select
                value={partSubCategory}
                onChange={(e) => setPartSubCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                required
              >
                {partSubCategories.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">สเปกอ้างอิง / รุ่นอะไหล่ (Part Model Ref) [Optional]</label>
              <input
                type="text"
                value={partModelRef}
                onChange={(e) => setPartModelRef(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="Spec Reference / Part Model"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">อายุการใช้งานประเมิน (Maintenance Yield) [Optional]</label>
              <input
                type="text"
                value={partYield}
                onChange={(e) => setPartYield(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="e.g. 5,000 cuts, 6 months"
              />
            </div>
          </div>
        )}


        {/* ----------------- COMMON PURCHASING & TRANSACTION FIELDS (Update.02) ----------------- */}
        <div className="border-t border-slate-100 pt-6">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-slate-500" />
            <span>ข้อมูลจัดซื้อ & การชำระเงิน (Purchasing & Proofs)</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-sky-50/20 p-5 rounded-2xl border border-sky-100/50">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">จำนวนนำเข้า (Import Qty) *</label>
              <input
                type="number"
                value={importQty}
                onChange={(e) => setImportQty(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">หน่วยนับ (Unit) *</label>
              <input
                type="text"
                value={importUnit}
                onChange={(e) => setImportUnit(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="เช่น แผ่น, ม้วน, แพ็ค, กล่อง"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">ต้นทุนนำเข้า (Import Cost) *</label>
              <div className="relative">
                <input
                  type="number"
                  value={importCost}
                  onChange={(e) => setImportCost(e.target.value)}
                  className="w-full pl-4 pr-16 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                  placeholder="0.00"
                  required
                />
                <select
                  value={importCurrency}
                  onChange={(e) => setImportCurrency(e.target.value)}
                  className="absolute right-2 top-2 bottom-2 bg-slate-100 border border-slate-200 rounded-xl px-2 text-[10px] font-black focus:outline-none"
                >
                  <option value="LAK">LAK</option>
                  <option value="THB">THB</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">ผู้จัดจำหน่าย (Vendor) [Optional]</label>
              <input
                type="text"
                value={importVendor}
                onChange={(e) => setImportVendor(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                placeholder="Supplier Name"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">วันที่นำเข้า (Import Date) [Optional]</label>
              <input
                type="date"
                value={importDate}
                onChange={(e) => setImportDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">รูปแบบการชำระเงิน [Optional]</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
              >
                <option value="TRANSFER">เงินโอน (Bank Transfer)</option>
                <option value="CASH">เงินสด (Cash)</option>
                <option value="CREDIT">เงินเชื่อ (Credit)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ----------------- DYNAMIC CUSTOM FIELDS SECTION (Update.02) ----------------- */}
        <div className="border-t border-slate-100 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-500" />
              <span>ช่องข้อมูลเพิ่มเติม (Dynamic Custom Fields) [Optional]</span>
            </h4>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-4">
            {customFields.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-slate-200">
                {customFields.map((field, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl shadow-2xs">
                    <span className="font-bold text-slate-800">{field.key}: <span className="font-semibold text-slate-600">{field.value}</span></span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(idx)}
                      className="text-rose-500 hover:text-rose-700 transition p-1"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col md:flex-row items-end gap-3 text-xs">
              <div className="flex-1">
                <label className="block text-[10px] text-slate-400 uppercase mb-1">ชื่อฟิลด์ (Custom Key)</label>
                <input
                  type="text"
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  placeholder="เช่น สีผิวปกลามิเนต, รหัสชั้นเก็บของ"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-slate-400 uppercase mb-1">ค่าข้อมูล (Custom Value)</label>
                <input
                  type="text"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  placeholder="เช่น พิเศษเคลือบกระจก, A-12"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center gap-1 shrink-0 h-[36px]"
              >
                <Plus className="w-4 h-4" /> เพิ่ม Custom Field
              </button>
            </div>
          </div>
        </div>

        {/* ----------------- FILE UPLOADS SECTION ----------------- */}
        <div className="border-t border-slate-100 pt-6">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <FileImage className="w-4 h-4 text-slate-500" />
            <span>หลักฐานภาพและเอกสาร (Attachments) [Optional]</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/30 p-5 rounded-2xl border border-slate-100/60">
            {/* Product Photo */}
            <div>
              <span className="block text-[10px] text-slate-400 uppercase mb-2">รูปสินค้าจริง (Product Image)</span>
              <div className="flex items-center gap-4">
                <label className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 hover:border-sky-500 cursor-pointer bg-white transition overflow-hidden">
                  {productImage ? (
                    <img src={productImage} alt="Product" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-[9px] text-slate-400 mt-1">Image</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setProductImage)} className="hidden" />
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={productImage}
                    onChange={(e) => setProductImage(e.target.value)}
                    placeholder="Or enter Image URL"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Payment Slip */}
            <div>
              <span className="block text-[10px] text-slate-400 uppercase mb-2">สลิปโอนเงิน (Payment Slip)</span>
              <div className="flex items-center gap-4">
                <label className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 hover:border-sky-500 cursor-pointer bg-white transition overflow-hidden">
                  {paymentSlip ? (
                    <img src={paymentSlip} alt="Slip" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-[9px] text-slate-400 mt-1">Slip</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setPaymentSlip)} className="hidden" />
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={paymentSlip}
                    onChange={(e) => setPaymentSlip(e.target.value)}
                    placeholder="Or enter Document Link"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Tax Invoice */}
            <div>
              <span className="block text-[10px] text-slate-400 uppercase mb-2">ใบส่งสินค้า/ใบกำกับภาษี (Invoice)</span>
              <div className="flex items-center gap-4">
                <label className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 hover:border-sky-500 cursor-pointer bg-white transition overflow-hidden">
                  {taxInvoice ? (
                    <img src={taxInvoice} alt="Invoice" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-[9px] text-slate-400 mt-1">Invoice</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setTaxInvoice)} className="hidden" />
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={taxInvoice}
                    onChange={(e) => setTaxInvoice(e.target.value)}
                    placeholder="Or enter Doc URL"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-sky-600/10"
          >
            {t('common.save')}
          </button>
        </div>
      </form>

      {/* ----------------- DYNAMIC COLOR SCHEME SUB-MODAL (Update.01) ----------------- */}
      {isCustomSchemeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-fade-in space-y-4">
            <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>เพิ่มระบบสีใหม่ (Custom Color Scheme)</span>
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">ชื่อระบบสีใหม่ (เช่น Hexachrome 6-Color)</label>
                <input
                  type="text"
                  value={newSchemeName}
                  onChange={(e) => setNewSchemeName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  placeholder="e.g. Spot UV Specialty, Hexachrome"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">จำนวนช่องสีทั้งหมด (Total Color Slots)</label>
                <input
                  type="number"
                  value={newSchemeSlots}
                  onChange={(e) => setNewSchemeSlots(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  min="1"
                  max="12"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsCustomSchemeModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomScheme}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
