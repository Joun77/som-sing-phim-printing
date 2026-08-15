import React, { useState, useEffect } from 'react';
import { X, Settings, Save, Calculator, Image as ImageIcon, Cpu, DollarSign, Info } from 'lucide-react';
import { useApp } from '@store/AppContext';
import { useTranslation } from 'react-i18next';

interface EditEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentItem: any;
}

export default function EditEquipmentModal({ isOpen, onClose, equipmentItem }: EditEquipmentModalProps) {
  const { updateEquipment, showToast, formatCurrency } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (equipmentItem) {
      const initialCost = Number(equipmentItem.purchaseCost || equipmentItem.purchasePrice || equipmentItem.MachinePrice || equipmentItem.unitCost || 0);
      setFormData({
        name: equipmentItem.name || '',
        category: equipmentItem.category || 'Printer',
        postPressSubtype: equipmentItem.postPressSubtype || equipmentItem.specs?.postPressSubtype || 'guillotine',
        brand: equipmentItem.brand || '',
        model: equipmentItem.model || '',
        serialNumber: equipmentItem.serialNumber || equipmentItem.sn || '',
        status: equipmentItem.status || 'In Use',
        printerCategory: equipmentItem.printerCategory || 'Laser',
        location: equipmentItem.location || 'Main Dept',
        purchaseCost: initialCost,
        lifespanYears: Number(equipmentItem.lifespanYears || equipmentItem.specs?.lifespanYears || 5),
        estMonthlyVolume: Number(equipmentItem.estMonthlyVolume || equipmentItem.specs?.estMonthlyVolume || 50000),
        maintenanceRatePercent: Number(equipmentItem.maintenanceRatePercent || equipmentItem.specs?.maintenanceRatePercent || 15),
        printedPagesCapacity: Number(equipmentItem.printedPagesCapacity || equipmentItem.TargetTotalPages || 1000000),
        maintenanceCostPerPage: Number(equipmentItem.maintenanceCostPerPage || equipmentItem.MaintenanceCostPerPage || 0),
        clickRateColor: Number(equipmentItem.clickRateColor || 0),
        clickRateBW: Number(equipmentItem.clickRateBW || 0),
        imageUrl: equipmentItem.imageUrl || equipmentItem.itemPhoto || '',
        ipAddress: equipmentItem.ipAddress || equipmentItem.ip || '',
        macAddress: equipmentItem.macAddress || equipmentItem.mac || '',
        vendor: equipmentItem.vendor || '',
        warrantyExpirationYear: equipmentItem.warrantyExpirationYear || equipmentItem.warrantyExpiration || '',
        purchaseDate: equipmentItem.purchaseDate || ''
      });
    }
  }, [equipmentItem]);

  if (!isOpen || !equipmentItem) return null;

  const isPostPress = formData.category !== 'Printer' && formData.category !== 'PRINTER';

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev: any) => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Real-time calculation for Post-Press machinery
  const assetVal = Number(formData.purchaseCost) || 0;
  const lifespanYrs = Number(formData.lifespanYears) || 5;
  const monthlyVol = Number(formData.estMonthlyVolume) || 50000;
  const maintRatePct = Number(formData.maintenanceRatePercent) || 0;

  const totalMonths = lifespanYrs * 12;
  const monthlyDepr = totalMonths > 0 ? (assetVal / totalMonths) : 0;
  const baseCostPerUnit = monthlyVol > 0 ? (monthlyDepr / monthlyVol) : 0;
  const netCostPerUnit = baseCostPerUnit * (1 + maintRatePct / 100);
  const calculatedRate = Math.round(netCostPerUnit * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isPrinter = !isPostPress;

    const updated = {
      ...formData,
      purchaseCost: assetVal,
      purchasePrice: assetVal,
      MachinePrice: assetVal,
      lifespanYears: lifespanYrs,
      estMonthlyVolume: monthlyVol,
      maintenanceRatePercent: maintRatePct,
      costPerConsumptionUnit: isPrinter ? Number(formData.maintenanceCostPerPage) : calculatedRate,
      calculatedCostPerPage: isPrinter ? Number(formData.maintenanceCostPerPage) : calculatedRate,
      printedPagesCapacity: Number(formData.printedPagesCapacity),
      TargetTotalPages: Number(formData.printedPagesCapacity),
      maintenanceCostPerPage: isPrinter ? Number(formData.maintenanceCostPerPage) : calculatedRate,
      MaintenanceCostPerPage: isPrinter ? Number(formData.maintenanceCostPerPage) : calculatedRate,
      clickRateColor: Number(formData.clickRateColor),
      clickRateBW: Number(formData.clickRateBW),
      specs: {
        ...(equipmentItem.specs || {}),
        postPressSubtype: formData.postPressSubtype,
        lifespanYears: lifespanYrs,
        estMonthlyVolume: monthlyVol,
        maintenanceRatePercent: maintRatePct,
        netCostPerUnit: calculatedRate
      }
    };

    updateEquipment(equipmentItem.id, updated);
    showToast(
      currentLang === 'lo'
        ? `ອັບເດັດຂໍ້ມູນເຄື່ອງຈັກ "${formData.name}" ສຳເລັດ!`
        : `Updated equipment "${formData.name}" successfully!`,
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl shadow-slate-900/15 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100 shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {currentLang === 'lo' ? 'ແກ້ໄຂໂປຣໄຟລ໌ເຄື່ອງຈັກ' : 'Edit Machine Profile'}
              </h3>
              <p className="text-[11px] font-semibold text-slate-400">
                ID: {equipmentItem.id} • <span className="text-sky-600 font-bold">{isPostPress ? 'Post-Press Machinery' : 'Printer'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs font-semibold text-slate-700 flex-1 bg-white">
          {/* General Information Card */}
          <div className="bg-slate-50/60 border border-slate-200/70 rounded-2xl p-4.5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2.5">
              <Info className="w-4 h-4 text-sky-600" />
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {currentLang === 'lo' ? 'ຂໍ້ມູນທົ່ວໄປ (General Info)' : 'General Information'}
              </h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Machine Name / Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Main Category</label>
                <select
                  value={formData.category || 'Printer'}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs"
                >
                  <option value="Printer">Printer</option>
                  <option value="Processing Tools">Processing Tools / Cutter</option>
                  <option value="Cutter">Cutter</option>
                  <option value="Binder">Binder</option>
                  <option value="Laminator">Laminator</option>
                </select>
              </div>

              {isPostPress ? (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Subtype Classification *</label>
                  <select
                    value={formData.postPressSubtype || 'guillotine'}
                    onChange={(e) => handleChange('postPressSubtype', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs"
                  >
                    <option value="guillotine">✂️ Guillotine Cutter</option>
                    <option value="sticker_plotter">🎯 Sticker Plotter</option>
                    <option value="hole_drill">🔘 Paper Hole Drill</option>
                    <option value="binder">📚 Paper Binder</option>
                    <option value="folder">📄 Folder / Creaser</option>
                    <option value="laminator">✨ Laminator</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Printer Category</label>
                  <select
                    value={formData.printerCategory || 'Laser'}
                    onChange={(e) => handleChange('printerCategory', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs"
                  >
                    <option value="Laser">Laser</option>
                    <option value="Inkjet">Inkjet</option>
                    <option value="MFP">MFP</option>
                    <option value="Plotter">Plotter</option>
                    <option value="UV Flatbed">UV Flatbed</option>
                    <option value="Sublimation">Sublimation</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Brand / Make</label>
                <input
                  type="text"
                  value={formData.brand || ''}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  placeholder="e.g. Epson, MicroCut, Horizon"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Model</label>
                <input
                  type="text"
                  value={formData.model || ''}
                  onChange={(e) => handleChange('model', e.target.value)}
                  placeholder="e.g. 30Q, EcoTank L15150"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Serial Number (S/N)</label>
                <input
                  type="text"
                  value={formData.serialNumber || ''}
                  onChange={(e) => handleChange('serialNumber', e.target.value)}
                  placeholder="e.g. SN-8823910"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Operating Status</label>
                <select
                  value={formData.status || 'In Use'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs"
                >
                  <option value="In Use">In Use</option>
                  <option value="Spare">Spare</option>
                  <option value="Under Repair">Under Repair</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Location / Department</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g. Digital Printing Room 1"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Financial & Depreciation Controls Section */}
          <div className="bg-slate-50/60 border border-slate-200/70 rounded-2xl p-4.5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  {isPostPress ? 'Post-Press Amortization Parameters' : 'Printer Financial & Depreciation Metrics'}
                </h4>
              </div>
              {isPostPress && (
                <span className="text-[10px] text-sky-600 font-bold lowercase bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                  simplified lifespan & volume model
                </span>
              )}
            </div>

            {isPostPress ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">1. Purchase Price (LAK) *</label>
                    <input
                      type="number"
                      value={formData.purchaseCost || 0}
                      onChange={(e) => handleChange('purchaseCost', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-extrabold focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">2. Target Lifespan (Years) *</label>
                    <input
                      type="number"
                      value={formData.lifespanYears || 5}
                      onChange={(e) => handleChange('lifespanYears', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-extrabold focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">3. Est. Monthly Volume (Sheets/mo) *</label>
                    <input
                      type="number"
                      value={formData.estMonthlyVolume || 50000}
                      onChange={(e) => handleChange('estMonthlyVolume', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-extrabold focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">4. Maintenance & Wear Rate (%) *</label>
                    <input
                      type="number"
                      value={formData.maintenanceRatePercent || 15}
                      onChange={(e) => handleChange('maintenanceRatePercent', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-extrabold focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Real-time Calculation Preview Card */}
                <div className="bg-gradient-to-br from-sky-50/80 via-indigo-50/40 to-sky-50/80 p-4 rounded-2xl space-y-3 border border-sky-100 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-sky-950 flex items-center gap-2">
                      <div className="p-1 bg-sky-500/10 rounded-lg text-sky-600">
                        <Calculator className="w-4 h-4" />
                      </div>
                      Amortized Unit Rate Breakdown:
                    </span>
                    <span className="font-mono font-black text-sky-700 text-xs bg-white px-3 py-1 rounded-xl border border-sky-200 shadow-2xs">
                      {formatCurrency(calculatedRate)} / sheet
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5 text-[10px] font-mono text-slate-600 pt-1">
                    <div className="bg-white p-2.5 rounded-xl border border-sky-100/80 shadow-2xs space-y-1">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Base Depreciation</span>
                      <span className="text-slate-900 font-extrabold text-xs block">{formatCurrency(baseCostPerUnit)}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-sky-100/80 shadow-2xs space-y-1">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Maint & Wear (+{formData.maintenanceRatePercent || 15}%)</span>
                      <span className="text-emerald-600 font-extrabold text-xs block">+{formatCurrency(netCostPerUnit - baseCostPerUnit)}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-sky-100/80 shadow-2xs space-y-1">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Target Monthly Depr</span>
                      <span className="text-sky-800 font-extrabold text-xs block">{formatCurrency(monthlyDepr)}/mo</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Asset Value / Price (LAK)</label>
                  <input
                    type="number"
                    value={formData.purchaseCost || 0}
                    onChange={(e) => handleChange('purchaseCost', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Target Lifetime Pages</label>
                  <input
                    type="number"
                    value={formData.printedPagesCapacity || 1000000}
                    onChange={(e) => handleChange('printedPagesCapacity', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Maint. Cost / Page (LAK)</label>
                  <input
                    type="number"
                    value={formData.maintenanceCostPerPage || 0}
                    onChange={(e) => handleChange('maintenanceCostPerPage', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Photo & Network Section */}
          <div className="bg-slate-50/60 border border-slate-200/70 rounded-2xl p-4.5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2.5">
              <Cpu className="w-4 h-4 text-violet-600" />
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Asset Media & Configuration
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!isPostPress && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">IP Address</label>
                    <input
                      type="text"
                      value={formData.ipAddress || ''}
                      onChange={(e) => handleChange('ipAddress', e.target.value)}
                      placeholder="192.168.1.100"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">MAC Address</label>
                    <input
                      type="text"
                      value={formData.macAddress || ''}
                      onChange={(e) => handleChange('macAddress', e.target.value)}
                      placeholder="00:11:22:33:44:55"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs placeholder:text-slate-400"
                    />
                  </div>
                </>
              )}

              <div className="sm:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Machine Photo</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                  <div className="flex-1 w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer transition-all"
                    />
                  </div>
                  {formData.imageUrl ? (
                    <div className="relative shrink-0 group">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="h-20 w-24 object-cover rounded-xl border border-slate-200 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleChange('imageUrl', '')}
                        className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md cursor-pointer"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-20 w-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 shrink-0">
                      <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                      <span className="text-[9px] font-bold mt-1">No Image</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition cursor-pointer active:scale-95 shadow-2xs"
            >
              {currentLang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-sky-600/20 active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{currentLang === 'lo' ? 'ບັນທຶກການປ່ຽນແປງ' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

