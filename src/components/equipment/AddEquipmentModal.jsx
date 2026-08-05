import React, { useState } from 'react';
import { X, Settings, Link as LinkIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AddEquipmentModal({ isOpen, onClose }) {
  const { inventory, addEquipment, showToast } = useApp();
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Printer'); // Printer, Cutter, Binder, Laminator
  const [purchaseCost, setPurchaseCost] = useState(15000000);
  const [lifespanYears, setLifespanYears] = useState(5);
  const [printedPagesCapacity, setPrintedPagesCapacity] = useState(500000);
  
  // Dynamic parameters states
  // Printing
  const [speedPpm, setSpeedPpm] = useState(65);
  const [maxWidth, setMaxWidth] = useState('A3');
  // Cutting
  const [cutCapacity, setCutCapacity] = useState(500);
  const [bladeDepreciationPerCut, setBladeDepreciationPerCut] = useState(300);
  // Binding
  const [avgTimePerBook, setAvgTimePerBook] = useState(5);
  const [depreciationPerJob, setDepreciationPerJob] = useState(2000);
  // Lamination
  const [speedMPerMin, setSpeedMPerMin] = useState(15);
  const [warmUpTime, setWarmUpTime] = useState(10);

  // Material Linkage
  const [linkedMaterialSku, setLinkedMaterialSku] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    let categoryParams = {};
    if (category === 'Printer') {
      categoryParams = { speedPpm: Number(speedPpm), maxWidth };
    } else if (category === 'Cutter') {
      categoryParams = { cutCapacity: Number(cutCapacity), bladeDepreciationPerCut: Number(bladeDepreciationPerCut) };
    } else if (category === 'Binder') {
      categoryParams = { avgTimePerBook: Number(avgTimePerBook), depreciationPerJob: Number(depreciationPerJob) };
    } else if (category === 'Laminator') {
      categoryParams = { speedMPerMin: Number(speedMPerMin), warmUpTime: Number(warmUpTime) };
    }

    addEquipment({
      name,
      category,
      purchaseCost: Number(purchaseCost),
      lifespanYears: Number(lifespanYears),
      printedPagesCapacity: Number(printedPagesCapacity),
      linkedMaterialSku,
      ...categoryParams
    });

    showToast('Machinery registered with linked material successfully!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-accent-sky" />
            <div>
              <h3 className="font-extrabold text-base text-slate-800 font-sans">Register Machine Profile</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Link assets to dynamic inventory materials</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Wizard Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800 overflow-y-auto flex-1 text-xs font-bold">
          
          <div className="space-y-1">
            <label className="text-slate-500 uppercase block">Machine / Equipment Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Epson L15150 Printer"
              className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-500 uppercase block">Category Type</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl focus:outline-none bg-white font-semibold text-sm"
              >
                <option value="Printer">Printing Machine</option>
                <option value="Cutter">Cutting Machine</option>
                <option value="Binder">Binding & Stitching Machine</option>
                <option value="Laminator">Lamination & Processing</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 uppercase block flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Link Material SKU</span>
              </label>
              <select
                value={linkedMaterialSku}
                onChange={(e) => setLinkedMaterialSku(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl focus:outline-none bg-white font-semibold text-sm font-sans"
              >
                <option value="">-- No Linked SKU --</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Configuration fields based on category selection */}
          <div className="p-4 bg-slate-50 border-2 rounded-2xl space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block border-b pb-1.5">
              Category parameters ({category})
            </span>
            
            {category === 'Printer' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase block">Print Speed (PPM)</label>
                  <input
                    type="number"
                    value={speedPpm}
                    onChange={(e) => setSpeedPpm(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase block">Max Media Width</label>
                  <select
                    value={maxWidth}
                    onChange={(e) => setMaxWidth(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none bg-white font-semibold"
                  >
                    <option value="A4">A4 (210mm)</option>
                    <option value="A3">A3 (297mm)</option>
                    <option value="A3+">A3+ (329mm)</option>
                    <option value="Custom Roll">Custom Roll</option>
                  </select>
                </div>
              </div>
            )}

            {category === 'Cutter' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase block">Capacity/Pass (sheets)</label>
                  <input
                    type="number"
                    value={cutCapacity}
                    onChange={(e) => setCutCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase block">Blade Depreciation per Cut (LAK)</label>
                  <input
                    type="number"
                    value={bladeDepreciationPerCut}
                    onChange={(e) => setBladeDepreciationPerCut(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none font-sans"
                  />
                </div>
              </div>
            )}

            {category === 'Binder' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase block">Avg Time/Book (minutes)</label>
                  <input
                    type="number"
                    value={avgTimePerBook}
                    onChange={(e) => setAvgTimePerBook(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase block">Job Depreciation Rate (LAK)</label>
                  <input
                    type="number"
                    value={depreciationPerJob}
                    onChange={(e) => setDepreciationPerJob(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none font-sans"
                  />
                </div>
              </div>
            )}

            {category === 'Laminator' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase block">Lamination Speed (m/min)</label>
                  <input
                    type="number"
                    value={speedMPerMin}
                    onChange={(e) => setSpeedMPerMin(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase block">Warm-up time overhead (mins)</label>
                  <input
                    type="number"
                    value={warmUpTime}
                    onChange={(e) => setWarmUpTime(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none font-sans"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Standard SLA financial parameters */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-slate-500 uppercase block">Purchase Cost (LAK)</label>
              <input
                type="number"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl focus:outline-none font-sans"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 uppercase block">Lifespan Years</label>
              <input
                type="number"
                value={lifespanYears}
                onChange={(e) => setLifespanYears(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl focus:outline-none font-sans"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 uppercase block">Lifetime Capacity</label>
              <input
                type="number"
                value={printedPagesCapacity}
                onChange={(e) => setPrintedPagesCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl focus:outline-none font-sans"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent-sky hover:bg-sky-600 text-white rounded-xl font-bold"
            >
              Add Equipment Profile
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
