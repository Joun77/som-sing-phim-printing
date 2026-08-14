import React, { useState, useEffect } from 'react';
import { X, Settings, Save } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { useTranslation } from 'react-i18next';

interface EditEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentItem: any;
}

export default function EditEquipmentModal({ isOpen, onClose, equipmentItem }: EditEquipmentModalProps) {
  const { updateEquipment, showToast } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (equipmentItem) {
      setFormData({
        name: equipmentItem.name || '',
        category: equipmentItem.category || 'Printer',
        brand: equipmentItem.brand || '',
        model: equipmentItem.model || '',
        serialNumber: equipmentItem.serialNumber || equipmentItem.sn || '',
        status: equipmentItem.status || 'In Use',
        printerCategory: equipmentItem.printerCategory || 'Laser',
        location: equipmentItem.location || 'Main Dept',
        purchaseCost: equipmentItem.purchaseCost || equipmentItem.MachinePrice || 0,
        printedPagesCapacity: equipmentItem.printedPagesCapacity || equipmentItem.TargetTotalPages || 1000000,
        maintenanceCostPerPage: equipmentItem.maintenanceCostPerPage || equipmentItem.MaintenanceCostPerPage || 0,
        clickRateColor: equipmentItem.clickRateColor || 0,
        clickRateBW: equipmentItem.clickRateBW || 0,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...formData,
      purchaseCost: Number(formData.purchaseCost),
      MachinePrice: Number(formData.purchaseCost),
      printedPagesCapacity: Number(formData.printedPagesCapacity),
      TargetTotalPages: Number(formData.printedPagesCapacity),
      maintenanceCostPerPage: Number(formData.maintenanceCostPerPage),
      MaintenanceCostPerPage: Number(formData.maintenanceCostPerPage),
      clickRateColor: Number(formData.clickRateColor),
      clickRateBW: Number(formData.clickRateBW)
    };

    updateEquipment(equipmentItem.id, updated);
    showToast(
      currentLang === 'lo'
        ? `ອัปເດັດຂໍ້ມູນເຄື່ອງຈັກ "${formData.name}" ສຳເລັດ!`
        : `Updated equipment "${formData.name}" successfully!`,
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-600" />
            <div>
              <h3 className="font-extrabold text-base text-slate-800">
                {currentLang === 'lo' ? 'แก้ไขข้อมูลเครื่องจักร (Edit Machine Profile)' : 'Edit Machine Profile'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400">ID: {equipmentItem.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs font-semibold text-slate-700">
          {/* General Specs */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1">
              General Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Machine Name / Display Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Category</label>
                <select
                  value={formData.category || 'Printer'}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-sky-500"
                >
                  <option value="Printer">Printer</option>
                  <option value="Cutter">Cutter</option>
                  <option value="Binder">Binder</option>
                  <option value="Laminator">Laminator</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Brand / Make</label>
                <input
                  type="text"
                  value={formData.brand || ''}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  placeholder="e.g. Epson, Roland, Horizon"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Model</label>
                <input
                  type="text"
                  value={formData.model || ''}
                  onChange={(e) => handleChange('model', e.target.value)}
                  placeholder="e.g. EcoTank L15150"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Serial Number (S/N)</label>
                <input
                  type="text"
                  value={formData.serialNumber || ''}
                  onChange={(e) => handleChange('serialNumber', e.target.value)}
                  placeholder="e.g. SN-8823910"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono bg-white text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Operating Status</label>
                <select
                  value={formData.status || 'In Use'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-sky-500"
                >
                  <option value="In Use">In Use (พร้อมใช้งาน)</option>
                  <option value="Spare">Spare (สำรอง)</option>
                  <option value="Under Repair">Under Repair (กำลังซ่อมบำรุง)</option>
                  <option value="Retired">Retired (ปลดระวาง)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Printer Category</label>
                <select
                  value={formData.printerCategory || 'Laser'}
                  onChange={(e) => handleChange('printerCategory', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-sky-500"
                >
                  <option value="Laser">Laser</option>
                  <option value="Inkjet">Inkjet</option>
                  <option value="MFP">MFP</option>
                  <option value="Plotter">Plotter</option>
                  <option value="UV Flatbed">UV Flatbed</option>
                  <option value="Sublimation">Sublimation</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Location / Department</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g. Digital Printing Room 1"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Financial & Costing */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1">
              Financial & Depreciation Metrics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Asset Value / Price (LAK)</label>
                <input
                  type="number"
                  value={formData.purchaseCost || 0}
                  onChange={(e) => handleChange('purchaseCost', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Target Lifetime Pages</label>
                <input
                  type="number"
                  value={formData.printedPagesCapacity || 1000000}
                  onChange={(e) => handleChange('printedPagesCapacity', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Maint. Cost / Page (LAK)</label>
                <input
                  type="number"
                  value={formData.maintenanceCostPerPage || 0}
                  onChange={(e) => handleChange('maintenanceCostPerPage', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Network & Photo */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1">
              Connectivity & Photo
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">IP Address</label>
                <input
                  type="text"
                  value={formData.ipAddress || ''}
                  onChange={(e) => handleChange('ipAddress', e.target.value)}
                  placeholder="192.168.1.100"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">MAC Address</label>
                <input
                  type="text"
                  value={formData.macAddress || ''}
                  onChange={(e) => handleChange('macAddress', e.target.value)}
                  placeholder="00:11:22:33:44:55"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Machine Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                />
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="mt-2 h-20 object-contain rounded-xl border border-slate-200 bg-slate-50 p-1"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-sky-600/20 active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
