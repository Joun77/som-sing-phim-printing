import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Truck, 
  Package, 
  Printer, 
  Scissors, 
  Layers, 
  BookOpen, 
  Check, 
  Camera, 
  Zap, 
  Boxes, 
  Plus, 
  DollarSign, 
  CheckCircle2,
  Upload,
  X 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function InboundEntryPage({ onBack }) {
  const { inventory, equipment, addInventoryBatch, addEquipment, addPurchaseOrder, showToast } = useApp();

  // Top Category Selection: Category A (Materials & Supplies) vs Category B (Machinery & Equipment)
  const [inboundCategory, setInboundCategory] = useState('Materials'); // 'Materials' | 'Machinery'

  // Category A: Materials & Supplies States
  const [materialType, setMaterialType] = useState('Paper'); // Paper, Ink, Film, Chemical
  const [paperSpec, setPaperSpec] = useState('Inkjet Paper'); // Inkjet Paper, Laser Paper, Sticker Paper, Art Card Paper, Bond Paper
  const [materialName, setMaterialName] = useState('');
  const [supplierName, setSupplierName] = useState('Vientiane Supply Co.');
  const [supplierContact, setSupplierContact] = useState(''); // Optional Phone / Contact Link
  const [lotId, setLotId] = useState(`LOT-${Date.now().toString().slice(-6)}`);
  
  // File upload states
  const [itemPhoto, setItemPhoto] = useState(null);
  const [paymentSlip, setPaymentSlip] = useState(null);

  const handleFileUpload = (e, setter) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const [materialUnitCost, setMaterialUnitCost] = useState(120000);
  const [quantity, setQuantity] = useState(50);
  const [purchaseUnit, setPurchaseUnit] = useState('Ream');

  // Category B: Machinery & Equipment States
  const [machineName, setMachineName] = useState('Epson EcoTank L15150');
  const [machineCategory, setMachineCategory] = useState('Printer'); // Printer, Cutter, Laminator, Binder
  const [purchaseCost, setPurchaseCost] = useState(15000000);
  const [lifespanYears, setLifespanYears] = useState(5);
  const [lifetimeCapacity, setLifetimeCapacity] = useState(500000);
  const [imageUrl, setImageUrl] = useState('');

  // Printer Technical Spec Form States
  const [inkType, setInkType] = useState('Pigment');
  const [printTech, setPrintTech] = useState('Color');
  const [maxWidth, setMaxWidth] = useState('A3+');
  const [blackYieldPages, setBlackYieldPages] = useState(7500);
  const [blackCapacityMl, setBlackCapacityMl] = useState(127);
  const [colorYieldPages, setColorYieldPages] = useState(6000);
  const [colorCapacityMl, setColorCapacityMl] = useState(210);
  const [clickRateColor, setClickRateColor] = useState(500);
  const [clickRateBW, setClickRateBW] = useState(150);
  const [linkedInkSku, setLinkedInkSku] = useState('');

  // Cutter & Finishing Specific States
  const [cutCapacity, setCutCapacity] = useState(500);
  const [bladeDepreciationPerCut, setBladeDepreciationPerCut] = useState(300);
  const [laminationWidth, setLaminationWidth] = useState('A3 (330mm)');
  const [bindingMethod, setBindingMethod] = useState('Perfect Glue');

  // Image Upload Handler
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

  // Auto Computations for Printer Ink Rates
  const blackMlPerSheet = Number(blackYieldPages) > 0 ? (Number(blackCapacityMl) / Number(blackYieldPages)) : 0.0169;
  const colorMlPerSheet = Number(colorYieldPages) > 0 ? (Number(colorCapacityMl) / Number(colorYieldPages)) : 0.035;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (inboundCategory === 'Materials') {
      // Create new inventory batch
      if (!materialName.trim()) {
        showToast('ກະລຸນາລະບຸຊື່ວັດສະດຸທີ່ນຳເຂົ້າ', 'warning');
        return;
      }

      if (addInventoryBatch) {
        addInventoryBatch({
          id: lotId || `LOT-${Date.now()}`,
          name: materialName,
          category: materialType,
          supplierName,
          purchasePrice: Number(materialUnitCost),
          costPerSheet: Math.round(Number(materialUnitCost) / (purchaseUnit === 'Ream' ? 500 : 1)),
          initialQty: Number(quantity),
          currentQty: Number(quantity),
          purchaseDate: new Date().toISOString().split('T')[0]
        });
      }

      if (addPurchaseOrder) {
        addPurchaseOrder({
          id: `PO-${Date.now().toString().slice(-6)}`,
          poId: `PO-${Date.now().toString().slice(-6)}`,
          type: 'Material',
          categoryType: 'Materials',
          materialType,
          paperSpec: materialType === 'Paper' ? paperSpec : undefined,
          itemName: materialName,
          name: materialName,
          supplierName,
          supplierContact,
          unitPrice: Number(materialUnitCost),
          costPerUnit: Number(materialUnitCost),
          qty: Number(quantity),
          unitName: purchaseUnit || 'Units',
          totalCost: Number(materialUnitCost) * Number(quantity),
          totalPrice: Number(materialUnitCost) * Number(quantity),
          date: new Date().toISOString().split('T')[0],
          itemPhoto,
          paymentSlip
        });
      }

      showToast(`ບັນທຶກນຳເຂົ້າວັດສະດຸ "${materialName}" ສຳເລັດ!`, 'success');
    } else {
      // Create new Machinery Asset in Equipment Directory
      if (!machineName.trim()) {
        showToast('ກະລຸນາລະບຸຊື່ເຄື່ອງຈັກ', 'warning');
        return;
      }

      let categoryParams = {};
      if (machineCategory === 'Printer') {
        categoryParams = {
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
          inkConsumptionStandard: colorMlPerSheet || 0.035,
          clickRateColor: Number(clickRateColor || 500),
          clickRateBW: Number(clickRateBW || 150)
        };
      } else if (machineCategory === 'Cutter') {
        categoryParams = { cutCapacity: Number(cutCapacity), bladeDepreciationPerCut: Number(bladeDepreciationPerCut) };
      } else if (machineCategory === 'Laminator') {
        categoryParams = { laminationWidth };
      } else if (machineCategory === 'Binder') {
        categoryParams = { bindingMethod };
      }

      if (addEquipment) {
        addEquipment({
          name: machineName,
          category: machineCategory,
          imageUrl: itemPhoto || imageUrl,
          itemPhoto,
          paymentSlip,
          purchaseCost: Number(purchaseCost),
          lifespanYears: Number(lifespanYears),
          printedPagesCapacity: Number(lifetimeCapacity),
          supplierName,
          supplierContact,
          inkType,
          linkedInkSku,
          blackYieldPages: Number(blackYieldPages),
          blackCapacityMl: Number(blackCapacityMl),
          colorYieldPages: Number(colorYieldPages),
          colorCapacityMl: Number(colorCapacityMl),
          blackMlPerSheet,
          colorMlPerSheet,
          ...categoryParams
        });
      }

      if (addPurchaseOrder) {
        addPurchaseOrder({
          id: `PO-EQ-${Date.now().toString().slice(-6)}`,
          poId: `PO-EQ-${Date.now().toString().slice(-6)}`,
          type: 'Equipment',
          categoryType: 'Machinery',
          itemName: machineName,
          name: machineName,
          itemType: machineCategory,
          supplierName,
          supplierContact,
          unitPrice: Number(purchaseCost),
          costPerUnit: Number(purchaseCost),
          qty: 1,
          unitName: 'Unit',
          totalCost: Number(purchaseCost),
          totalPrice: Number(purchaseCost),
          date: new Date().toISOString().split('T')[0],
          itemPhoto,
          paymentSlip,
          inkType,
          linkedInkSku,
          blackYieldPages: Number(blackYieldPages),
          blackCapacityMl: Number(blackCapacityMl),
          colorYieldPages: Number(colorYieldPages),
          colorCapacityMl: Number(colorCapacityMl),
          blackMlPerSheet,
          colorMlPerSheet
        });
      }

      showToast(`ບັນທຶກນຳເຂົ້າເຄື່ອງຈັກ "${machineName}" ເຂົ້າຄັງອຸປະກອນສຳເລັດ!`, 'success');
    }

    onBack();
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12 text-slate-800 font-sans">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 bg-slate-100 rounded-2xl border border-slate-200 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ກັບໜ້າການນຳເຂົ້າ (Back to Inbound Procurement)</span>
          </button>
        </div>

        <div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-sky-600" />
            <span>ຟອມບັນທຶກນຳເຂົ້າສິນຄ້າ & ເຄື່ອງຈັກ (Inbound Entry Form)</span>
          </h3>
        </div>
      </div>

      {/* Main Inbound Category Selector (Category A vs Category B) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="space-y-2">
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
            ເລືອກປະເພດການນຳເຂົ້າ (Inbound Category Type) *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setInboundCategory('Materials')}
              className={`p-5 rounded-2xl border transition text-left flex items-start gap-4 ${
                inboundCategory === 'Materials'
                  ? 'bg-sky-50 border-sky-500 shadow-md ring-2 ring-sky-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="p-3 bg-sky-500 text-white rounded-xl shadow-sm">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <span className="font-black text-sm text-slate-900 block">
                  ໝວດ A: ວັດສະດຸ & ວັດສະດຸສິ້ນເປືອງ (Materials & Supplies)
                </span>
                <span className="text-xs text-slate-500 font-semibold mt-0.5 block">
                  ນຳເຂົ້າເຈ້ຍ, ໝຶກພິມ, ຟິມເຄືອບ, ເຄມີພັນ ສຳລັບຄັງສິນຄ້າ (Inventory Stock)
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setInboundCategory('Machinery')}
              className={`p-5 rounded-2xl border transition text-left flex items-start gap-4 ${
                inboundCategory === 'Machinery'
                  ? 'bg-purple-50 border-purple-500 shadow-md ring-2 ring-purple-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="p-3 bg-purple-600 text-white rounded-xl shadow-sm">
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <span className="font-black text-sm text-slate-900 block">
                  ໝວດ B: ເຄື່ອງຈັກ & ອຸປະກອນ (Machinery & Assets)
                </span>
                <span className="text-xs text-slate-500 font-semibold mt-0.5 block">
                  ນຳເຂົ້າເຄື່ອງພິມ, ເຄື່ອງຕັດ, ເຄື່ອງເຄືອບ, ເຄື່ອງເຂົ້າເລົ່ມ ເພື່ອບັນທຶກເຂົ້າ Equipment Directory
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Dynamic Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6 pt-4 border-t border-slate-100">
          {inboundCategory === 'Materials' ? (
            /* FORM CATEGORY A: MATERIALS & SUPPLIES */
            <div className="space-y-4 animate-fade-in text-xs font-bold">
              <div className="flex items-center gap-2 border-b pb-3">
                <Package className="w-5 h-5 text-sky-600" />
                <h4 className="font-black text-sm text-slate-900">ລາຍລະອຽດວັດສະດຸ (Materials & Consumables Entry)</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Material Category First */}
                <div className="space-y-1">
                  <label className="block text-slate-600">1. ໝວດວັດສະດຸ (Material Category)</label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-white font-bold text-xs focus:outline-none"
                  >
                    <option value="Paper">ເຈ້ຍ (Paper Stock)</option>
                    <option value="Ink">ໝຶກພິມ (Ink Bottles/Cartridges)</option>
                    <option value="Film">ຟິມເຄືອບ (Lamination Film)</option>
                    <option value="Chemical">ເຄມີພັນ (Chemicals & Consumables)</option>
                  </select>
                </div>

                {/* 2. Item Name Second */}
                <div className={`space-y-1 ${materialType === 'Paper' ? '' : 'sm:col-span-2'}`}>
                  <label className="block text-slate-600">2. ຊື່ລາຍການວັດສະດຸ (Material Item Name) *</label>
                  <input
                    type="text"
                    required
                    value={materialName}
                    onChange={(e) => setMaterialName(e.target.value)}
                    placeholder="ເຊັ່ນ: ເຈ້ຍ A4 Double A 80gsm, ໝຶກສີດຳ Konica C6085..."
                    className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-xs"
                  />
                </div>

                {/* 3. Paper Type Spec Third (For Paper Only) */}
                {materialType === 'Paper' && (
                  <div className="space-y-1">
                    <label className="block text-slate-600">3. ປະເພດເຈ້ຍ (Paper Type Spec)</label>
                    <select
                      value={paperSpec}
                      onChange={(e) => setPaperSpec(e.target.value)}
                      className="w-full px-3.5 py-2.5 border rounded-xl bg-white font-bold text-xs focus:outline-none"
                    >
                      <option value="Inkjet Paper">ເຈ້ຍອິງເຈັດ (Inkjet Paper)</option>
                      <option value="Laser Paper">ເຈ້ຍເລເຊີ (Laser Paper)</option>
                      <option value="Sticker Paper">ເຈ້ຍສະຕິກເກີ (Sticker Paper)</option>
                      <option value="Art Card Paper">ເຈ້ຍອາດກາດ / Art Card</option>
                      <option value="Bond Paper">ເຈ້ຍປອນ / Bond Paper</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Row 2: Financials & Supplier Details */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* 4. Unit Price */}
                <div className="space-y-1">
                  <label className="block text-slate-600">4. ລາຄາຊື້ຕໍ່ໜ່ວຍ (Unit Price LAK) *</label>
                  <input
                    type="number"
                    required
                    value={materialUnitCost}
                    onChange={(e) => setMaterialUnitCost(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border rounded-xl font-mono text-center font-bold bg-white text-xs"
                  />
                </div>

                {/* 5. Inbound Quantity */}
                <div className="space-y-1">
                  <label className="block text-slate-600">5. ຈຳນວນນຳເຂົ້າ (Inbound Qty) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border rounded-xl font-mono text-center font-bold bg-white text-xs"
                  />
                </div>

                {/* 6. Supplier Name */}
                <div className="space-y-1">
                  <label className="block text-slate-600">6. ຊື່ຜູ້ສະໜອງ (Supplier Name)</label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="ເຊັ່ນ: Vientiane Supply Co."
                    className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-xs"
                  />
                </div>

                {/* 7. Supplier Contact / Phone / Link (Optional) */}
                <div className="space-y-1">
                  <label className="block text-slate-600">7. ຊ່ອງທາງຕິດຕໍ່ / ເບີໂທ / ລີ້ງ (Optional)</label>
                  <input
                    type="text"
                    value={supplierContact}
                    onChange={(e) => setSupplierContact(e.target.value)}
                    placeholder="ເບີໂທ, WhatsApp ຫຼື Link..."
                    className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-xs"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* FORM CATEGORY B: MACHINERY & EQUIPMENT ASSETS */
            <div className="space-y-6 animate-fade-in text-xs font-bold">
              <div className="flex items-center gap-2 border-b pb-3">
                <Printer className="w-5 h-5 text-purple-600" />
                <h4 className="font-black text-sm text-slate-900">ລາຍລະອຽດເຄື່ອງຈັກ & ອຸປະກອນ (Machinery Asset Entry)</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-600">ໝວດເຄື່ອງຈັກ (Equipment Category)</label>
                  <select
                    value={machineCategory}
                    onChange={(e) => setMachineCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-white font-bold text-xs focus:outline-none"
                  >
                    <option value="Printer">ເຄື່ອງພິມ (Printing Machine)</option>
                    <option value="Cutter">ເຄື່ອງຕັດ (Cutting Machine)</option>
                    <option value="Laminator">ເຄື່ອງເຄືອບ (Laminating Machine)</option>
                    <option value="Binder">ເຄື່ອງເຂົ້າເລົ່ມ (Binding Machine)</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-slate-600">ຊື່ເຄື່ອງພິມ / ອຸປະກອນ (Machine Name) *</label>
                  <input
                    type="text"
                    required
                    value={machineName}
                    onChange={(e) => setMachineName(e.target.value)}
                    placeholder="ເຊັ່ນ: Epson EcoTank L15150, EBA 5560 Cutter..."
                    className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-xs"
                  />
                </div>
              </div>

              {/* Machinery Photo Upload Field */}
              <div className="space-y-1">
                <label className="block text-slate-600">ຮູບຖ່າຍເຄື່ອງພິມ / ອຸປະກອນ (Machine Photo)</label>
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

              {/* SPECIAL SUB-FORM: PRINTING MACHINE TECH SPECS */}
              {machineCategory === 'Printer' && (
                <div className="p-5 bg-purple-50/60 border border-purple-100 rounded-3xl space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block border-b border-purple-200 pb-2 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span>Printer Technical Specs & Ink Yield Parameters (ISO 5% Standard)</span>
                  </span>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-slate-600 text-[10px]">ຊະນິດໝຶກພິມ (Ink Type)</label>
                      <select
                        value={inkType}
                        onChange={(e) => setInkType(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white font-bold text-xs"
                      >
                        <option value="Pigment">ໝຶກກັນນ້ຳ (Pigment Ink)</option>
                        <option value="Dye">ໝຶກທຳມະດາ (Dye Ink)</option>
                        <option value="Laser">ໝຶກຜົງ (Laser Toner)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-600 text-[10px]">ລີ້ງຮາຍການໝຶກຈາກຄັງ (Link Ink SKU)</label>
                      <select
                        value={linkedInkSku}
                        onChange={(e) => setLinkedInkSku(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white font-bold text-xs"
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

                  {/* Yield & Capacity Inputs */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-purple-200/60">
                    <div className="space-y-2">
                      <span className="text-[11px] font-black text-slate-800 block">ໝຶກສີດຳ (Black Ink Technical Specs):</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 uppercase block">Yield (Pages)</label>
                          <input
                            type="number"
                            value={blackYieldPages}
                            onChange={(e) => setBlackYieldPages(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 border rounded-lg font-mono text-center font-bold bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 uppercase block">Bottle (ml)</label>
                          <input
                            type="number"
                            value={blackCapacityMl}
                            onChange={(e) => setBlackCapacityMl(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 border rounded-lg font-mono text-center font-bold bg-white"
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
                            className="w-full px-2.5 py-1.5 border rounded-lg font-mono text-center font-bold bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 uppercase block">Total (ml)</label>
                          <input
                            type="number"
                            value={colorCapacityMl}
                            onChange={(e) => setColorCapacityMl(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 border rounded-lg font-mono text-center font-bold bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-purple-200 space-y-1 text-[10px] text-purple-900 font-mono">
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

              {/* Asset Financials */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-600">ລາຄາຈັດຊື້ (Purchase Cost LAK)</label>
                  <input
                    type="number"
                    required
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border rounded-xl font-mono text-center font-bold bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-600">ອາຍຸການໃຊ້ງານ (Lifespan Years)</label>
                  <input
                    type="number"
                    required
                    value={lifespanYears}
                    onChange={(e) => setLifespanYears(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border rounded-xl font-mono text-center font-bold bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-600">ຄວາມຈຸແຜ່ນພິມລວມ (Lifetime Capacity)</label>
                  <input
                    type="number"
                    required
                    value={lifetimeCapacity}
                    onChange={(e) => setLifetimeCapacity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border rounded-xl font-mono text-center font-bold bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dual Image Uploads Section */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              ຮູບພາບ & ຫຼັກຖານການຈ່າຍເງິນ (Images & Attachments)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Item Photo Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-200 hover:border-sky-500 rounded-2xl p-4 transition bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
                {itemPhoto ? (
                  <div className="relative w-full h-32">
                    <img src={itemPhoto} alt="Item Preview" className="w-full h-full object-contain rounded-xl" />
                    <button
                      type="button"
                      onClick={() => setItemPhoto(null)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full shadow-sm hover:bg-red-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center w-full h-32 space-y-1">
                    <Upload className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">ຮູບພາບສິນຄ້າ (Item Photo)</span>
                    <span className="text-[10px] text-slate-400">Click to upload product image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setItemPhoto)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Payment Slip Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-200 hover:border-sky-500 rounded-2xl p-4 transition bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
                {paymentSlip ? (
                  <div className="relative w-full h-32">
                    <img src={paymentSlip} alt="Slip Preview" className="w-full h-full object-contain rounded-xl" />
                    <button
                      type="button"
                      onClick={() => setPaymentSlip(null)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full shadow-sm hover:bg-red-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center w-full h-32 space-y-1">
                    <Upload className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">ຫຼັກຖານການຈ່າຍເງິນ / ສະລິບ (Payment Slip)</span>
                    <span className="text-[10px] text-slate-400">Click to upload transaction slip</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setPaymentSlip)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-3 border rounded-2xl font-black text-xs hover:bg-slate-50 transition"
            >
              ຍົກເລີກ
            </button>

            <button
              type="submit"
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ຢືນຢັນບັນທຶກການນຳເຂົ້າ (Confirm Inbound Procurement)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
