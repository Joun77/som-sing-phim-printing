import React, { useState } from 'react';
import { X, Settings, Printer, Scissors, Layers, BookOpen, Camera, Link as LinkIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AddEquipmentModal({ isOpen, onClose }) {
  const { inventory, addEquipment, showToast } = useApp();
  
  const [name, setName] = useState('Epson EcoTank L15150');
  const [category, setCategory] = useState('Printer'); // Printer, Cutter, Binder, Laminator
  const [purchaseCost, setPurchaseCost] = useState(15000000);
  const [lifespanYears, setLifespanYears] = useState(5);
  const [printedPagesCapacity, setPrintedPagesCapacity] = useState(500000);
  const [imageUrl, setImageUrl] = useState('');
  
  // Printer Specific Parameters (Epson L15150 Standards)
  const [speedPpm, setSpeedPpm] = useState(32);
  const [maxWidth, setMaxWidth] = useState('A3+');
  const [inkType, setInkType] = useState('Pigment'); // Pigment, Dye, Laser
  const [printTech, setPrintTech] = useState('Color'); // Color, Mono
  const [linkedInkSku, setLinkedInkSku] = useState('');

  // Ink Yield & Capacity Specs (ISO 5% Standard - Decoupled Technical Yield)
  const [blackYieldPages, setBlackYieldPages] = useState(7500);
  const [blackCapacityMl, setBlackCapacityMl] = useState(127);
  const [colorYieldPages, setColorYieldPages] = useState(6000);
  const [colorCapacityMl, setColorCapacityMl] = useState(210);

  // Click Rates (Optional counter fees)
  const [clickRateColor, setClickRateColor] = useState(500);
  const [clickRateBW, setClickRateBW] = useState(150);

  // Cutter Specific Parameters
  const [cutCapacity, setCutCapacity] = useState(500);
  const [bladeDepreciationPerCut, setBladeDepreciationPerCut] = useState(300);

  // Binder Specific Parameters
  const [bindingMethod, setBindingMethod] = useState('Perfect Glue'); // Perfect Glue, Spiral, Calendar, Staple
  const [maxBookSheets, setMaxBookSheets] = useState(300);
  const [avgTimePerBook, setAvgTimePerBook] = useState(5);
  const [depreciationPerJob, setDepreciationPerJob] = useState(2000);

  // Laminator Specific Parameters
  const [laminationWidth, setLaminationWidth] = useState('A3 (330mm)');
  const [speedMPerMin, setSpeedMPerMin] = useState(15);
  const [warmUpTime, setWarmUpTime] = useState(10);

  if (!isOpen) return null;

  // Image Upload File Handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Category change handler
  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    if (newCat === 'Printer' && !name.includes('Cutter') && !name.includes('Binder') && !name.includes('Laminator')) {
      setName('Epson EcoTank L15150');
    } else if (newCat === 'Cutter') {
      setName('EBA 5560 Electric Cutter');
    } else if (newCat === 'Binder') {
      setName('Horizon BQ-270 Perfect Binder');
    } else if (newCat === 'Laminator') {
      setName('GMP 355 Roll Laminator');
    }
  };

  // Auto Computations for Technical Rates (ml per sheet @ 5% ISO)
  const blackMlPerSheet = Number(blackYieldPages) > 0 ? (Number(blackCapacityMl) / Number(blackYieldPages)) : 0.0169;
  const colorMlPerSheet = Number(colorYieldPages) > 0 ? (Number(colorCapacityMl) / Number(colorYieldPages)) : 0.035;

  const handleSubmit = (e) => {
    e.preventDefault();

    let categoryParams = {};
    if (category === 'Printer') {
      categoryParams = { 
        speedPpm: Number(speedPpm), 
        maxWidth,
        inkType,
        printTech,
        linkedInkSku,
        blackYieldPages: Number(blackYieldPages),
        blackCapacityMl: Number(blackCapacityMl),
        colorYieldPages: Number(colorYieldPages),
        colorCapacityMl: Number(colorCapacityMl),
        blackMlPerSheet,
        colorMlPerSheet,
        inkConsumptionStandard: colorMlPerSheet || 0.035, // default ml/sheet @ 5% ISO
        clickRateColor: Number(clickRateColor || 500),
        clickRateBW: Number(clickRateBW || 150)
      };
    } else if (category === 'Cutter') {
      categoryParams = { 
        cutCapacity: Number(cutCapacity), 
        bladeDepreciationPerCut: Number(bladeDepreciationPerCut) 
      };
    } else if (category === 'Binder') {
      categoryParams = { 
        bindingMethod,
        maxBookSheets: Number(maxBookSheets),
        avgTimePerBook: Number(avgTimePerBook), 
        depreciationPerJob: Number(depreciationPerJob) 
      };
    } else if (category === 'Laminator') {
      categoryParams = { 
        laminationWidth,
        speedMPerMin: Number(speedMPerMin), 
        warmUpTime: Number(warmUpTime) 
      };
    }

    addEquipment({
      name,
      category,
      imageUrl,
      purchaseCost: Number(purchaseCost),
      lifespanYears: Number(lifespanYears),
      printedPagesCapacity: Number(printedPagesCapacity),
      ...categoryParams
    });

    showToast(`ลงทะเบียนโปรไฟล์เครื่องจิน "${name}" สำเร็จ!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-600" />
            <div>
              <h3 className="font-extrabold text-base text-slate-800 font-sans">ลงทะเบียนโปรไฟล์เครื่องจิน (Register Machine Profile)</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Decoupled Technical Ink Yield & Inventory Linking Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Wizard Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800 overflow-y-auto flex-1 text-xs font-bold">
          
          <div className="space-y-1">
            <label className="text-slate-600 uppercase block font-black">ชื่อเครื่องพิมพ์ / อุปกรณ์ (Machine Name) *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น: Epson EcoTank L15150"
              className="w-full px-3.5 py-2.5 border rounded-xl focus:outline-none font-bold text-sm bg-white"
            />
          </div>

          {/* Machine Photo Upload */}
          <div className="space-y-1">
            <label className="text-slate-600 uppercase block font-black">รูปถ่ายเครื่องพิมพ์ (Machine Photo)</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
              />
              {imageUrl && (
                <img src={imageUrl} alt="Preview" className="w-12 h-12 object-cover rounded-xl border border-slate-200" />
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-600 uppercase block font-black">ประเภทหมวดหมู่ (Category Type) *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'Printer', label: 'เครื่องพิมพ์', icon: Printer },
                { id: 'Cutter', label: 'เครื่องตัด', icon: Scissors },
                { id: 'Laminator', label: 'เครื่องเคลือบ', icon: Layers },
                { id: 'Binder', label: 'เครื่องเข้าเล่ม', icon: BookOpen }
              ].map(cat => {
                const IconComp = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`p-3 rounded-2xl border text-xs font-black transition flex flex-col items-center gap-1 ${
                      isSelected 
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DYNAMIC CONDITIONAL SECTION: CATEGORY = PRINTER */}
          {category === 'Printer' && (
            <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl space-y-4 animate-fade-in">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block border-b border-purple-200 pb-1.5 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-purple-600" />
                <span>Printer Technical Specs & Ink Yield Parameters (ISO 5% Standard)</span>
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 uppercase block text-[10px]">ชนิดหมึกพิมพ์ (Ink Type)</label>
                  <select
                    value={inkType}
                    onChange={(e) => setInkType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none bg-white text-xs font-bold"
                  >
                    <option value="Pigment">หมึกกันน้ำ (Pigment Ink)</option>
                    <option value="Dye">หมึกธรรมดา (Dye Ink)</option>
                    <option value="Laser">หมึกผง (Laser Toner)</option>
                  </select>
                </div>

                {/* Linked Inventory Ink SKU Dropdown */}
                <div className="space-y-1">
                  <label className="text-slate-600 uppercase block text-[10px]">ลิงก์รายการหมึกจากคลัง (Link Ink SKU)</label>
                  <select
                    value={linkedInkSku}
                    onChange={(e) => setLinkedInkSku(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none bg-white text-xs font-bold"
                  >
                    <option value="">-- เลือกรายการหมึกจาก Inventory --</option>
                    {inventory && inventory.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Yield & Bottle Capacity Specs (Technical Only) */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-purple-200/60">
                <div className="space-y-2">
                  <span className="text-[11px] font-black text-slate-800 block">หมึกสีดำ (Black Ink Technical Specs):</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 uppercase block">Yield (Pages)</label>
                      <input
                        type="number"
                        value={blackYieldPages}
                        onChange={(e) => setBlackYieldPages(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border rounded-lg font-mono text-center font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 uppercase block">Bottle (ml)</label>
                      <input
                        type="number"
                        value={blackCapacityMl}
                        onChange={(e) => setBlackCapacityMl(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border rounded-lg font-mono text-center font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-black text-purple-800 block">หมึกชุดสี (Color Set Technical Specs):</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 uppercase block">Yield (Pages)</label>
                      <input
                        type="number"
                        value={colorYieldPages}
                        onChange={(e) => setColorYieldPages(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border rounded-lg font-mono text-center font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 uppercase block">Total (ml)</label>
                      <input
                        type="number"
                        value={colorCapacityMl}
                        onChange={(e) => setColorCapacityMl(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border rounded-lg font-mono text-center font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Computed Output Rates Banner (Pure Technical Rates) */}
              <div className="bg-white p-3.5 rounded-xl border border-purple-200 space-y-1 text-[10px] text-purple-900 font-mono">
                <div className="flex justify-between items-center">
                  <span>Black Technical Rate @ 5% ISO:</span>
                  <span className="font-black">{blackMlPerSheet.toFixed(4)} ml / sheet</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Color Technical Rate @ 5% ISO:</span>
                  <span className="font-black">{colorMlPerSheet.toFixed(4)} ml / sheet</span>
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC CONDITIONAL SECTION: CATEGORY = CUTTER */}
          {category === 'Cutter' && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-3 animate-fade-in">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block border-b border-emerald-200 pb-1.5 flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-emerald-600" />
                <span>Cutter Machine Specifications</span>
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 uppercase block text-[10px]">จำนวนแผ่นตัดสูงสุด/ครั้ง (Max Sheet Pass Capacity)</label>
                  <input
                    type="number"
                    value={cutCapacity}
                    onChange={(e) => setCutCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-sans text-center font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 uppercase block text-[10px]">ค่าเสื่อมใบมีดต่อการตัด (Blade Wear / Cut LAK)</label>
                  <input
                    type="number"
                    value={bladeDepreciationPerCut}
                    onChange={(e) => setBladeDepreciationPerCut(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-sans text-center font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC CONDITIONAL SECTION: CATEGORY = LAMINATOR */}
          {category === 'Laminator' && (
            <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl space-y-3 animate-fade-in">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block border-b border-amber-200 pb-1.5 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>Laminator Specifications</span>
              </span>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 uppercase block text-[9px]">ขนาดกว้างสูงสุด (Max Width)</label>
                  <input
                    type="text"
                    value={laminationWidth}
                    onChange={(e) => setLaminationWidth(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-sans text-center font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 uppercase block text-[9px]">เวลาอุ่นเครื่อง (Warm-up mins)</label>
                  <input
                    type="number"
                    value={warmUpTime}
                    onChange={(e) => setWarmUpTime(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-sans text-center font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 uppercase block text-[9px]">ความเร็ว (Speed m/min)</label>
                  <input
                    type="number"
                    value={speedMPerMin}
                    onChange={(e) => setSpeedMPerMin(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-sans text-center font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC CONDITIONAL SECTION: CATEGORY = BINDER */}
          {category === 'Binder' && (
            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-3 animate-fade-in">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block border-b border-indigo-200 pb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Binder Machine Specifications</span>
              </span>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 uppercase block text-[9px]">รูปแบบการเข้าเล่ม (Method)</label>
                  <select
                    value={bindingMethod}
                    onChange={(e) => setBindingMethod(e.target.value)}
                    className="w-full px-2 py-2 border rounded-xl bg-white text-xs font-bold"
                  >
                    <option value="Perfect Glue">สันกาวร้อน (Perfect Glue)</option>
                    <option value="Spiral">สันห่วง (Spiral)</option>
                    <option value="Calendar">สันปฏิทิน (Calendar)</option>
                    <option value="Staple">มุงหลังคา (Staple)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 uppercase block text-[9px]">ความจุสูงสุด (Max Sheets/Book)</label>
                  <input
                    type="number"
                    value={maxBookSheets}
                    onChange={(e) => setMaxBookSheets(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-sans text-center font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 uppercase block text-[9px]">เวลาเฉลี่ย/เล่ม (Mins/Book)</label>
                  <input
                    type="number"
                    value={avgTimePerBook}
                    onChange={(e) => setAvgTimePerBook(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-sans text-center font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Standard Financial & Lifespan parameters */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-slate-500 uppercase block text-[10px]">Purchase Cost (LAK)</label>
              <input
                type="number"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl focus:outline-none font-sans font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 uppercase block text-[10px]">Lifespan Years</label>
              <input
                type="number"
                value={lifespanYears}
                onChange={(e) => setLifespanYears(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl focus:outline-none font-sans font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 uppercase block text-[10px]">Lifetime Capacity</label>
              <input
                type="number"
                value={printedPagesCapacity}
                onChange={(e) => setPrintedPagesCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl focus:outline-none font-sans font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border rounded-xl font-bold hover:bg-slate-50 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-black shadow-md transition"
            >
              ลงทะเบียนโปรไฟล์เครื่องจิน (Add Machine Profile)
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
