import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Settings, 
  CheckCircle, 
  ShieldAlert, 
  Wrench, 
  Edit3, 
  Printer, 
  Scissors, 
  Layers, 
  BookOpen, 
  Zap, 
  Package, 
  Clock, 
  DollarSign, 
  Camera, 
  X, 
  Check,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function EquipmentDetailsPage({ equipmentId, onBack }) {
  const { equipment, inventory, updateEquipmentMaintenance, setEquipment, showToast } = useApp();
  
  const machine = equipment ? equipment.find(eq => eq.id === equipmentId) : null;
  const linkedInkItem = (machine && machine.linkedInkSku && inventory) 
    ? inventory.find(i => i.id === machine.linkedInkSku) 
    : null;

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(machine?.name || '');
  const [editPurchaseCost, setEditPurchaseCost] = useState(machine?.purchaseCost || 0);
  const [editLifespanYears, setEditLifespanYears] = useState(machine?.lifespanYears || 5);
  const [editPrintedCapacity, setEditPrintedCapacity] = useState(machine?.printedPagesCapacity || 500000);
  const [editInkSku, setEditInkSku] = useState(machine?.linkedInkSku || '');
  const [editImageUrl, setEditImageUrl] = useState(machine?.imageUrl || '');

  if (!machine) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
        <p className="text-slate-500 font-bold">ບໍ່ພົບຂໍ້ມູນໂປຣໄຟລ໌ເຄື່ອງພິມ (Machine Profile Not Found)</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold"
        >
          ກັບຄືນຮາຍການເຄື່ອງພິມ
        </button>
      </div>
    );
  }

  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num || 0).replace('LAK', '₭');
  };

  const isCritical = machine.components && machine.components.some(c => c.usage >= (c.threshold || 90));

  const handleMaintenanceReset = () => {
    updateEquipmentMaintenance(machine.id);
    showToast(`ຣີເຊັດຄ່າເສື່ອມ ແລະ ບຳລຸງຮັກສາເຄື່ອງ "${machine.name}" ສຳເລັດ!`, 'success');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!setEquipment) return;

    setEquipment(prev => prev.map(eq => {
      if (eq.id === machine.id) {
        return {
          ...eq,
          name: editName,
          purchaseCost: Number(editPurchaseCost),
          lifespanYears: Number(editLifespanYears),
          printedPagesCapacity: Number(editPrintedCapacity),
          linkedInkSku: editInkSku,
          imageUrl: editImageUrl
        };
      }
      return eq;
    }));

    setIsEditing(false);
    showToast(`ອັບເດດໂປຣໄຟລ໌ເຄື່ອງພິມ "${editName}" ສຳເລັດ!`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 font-sans pb-12">
      {/* Top Header Card */}
      <div className="flex items-center justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-200 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 bg-slate-100 rounded-2xl border border-slate-200 active:scale-95 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ກັບໜ້າຈັດຮາຍການເຄື່ອງພິມ (Back to Directory)</span>
        </button>
      </div>

      {/* Main Machine Banner Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Machine Image Display */}
        <div className="md:col-span-4 flex flex-col items-center justify-center">
          {machine.imageUrl || machine.itemPhoto ? (
            <img 
              src={machine.imageUrl || machine.itemPhoto} 
              alt={machine.name} 
              className="w-full h-56 object-contain rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-inner"
            />
          ) : (
            <div className="w-full h-56 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Printer className="w-12 h-12 text-slate-300" />
              <span className="text-xs font-bold">ບໍ່ມີຮູບຖ່າຍເຄື່ອງພິມ (No Image)</span>
            </div>
          )}
        </div>

        {/* Machine Details Overview */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-slate-100 text-slate-700 font-mono font-black text-xs rounded-full border border-slate-200 uppercase">
              {machine.category}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
              isCritical 
                ? 'text-red-600 bg-red-50 border-red-200 animate-pulse' 
                : 'text-emerald-700 bg-emerald-50 border-emerald-200'
            }`}>
              {isCritical ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              <span>{isCritical ? 'Service Required' : 'Operational (ພ້ອມໃຊ້ງານ)'}</span>
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {machine.name}
            </h2>
            <p className="text-xs font-mono font-bold text-slate-400 mt-1 uppercase">
              SKU / Asset ID: {machine.id}
            </p>
          </div>

          {/* Dynamic spec summary — renders only fields that have a value */}
          {(() => {
            const specMap = machine.category === 'Printer' ? [
              { label: 'ໜ້າກວ້າງສູງສຸດ', value: machine.maxWidth },
              { label: 'ຊະນິດໝຶກ', value: machine.inkType },
              { label: 'ເຕັກໂນໂລຊີພິມ', value: machine.printTech },
              { label: 'ອາຍຸໃຊ້ງານ', value: machine.lifespanYears ? `${machine.lifespanYears} ປີ` : null },
            ] : machine.category === 'Cutter' ? [
              { label: 'ຄວາມຈຸຕັດ', value: machine.cutCapacity ? `${machine.cutCapacity} ແຜ່ນ` : null },
              { label: 'ຄ່າເສື່ອມ/ຕັດ', value: machine.bladeDepreciationPerCut ? formatLAK(machine.bladeDepreciationPerCut) : null },
              { label: 'ອາຍຸໃຊ້ງານ', value: machine.lifespanYears ? `${machine.lifespanYears} ປີ` : null },
            ] : machine.category === 'Laminator' ? [
              { label: 'ຄວາມກວ້າງ', value: machine.laminationWidth },
              { label: 'ອາຍຸໃຊ້ງານ', value: machine.lifespanYears ? `${machine.lifespanYears} ປີ` : null },
            ] : machine.category === 'Binder' ? [
              { label: 'ວິທີເຂົ້າຫົວ', value: machine.bindingMethod },
              { label: 'ອາຍຸໃຊ້ງານ', value: machine.lifespanYears ? `${machine.lifespanYears} ປີ` : null },
            ] : [
              { label: 'ອາຍຸໃຊ້ງານ', value: machine.lifespanYears ? `${machine.lifespanYears} ປີ` : null },
            ];
            const filled = specMap.filter(s => s.value != null);
            if (!filled.length) return null;
            return (
              <div className={`grid gap-3 pt-2 grid-cols-2 sm:grid-cols-${Math.min(filled.length, 4)}`}>
                {filled.map((spec, i) => (
                  <div key={i} className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-black block">{spec.label}</span>
                    <span className="text-sm font-black text-slate-900">{spec.value}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Grid Section: Technical Ink Specs & Depreciation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Technical Ink Consumption Parameters (Decoupled Specs) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900">ອັດຕາການສິ້ນເປືອງໝຶກພິມ (Technical Ink Rates)</h4>
              <p className="text-[11px] text-slate-400 font-semibold">ISO 5% Standard Coverage Rates</p>
            </div>
          </div>

          <div className="space-y-3 text-xs font-bold text-slate-700">
            <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-slate-600">ອັດຕາໝຶກດຳ (Black Ink Rate @ 5%):</span>
              <span className="font-sans font-black text-purple-700 text-sm">
                {(machine.blackMlPerSheet || 0.0169).toFixed(4)} ml / ແຜ່ນ
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-slate-600">ອັດຕາໝຶກຊຸດສີ (Color Set Rate @ 5%):</span>
              <span className="font-sans font-black text-purple-700 text-sm">
                {(machine.colorMlPerSheet || machine.inkConsumptionStandard || 0.035).toFixed(4)} ml / ແຜ່ນ
              </span>
            </div>

            {/* Linked Inventory Ink Item */}
            <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-1">
              <span className="text-[10px] text-purple-700 uppercase font-black block">ຮາຍການໝຶກພິມທີ່ລີ້ງຈາກຄັງ (Linked Inventory Ink SKU):</span>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-bold text-slate-900">
                  {linkedInkItem ? `${linkedInkItem.name} (${linkedInkItem.id})` : (machine.linkedInkSku || 'ຍັງບໍ່ໄດ້ລີ້ງ SKU')}
                </span>
                {linkedInkItem && (
                  <span className="text-xs font-mono font-black text-emerald-600">
                    {formatLAK(linkedInkItem.costPerMl || linkedInkItem.costPerConsumptionUnit || 500)} / ml
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Asset Financials & Component SLA Health */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900">ສະຖານະອາໄຫຼ່ & ການເສື່ອມສະພາບ (SLA Component Wear)</h4>
              <p className="text-[11px] text-slate-400 font-semibold">Track wear percentages & component SLA thresholds</p>
            </div>
          </div>

          <div className="space-y-3">
            {machine.components && machine.components.length > 0 ? (
              machine.components.map((comp, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">{comp.name}</span>
                    <span className={comp.usage >= (comp.threshold || 90) ? 'text-red-600 font-black' : 'text-slate-600 font-sans'}>
                      {comp.usage}% / {comp.threshold || 90}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        comp.usage >= (comp.threshold || 90) ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, comp.usage)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 font-semibold">ບໍ່ມີຂໍ້ມູນສະຖານະຊິ້ນສ່ວນອາໄຫຼ່</p>
            )}
          </div>
        </div>
      </div>

      {/* Payment Slip Attachment Card */}
      {machine.paymentSlip && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-600" />
            ຫຼັກຖານການຈ່າຍເງິນ / ສະລິບ (Payment Slip)
          </h4>
          <div className="h-52 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center">
            <img src={machine.paymentSlip} alt="Payment Slip" className="w-full h-full object-contain rounded-lg" />
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-end gap-3">
        <button
          onClick={() => {
            if (setEquipment) {
              setEquipment(prev => prev.filter(eq => eq.id !== machine.id));
              showToast(`ລຶບຂໍ້ມູນເຄື່ອງພິມ "${machine.name}" ສຳເລັດ!`, 'info');
              onBack();
            }
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-2xl font-black text-xs transition active:scale-95"
        >
          <Trash2 className="w-4 h-4" />
          <span>ລຶບລາຍການ (Delete Machine)</span>
        </button>
        <button
          onClick={handleMaintenanceReset}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-sm transition active:scale-95"
        >
          <Wrench className="w-4 h-4" />
          <span>SLA Reset</span>
        </button>
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black text-xs shadow-sm transition active:scale-95"
        >
          <Edit3 className="w-4 h-4" />
          <span>ແກ້ໄຂຂໍ້ມູນ (Edit Profile)</span>
        </button>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-base text-slate-900">ແກ້ໄຂຂໍ້ມູນເຄື່ອງພິມ ({machine.name})</h3>
              <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-slate-600 block">ຊື່ເຄື່ອງພິມ (Machine Name)</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 block">ລີ້ງໝຶກພິມຈາກຄັງ (Link Ink SKU)</label>
                <select
                  value={editInkSku}
                  onChange={(e) => setEditInkSku(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-xs"
                >
                  <option value="">-- ເລືອກໝຶກພິມຈາກ Inventory --</option>
                  {inventory && inventory.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Upload Input */}
              <div className="space-y-1">
                <label className="text-slate-600 block">ຮູບຖ່າຍເຄື່ອງພິມ (Machine Photo)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                  />
                </div>
                {editImageUrl && (
                  <img src={editImageUrl} alt="Preview" className="w-16 h-16 object-cover rounded-xl border mt-2" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 block">ລາຄາຈັດຊື້ (LAK)</label>
                  <input
                    type="number"
                    value={editPurchaseCost}
                    onChange={(e) => setEditPurchaseCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 block">ອາຍຸໃຊ້ງານ (ປີ)</label>
                  <input
                    type="number"
                    value={editLifespanYears}
                    onChange={(e) => setEditLifespanYears(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-black shadow-md"
                >
                  ບັນທຶກຂໍ້ມູນ (Save Changes)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
