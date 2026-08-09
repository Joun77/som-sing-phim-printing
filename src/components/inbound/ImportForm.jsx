import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Upload, X, Plus, Trash } from 'lucide-react';

export default function ImportForm({ onSubmit, onClose }) {
  const { t } = useTranslation();
  const { equipment, showToast } = useApp();

  const [importType, setImportType] = useState('PRINTER'); // 'PRINTER' | 'INK'

  // --- PRINTER Form State ---
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
  const [printerPurchaseDate, setPrinterPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [printerPrice, setPrinterPrice] = useState('');
  const [printerVendor, setPrinterVendor] = useState('');
  const [printerWarrantyYear, setPrinterWarrantyYear] = useState(new Date().getFullYear() + 2);
  const [printerLocation, setPrinterLocation] = useState('Main Dept');
  const [printerImage, setPrinterImage] = useState('');
  const [printerReceipt, setPrinterReceipt] = useState('');

  // --- INK Form State ---
  const [inkCode, setInkCode] = useState(`INK-${Date.now().toString().slice(-4)}`);
  const [inkColorName, setInkColorName] = useState('');
  const [inkColorGroup, setInkColorGroup] = useState('Cyan');
  const [inkVolume, setInkVolume] = useState('100');
  const [inkBaseType, setInkBaseType] = useState('Dye');
  const [isCompatible, setIsCompatible] = useState(false);
  const [inkQty, setInkQty] = useState(1);
  const [inkUnitPrice, setInkUnitPrice] = useState('');
  const [inkSupplier, setInkSupplier] = useState('');
  const [inkTargetPrinter, setInkTargetPrinter] = useState('');
  const [inkImage, setInkImage] = useState('');
  const [inkReceipt, setInkReceipt] = useState('');

  // Dropdown list values
  const printerCategories = ['Laser', 'Inkjet', 'MFP', 'Plotter', 'UV Flatbed', 'Sublimation'];
  const colorSchemeTypes = ['Monochrome', 'CMYK', 'Photo 6-8 Colors', 'Plotter 10-12 Colors'];
  const functionOptions = ['Print', 'Scan', 'Copy', 'Fax'];
  const connectivityOptions = ['USB', 'Wi-Fi', 'Ethernet', 'Bluetooth'];
  const osOptions = ['Windows', 'macOS', 'Linux'];
  const colorGroups = ['Cyan', 'Magenta', 'Yellow', 'Black', 'Light Cyan', 'Light Magenta', 'White', 'Varnish', 'Other'];
  const inkBaseTypes = ['Dye', 'Pigment', 'Toner', 'UV Curable', 'Eco-Solvent'];

  const printersList = equipment.filter(eq => eq.category === 'Printer');

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

  const handleToggle = (item, list, setList) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (importType === 'PRINTER') {
      if (!printerBrand || !printerModel || !printerSn) {
        showToast('Please fill in Brand, Model, and Serial Number', 'warning');
        return;
      }
      const printerData = {
        id: printerAssetId,
        serialNumber: printerSn,
        brand: printerBrand,
        model: printerModel,
        name: `${printerBrand} ${printerModel}`,
        category: 'Printer',
        printerCategory,
        colorSchemeType,
        totalColorSlots: Number(totalColorSlots),
        functions: selectedFunctions,
        connectivity: selectedConnectivity,
        osCompatibility: selectedOS,
        purchaseDate: printerPurchaseDate,
        price: Number(printerPrice) || 0,
        purchaseCost: Number(printerPrice) || 0,
        vendor: printerVendor,
        warrantyExpirationYear: printerWarrantyYear,
        status: 'In Use',
        location: printerLocation,
        imageUrl: printerImage,
        receiptUrl: printerReceipt,
        components: [
          { name: 'Drum Unit (ຊຸດດຣຳ)', usage: 0, threshold: 90 },
          { name: 'Fuser Kit (ຊຸດຄວາມຮ້ອນ)', usage: 0, threshold: 90 },
          { name: 'Waste Toner (ກ່ອງໝຶກເສຍ)', usage: 0, threshold: 95 }
        ]
      };
      onSubmit('PRINTER', printerData);
    } else {
      if (!inkCode || !inkColorName || !inkUnitPrice) {
        showToast('Please fill in Ink Code, Color Name, and Unit Price', 'warning');
        return;
      }
      const inkData = {
        id: inkCode,
        name: `ໝຶກ ${inkColorName} (${inkBaseType})`,
        category: 'Ink',
        inkCode,
        colorName: inkColorName,
        colorGroup: inkColorGroup,
        volume: Number(inkVolume) || 100,
        stockQty: Number(inkQty),
        unitPrice: Number(inkUnitPrice),
        supplier: inkSupplier,
        inkBaseType,
        isCompatible,
        targetPrinterId: inkTargetPrinter,
        imageUrl: inkImage,
        receiptUrl: inkReceipt
      };
      onSubmit('INK', inkData);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 max-w-4xl mx-auto">
      {/* Header tab switcher */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
        <h3 className="font-extrabold text-lg text-slate-800">
          {importType === 'PRINTER' ? 'ນຳເຂົ້າເຄື່ອງພິມ (Import Printer)' : 'ນຳເຂົ້າໝຶກພິມ (Import Ink)'}
        </h3>
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setImportType('PRINTER')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              importType === 'PRINTER' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ເຄື່ອງພິມໃຫມ່ (Printer)
          </button>
          <button
            type="button"
            onClick={() => setImportType('INK')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              importType === 'INK' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ໝຶກພິມ (Ink / Consumable)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {importType === 'PRINTER' ? (
          /* PRINTER FORM FIELDS */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Asset ID</label>
              <input
                type="text"
                value={printerAssetId}
                onChange={(e) => setPrinterAssetId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold"
                placeholder="PRN-XXXX"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Serial Number (S/N)</label>
              <input
                type="text"
                value={printerSn}
                onChange={(e) => setPrinterSn(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold"
                placeholder="Enter Serial Number"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Brand / Make</label>
              <input
                type="text"
                value={printerBrand}
                onChange={(e) => setPrinterBrand(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold"
                placeholder="e.g. Konica Minolta, Epson"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Model</label>
              <input
                type="text"
                value={printerModel}
                onChange={(e) => setPrinterModel(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold"
                placeholder="e.g. C6085, L1800"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Printer Category</label>
              <select
                value={printerCategory}
                onChange={(e) => setPrinterCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold bg-white"
              >
                {printerCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Color Scheme Type</label>
                <select
                  value={colorSchemeType}
                  onChange={(e) => setColorSchemeType(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold bg-white"
                >
                  {colorSchemeTypes.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Total Color Slots</label>
                <input
                  type="number"
                  value={totalColorSlots}
                  onChange={(e) => setTotalColorSlots(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold"
                  min="1"
                  max="12"
                />
              </div>
            </div>

            {/* Tags / Multi-Select Groups */}
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
                        selectedFunctions.includes(opt)
                          ? 'bg-sky-50 text-sky-600 border-sky-200'
                          : 'bg-white text-slate-500 border-slate-200'
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
                        selectedConnectivity.includes(opt)
                          ? 'bg-sky-50 text-sky-600 border-sky-200'
                          : 'bg-white text-slate-500 border-slate-200'
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
                        selectedOS.includes(opt)
                          ? 'bg-sky-50 text-sky-600 border-sky-200'
                          : 'bg-white text-slate-500 border-slate-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Purchasing & Location details */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Purchase Date</label>
              <input
                type="date"
                value={printerPurchaseDate}
                onChange={(e) => setPrinterPurchaseDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Price / Cost (LAK)</label>
              <input
                type="number"
                value={printerPrice}
                onChange={(e) => setPrinterPrice(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold"
                placeholder="Enter Purchase Price"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Vendor / Supplier</label>
              <input
                type="text"
                value={printerVendor}
                onChange={(e) => setPrinterVendor(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold"
                placeholder="Supplier Details"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Warranty Expiry Year</label>
                <input
                  type="number"
                  value={printerWarrantyYear}
                  onChange={(e) => setPrinterWarrantyYear(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Location / Dept</label>
                <input
                  type="text"
                  value={printerLocation}
                  onChange={(e) => setPrinterLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold"
                />
              </div>
            </div>

            {/* Media Uploads */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Product Image</label>
                <div className="flex items-center gap-4">
                  <label className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 hover:border-sky-500 cursor-pointer bg-slate-50 transition overflow-hidden">
                    {printerImage ? (
                      <img src={printerImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-[10px] text-slate-400 font-bold mt-1">Upload</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setPrinterImage)} className="hidden" />
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={printerImage}
                      onChange={(e) => setPrinterImage(e.target.value)}
                      placeholder="Or enter Image URL"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Receipt / Invoice</label>
                <div className="flex items-center gap-4">
                  <label className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 hover:border-sky-500 cursor-pointer bg-slate-50 transition overflow-hidden">
                    {printerReceipt ? (
                      <img src={printerReceipt} alt="Slip" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-[10px] text-slate-400 font-bold mt-1">Invoice</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setPrinterReceipt)} className="hidden" />
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={printerReceipt}
                      onChange={(e) => setPrinterReceipt(e.target.value)}
                      placeholder="Or enter Document Link"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* INK / CONSUMABLE FORM FIELDS */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Ink Code / ID</label>
              <input
                type="text"
                value={inkCode}
                onChange={(e) => setInkCode(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold"
                placeholder="e.g. INK-BK-008"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Color Name</label>
              <input
                type="text"
                value={inkColorName}
                onChange={(e) => setInkColorName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold"
                placeholder="e.g. Matte Black, Cyan"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Color Group</label>
              <select
                value={inkColorGroup}
                onChange={(e) => setInkColorGroup(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold bg-white"
              >
                {colorGroups.map(grp => (
                  <option key={grp} value={grp}>{grp}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Volume (ml or Pages)</label>
              <input
                type="text"
                value={inkVolume}
                onChange={(e) => setInkVolume(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold"
                placeholder="e.g. 70, 100, 1000"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Ink Base Type</label>
              <select
                value={inkBaseType}
                onChange={(e) => setInkBaseType(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold bg-white"
              >
                {inkBaseTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center pt-8">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCompatible}
                  onChange={(e) => setIsCompatible(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-xs font-bold text-slate-600">Is Compatible Ink (Non-OEM)</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Received Qty</label>
                <input
                  type="number"
                  value={inkQty}
                  onChange={(e) => setInkQty(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Unit Price (LAK)</label>
                <input
                  type="number"
                  value={inkUnitPrice}
                  onChange={(e) => setInkUnitPrice(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold"
                  placeholder="Price per unit"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Target Link Printer (Asset ID)</label>
              <select
                value={inkTargetPrinter}
                onChange={(e) => setInkTargetPrinter(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold bg-white"
              >
                <option value="">-- Select Printer to Link --</option>
                {printersList.map(prn => (
                  <option key={prn.id} value={prn.id}>{prn.name} ({prn.id})</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Supplier Details</label>
              <input
                type="text"
                value={inkSupplier}
                onChange={(e) => setInkSupplier(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold"
                placeholder="Supplier Name & Contact info"
              />
            </div>

            {/* Media Uploads */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Ink Image Preview</label>
                <div className="flex items-center gap-4">
                  <label className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 hover:border-sky-500 cursor-pointer bg-slate-50 transition overflow-hidden">
                    {inkImage ? (
                      <img src={inkImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-[10px] text-slate-400 font-bold mt-1">Upload</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setInkImage)} className="hidden" />
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={inkImage}
                      onChange={(e) => setInkImage(e.target.value)}
                      placeholder="Or enter Image URL"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Receipt / Invoice</label>
                <div className="flex items-center gap-4">
                  <label className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 hover:border-sky-500 cursor-pointer bg-slate-50 transition overflow-hidden">
                    {inkReceipt ? (
                      <img src={inkReceipt} alt="Slip" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-[10px] text-slate-400 font-bold mt-1">Invoice</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setInkReceipt)} className="hidden" />
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={inkReceipt}
                      onChange={(e) => setInkReceipt(e.target.value)}
                      placeholder="Or enter Document Link"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
    </div>
  );
}
