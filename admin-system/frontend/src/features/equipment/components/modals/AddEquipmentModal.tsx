import React, { useState } from 'react';
import { X, Settings, Printer, Scissors, Layers, BookOpen, Camera, Link as LinkIcon } from 'lucide-react';
import { useApp } from '@store/AppContext';

export default function AddEquipmentModal({ isOpen, onClose }) {
  const { inventory, addEquipment, showToast } = useApp();
  
  const [name, setName] = useState('Epson EcoTank L15150');
  const [category, setCategory] = useState('Printer'); // Printer, Cutter, Binder, Laminator
  const [purchaseCost, setPurchaseCost] = useState(15000000);
  const [lifespanYears, setLifespanYears] = useState(5);
  const [printedPagesCapacity, setPrintedPagesCapacity] = useState(500000);
  const [maintenanceCostPerPage, setMaintenanceCostPerPage] = useState(10);
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

  // Cutter / Post-Press Specific Parameters (Streamlined 4-Field Amortization Model)
  const [postPressSubtype, setPostPressSubtype] = useState('guillotine'); // guillotine, sticker_plotter, hole_drill, binder, folder, laminator
  const [estMonthlyVolume, setEstMonthlyVolume] = useState(50000);
  const [maintenanceRatePercent, setMaintenanceRatePercent] = useState(15);

  if (!isOpen) return null;

  // Image Upload File Handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
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

  // Streamlined Post-Press Machinery Amortization Calculation
  const totalMonths = (Number(lifespanYears) || 1) * 12;
  const monthlyDepr = totalMonths > 0 ? (Number(purchaseCost) / totalMonths) : 0;
  const baseCostPerUnit = (Number(estMonthlyVolume) || 1) > 0 ? (monthlyDepr / Number(estMonthlyVolume)) : 0;
  const netCostPerUnit = baseCostPerUnit * (1 + (Number(maintenanceRatePercent) || 0) / 100);

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
    } else {
      categoryParams = { 
        postPressSubtype,
        estMonthlyVolume: Number(estMonthlyVolume),
        maintenanceRatePercent: Number(maintenanceRatePercent),
        costPerConsumptionUnit: Math.round(netCostPerUnit * 100) / 100,
        calculatedCostPerPage: Math.round(netCostPerUnit * 100) / 100,
        costPerPage: Math.round(netCostPerUnit * 100) / 100
      };
    }

    addEquipment({
      name,
      category,
      imageUrl,
      purchaseCost: Number(purchaseCost),
      purchasePrice: Number(purchaseCost),
      MachinePrice: Number(purchaseCost),
      lifespanYears: Number(lifespanYears),
      estMonthlyVolume: Number(estMonthlyVolume),
      maintenanceRatePercent: Number(maintenanceRatePercent),
      printedPagesCapacity: Number(estMonthlyVolume) * totalMonths,
      TargetTotalPages: Number(estMonthlyVolume) * totalMonths,
      MaintenanceCostPerPage: category === 'Printer' ? Number(maintenanceCostPerPage) : (Math.round(netCostPerUnit * 100) / 100),
      maintenanceCostPerPage: category === 'Printer' ? Number(maintenanceCostPerPage) : (Math.round(netCostPerUnit * 100) / 100),
      ...categoryParams
    });

    showToast(`ລົງທະບຽນໂປຣໄຟລ໌ເຄື່ອງຈັກ "${name}" ສຳເລັດ!`, 'success');
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
              <h3 className="font-extrabold text-base text-slate-800 font-sans">ລົງທະບຽນໂປຣໄຟລ໌ເຄື່ອງຈັກ (Register Machine Profile)</h3>
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
            <label className="text-slate-600 uppercase block font-black">ຊື່ເຄື່ອງພິມ / ອຸປະກອນ (Machine Name) *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ເຊັ່ນ: Epson EcoTank L15150"
              className="w-full px-3.5 py-2.5 border rounded-xl focus:outline-none font-bold text-sm bg-white"
            />
          </div>

          {/* Machine Photo Upload */}
          <div className="space-y-1">
            <label className="text-slate-600 uppercase block font-black">ຮູບຖ່າຍເຄື່ອງພິມ (Machine Photo)</label>
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
            <label className="text-slate-600 uppercase block font-black">ປະເພດໝວດໝູ່ (Category Type) *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'Printer', label: 'ເຄື່ອງພິມ', icon: Printer },
                { id: 'Cutter', label: 'ເຄື່ອງຕັດ', icon: Scissors },
                { id: 'Laminator', label: 'ເຄື່ອງເຄືອບ', icon: Layers },
                { id: 'Binder', label: 'ເຄື່ອງເຂົ້າເລົ່ມ', icon: BookOpen }
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
                  <label className="text-slate-600 uppercase block text-[10px]">ຊະນິດໝຶກພິມ (Ink Type)</label>
                  <select
                    value={inkType}
                    onChange={(e) => setInkType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none bg-white text-xs font-bold"
                  >
                    <option value="Pigment">ໝຶກກັນນ້ຳ (Pigment Ink)</option>
                    <option value="Dye">ໝຶກທຳມະດາ (Dye Ink)</option>
                    <option value="Laser">ໝຶກຜົງ (Laser Toner)</option>
                  </select>
                </div>

                {/* Linked Inventory Ink SKU Dropdown */}
                <div className="space-y-1">
                  <label className="text-slate-600 uppercase block text-[10px]">ລີ້ງຮາຍການໝຶກຈາກຄັງ (Link Ink SKU)</label>
                  <select
                    value={linkedInkSku}
                    onChange={(e) => setLinkedInkSku(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none bg-white text-xs font-bold"
                  >
                    <option value="">-- ເລືອກຮາຍການໝຶກຈາກ Inventory --</option>
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
                  <span className="text-[11px] font-black text-slate-800 block">ໝຶກສີດຳ (Black Ink Technical Specs):</span>
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
                  <span className="text-[11px] font-black text-purple-800 block">ໝຶກຊຸດສີ (Color Set Technical Specs):</span>
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
          {/* DYNAMIC CONDITIONAL SECTION: POST-PRESS / CUTTER / PAPER MACHINERY */}
          {category !== 'Printer' && (
            <div className="p-4 bg-sky-50/60 border border-sky-100 rounded-2xl space-y-4 animate-fade-in">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 block border-b border-sky-200 pb-1.5 flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-sky-600" />
                <span>ຂໍ້ມູນເຄື່ອງຈັກແປຮູບกระดาษ (Post-Press & Paper Machinery Specs)</span>
              </span>

              {/* Subtype selector */}
              <div className="space-y-1">
                <label className="text-slate-600 uppercase block text-[10px]">ประเภทเครื่องแปรรูปกระดาษ (Subtype Selection)</label>
                <select
                  value={postPressSubtype}
                  onChange={(e) => setPostPressSubtype(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none bg-white text-xs font-bold font-sans"
                >
                  <option value="guillotine">✂️ เครื่องตัดกระดาษทั่วไป (Guillotine Cutter)</option>
                  <option value="sticker_plotter">🎯 เครื่องตัด/ไดคัทสติกเกอร์ (Sticker Plotter / Cutter)</option>
                  <option value="hole_drill">🔘 เครื่องเจาะรูกระดาษ/เจาะตาไก่ (Paper Hole Drill / Puncher)</option>
                  <option value="binder">📚 เครื่องเข้าเล่มกระดาษ (Perfect / Spiral Binder)</option>
                  <option value="folder">📄 เครื่องพับ/กดรอยพับ (Paper Folder / Creaser)</option>
                  <option value="laminator">✨ เครื่องเคลือบผิว/ฟิล์ม (Laminator / Coater)</option>
                </select>
              </div>

              {/* 4 Core Input Parameters Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 uppercase block text-[10px]">1. ราคาซื้อเครื่องจักร (Purchase Price LAK) *</label>
                  <input
                    type="number"
                    min="0"
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-sans font-bold text-xs bg-white"
                    placeholder="60000000"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 uppercase block text-[10px]">2. อายุการใช้งานเป้าหมาย (Lifespan Years) *</label>
                  <input
                    type="number"
                    min="1"
                    value={lifespanYears}
                    onChange={(e) => setLifespanYears(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-sans font-bold text-xs bg-white"
                    placeholder="5"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 uppercase block text-[10px]">3. ประมาณการผลิต (Est. Monthly Volume) *</label>
                  <input
                    type="number"
                    min="1"
                    value={estMonthlyVolume}
                    onChange={(e) => setEstMonthlyVolume(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-sans font-bold text-xs bg-white"
                    placeholder="50000"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 uppercase block text-[10px]">4. ค่าบำรุงรักษา & ใบมีด (% Maint. Rate) *</label>
                  <input
                    type="number"
                    min="0"
                    value={maintenanceRatePercent}
                    onChange={(e) => setMaintenanceRatePercent(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-sans font-bold text-xs bg-white"
                    placeholder="15"
                  />
                </div>
              </div>

              {/* Real-time Calculation Summary Card */}
              <div className="p-3.5 bg-sky-100/70 border border-sky-200 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between items-center text-sky-900 font-extrabold">
                  <span>สรุปต้นทุนต่อแผ่น/ครั้ง (Amortized Cost Breakdown):</span>
                  <span className="text-sm font-black text-sky-700 font-sans">
                    {(Math.round(netCostPerUnit * 100) / 100).toLocaleString()} LAK / Unit
                  </span>
                </div>
                <div className="text-[11px] text-sky-800 space-y-0.5 font-medium">
                  <p>• ค่าเสื่อมฐาน: {(Math.round(baseCostPerUnit * 100) / 100).toLocaleString()} LAK / แผ่น</p>
                  <p>• ค่าบำรุงรักษา & เปลี่ยนใบมีด (+{maintenanceRatePercent}%): +{(Math.round((netCostPerUnit - baseCostPerUnit) * 100) / 100).toLocaleString()} LAK / แผ่น</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border rounded-xl font-bold hover:bg-slate-50 transition"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-black shadow-md transition"
            >
              ລົງທະບຽນໂປຣໄຟລ໌ເຄື່ອງຈັກ (Add Machine Profile)
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
