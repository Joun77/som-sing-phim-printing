import React, { useState } from 'react';
import { ArrowLeft, Truck, Boxes, Printer } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import MaterialInboundForm from './forms/MaterialInboundForm';
import EquipmentInboundForm from './forms/EquipmentInboundForm';

export default function InboundEntryPage({ onBack }) {
  const { addInventorySku, addEquipment, addPurchaseOrder, showToast } = useApp();

  // Category Selector State: Category A ('Materials') vs Category B ('Machinery')
  const [inboundCategory, setInboundCategory] = useState('Materials');

  // Category A States
  const [materialType, setMaterialType] = useState('Paper');
  const [paperSpec, setPaperSpec] = useState('Inkjet Paper');
  const [materialName, setMaterialName] = useState('');
  const [supplierName, setSupplierName] = useState('Vientiane Supply Co.');
  const [supplierContact, setSupplierContact] = useState('');
  const [lotId] = useState(`LOT-${Date.now().toString().slice(-6)}`);
  const [materialUnitCost, setMaterialUnitCost] = useState(120000);
  const [quantity, setQuantity] = useState(50);
  const [purchaseUnit] = useState('Ream');

  // Shared Media Attachments
  const [itemPhoto, setItemPhoto] = useState(null);
  const [paymentSlip, setPaymentSlip] = useState(null);

  // Category B States
  const [machineName, setMachineName] = useState('Epson EcoTank L15150');
  const [machineCategory, setMachineCategory] = useState('Printer');
  const [purchaseCost, setPurchaseCost] = useState(15000000);
  const [lifespanYears, setLifespanYears] = useState(5);
  const [lifetimeCapacity, setLifetimeCapacity] = useState(500000);

  // Printer Tech Spec States
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

  // Cutter / Laminator / Binder States
  const [cutCapacity, setCutCapacity] = useState(500);
  const [bladeDepreciationPerCut, setBladeDepreciationPerCut] = useState(300);
  const [laminationWidth, setLaminationWidth] = useState('A3 (330mm)');
  const [bindingMethod, setBindingMethod] = useState('Perfect Glue');

  // File Upload Helper
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

  // Computations
  const blackMlPerSheet = Number(blackYieldPages) > 0 ? (Number(blackCapacityMl) / Number(blackYieldPages)) : 0.0169;
  const colorMlPerSheet = Number(colorYieldPages) > 0 ? (Number(colorCapacityMl) / Number(colorYieldPages)) : 0.035;

  const handleCategoryChange = (cat) => {
    setInboundCategory(cat);
    setItemPhoto(null);
    setPaymentSlip(null);
    setSupplierContact('');
  };

  const handleMachineCategoryChange = (cat) => {
    setMachineCategory(cat);
    setMaxWidth('A3+');
    setInkType('Pigment');
    setPrintTech('Color');
    setBlackYieldPages(7500);
    setBlackCapacityMl(127);
    setColorYieldPages(6000);
    setColorCapacityMl(210);
    setClickRateColor(500);
    setClickRateBW(150);
    setLinkedInkSku('');
    setCutCapacity(500);
    setBladeDepreciationPerCut(300);
    setLaminationWidth('A3 (330mm)');
    setBindingMethod('Perfect Glue');
  };

  const sanitizePayload = (obj) =>
    Object.fromEntries(
      Object.entries(obj).filter(([, v]) =>
        v !== undefined && v !== null && v !== '' && v !== 0
      )
    );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (inboundCategory === 'Materials') {
      if (!materialName.trim()) {
        showToast('ກະລຸນາລະບຸຊື່ວັດສະດຸທີ່ນຳເຂົ້າ', 'warning');
        return;
      }

      if (addInventorySku) {
        addInventorySku(sanitizePayload({
          id: lotId || `LOT-${Date.now()}`,
          name: materialName,
          category: materialType,
          paperSpec: materialType === 'Paper' ? paperSpec : undefined,
          supplierName,
          supplierContact: supplierContact || undefined,
          itemPhoto: itemPhoto || undefined,
          paymentSlip: paymentSlip || undefined,
          purchasePrice: Number(materialUnitCost),
          costPerSheet: Math.round(Number(materialUnitCost) / (purchaseUnit === 'Ream' ? 500 : 1)),
          costPerPurchaseUnit: Number(materialUnitCost),
          costPerConsumptionUnit: Math.round(Number(materialUnitCost) / (purchaseUnit === 'Ream' ? 500 : 1)),
          initialQty: Number(quantity),
          currentQty: Number(quantity),
          stockQty: Number(quantity),
          purchaseUnit,
          unitName: purchaseUnit,
          purchaseMultiplier: purchaseUnit === 'Ream' ? 500 : 1,
          reorderThreshold: 100,
          batches: [{
            id: `${lotId}-B1`,
            purchaseDate: new Date().toISOString().split('T')[0],
            supplierName,
            purchasePricePerReam: Number(materialUnitCost),
            costPerSheet: Math.round(Number(materialUnitCost) / (purchaseUnit === 'Ream' ? 500 : 1)),
            initialQty: Number(quantity),
            currentQty: Number(quantity)
          }],
          purchaseDate: new Date().toISOString().split('T')[0]
        }));
      }

      if (addPurchaseOrder) {
        addPurchaseOrder(sanitizePayload({
          id: `PO-${Date.now().toString().slice(-6)}`,
          poId: `PO-${Date.now().toString().slice(-6)}`,
          type: 'Material',
          categoryType: 'Materials',
          materialType,
          paperSpec: materialType === 'Paper' ? paperSpec : undefined,
          itemName: materialName,
          name: materialName,
          supplierName,
          supplierContact: supplierContact || undefined,
          unitPrice: Number(materialUnitCost),
          costPerUnit: Number(materialUnitCost),
          qty: Number(quantity),
          unitName: purchaseUnit || 'Units',
          totalCost: Number(materialUnitCost) * Number(quantity),
          totalPrice: Number(materialUnitCost) * Number(quantity),
          date: new Date().toISOString().split('T')[0],
          itemPhoto: itemPhoto || undefined,
          paymentSlip: paymentSlip || undefined
        }));
      }

      showToast(`ບັນທຶກນຳເຂົ້າວັດສະດຸ "${materialName}" ສຳເລັດ!`, 'success');
    } else {
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
        addEquipment(sanitizePayload({
          name: machineName,
          category: machineCategory,
          imageUrl: itemPhoto || undefined,
          itemPhoto: itemPhoto || undefined,
          paymentSlip: paymentSlip || undefined,
          purchaseCost: Number(purchaseCost),
          lifespanYears: Number(lifespanYears),
          printedPagesCapacity: Number(lifetimeCapacity),
          supplierName,
          supplierContact: supplierContact || undefined,
          ...categoryParams
        }));
      }

      if (addPurchaseOrder) {
        addPurchaseOrder(sanitizePayload({
          id: `PO-EQ-${Date.now().toString().slice(-6)}`,
          poId: `PO-EQ-${Date.now().toString().slice(-6)}`,
          type: 'Equipment',
          categoryType: 'Machinery',
          itemName: machineName,
          name: machineName,
          itemType: machineCategory,
          lifespanYears: Number(lifespanYears),
          lifetimeCapacity: Number(lifetimeCapacity),
          purchaseCost: Number(purchaseCost),
          supplierName,
          supplierContact: supplierContact || undefined,
          unitPrice: Number(purchaseCost),
          costPerUnit: Number(purchaseCost),
          qty: 1,
          unitName: 'Unit',
          totalCost: Number(purchaseCost),
          totalPrice: Number(purchaseCost),
          date: new Date().toISOString().split('T')[0],
          itemPhoto: itemPhoto || undefined,
          paymentSlip: paymentSlip || undefined,
          ...categoryParams
        }));
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
              onClick={() => handleCategoryChange('Materials')}
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
              onClick={() => handleCategoryChange('Machinery')}
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
            <MaterialInboundForm
              materialType={materialType}
              setMaterialType={setMaterialType}
              materialName={materialName}
              setMaterialName={setMaterialName}
              paperSpec={paperSpec}
              setPaperSpec={setPaperSpec}
              materialUnitCost={materialUnitCost}
              setMaterialUnitCost={setMaterialUnitCost}
              quantity={quantity}
              setQuantity={setQuantity}
              supplierName={supplierName}
              setSupplierName={setSupplierName}
              supplierContact={supplierContact}
              setSupplierContact={setSupplierContact}
              itemPhoto={itemPhoto}
              setItemPhoto={setItemPhoto}
              paymentSlip={paymentSlip}
              setPaymentSlip={setPaymentSlip}
              handleFileUpload={handleFileUpload}
            />
          ) : (
            <EquipmentInboundForm
              machineCategory={machineCategory}
              handleMachineCategoryChange={handleMachineCategoryChange}
              machineName={machineName}
              setMachineName={setMachineName}
              purchaseCost={purchaseCost}
              setPurchaseCost={setPurchaseCost}
              lifespanYears={lifespanYears}
              setLifespanYears={setLifespanYears}
              lifetimeCapacity={lifetimeCapacity}
              setLifetimeCapacity={setLifetimeCapacity}
              supplierName={supplierName}
              setSupplierName={setSupplierName}
              supplierContact={supplierContact}
              setSupplierContact={setSupplierContact}
              inkType={inkType}
              setInkType={setInkType}
              printTech={printTech}
              setPrintTech={setPrintTech}
              maxWidth={maxWidth}
              setMaxWidth={setMaxWidth}
              blackYieldPages={blackYieldPages}
              setBlackYieldPages={setBlackYieldPages}
              blackCapacityMl={blackCapacityMl}
              setBlackCapacityMl={setBlackCapacityMl}
              colorYieldPages={colorYieldPages}
              setColorYieldPages={setColorYieldPages}
              colorCapacityMl={colorCapacityMl}
              setColorCapacityMl={setColorCapacityMl}
              clickRateBW={clickRateBW}
              setClickRateBW={setClickRateBW}
              clickRateColor={clickRateColor}
              setClickRateColor={setClickRateColor}
              linkedInkSku={linkedInkSku}
              setLinkedInkSku={setLinkedInkSku}
              blackMlPerSheet={blackMlPerSheet}
              colorMlPerSheet={colorMlPerSheet}
              cutCapacity={cutCapacity}
              setCutCapacity={setCutCapacity}
              bladeDepreciationPerCut={bladeDepreciationPerCut}
              setBladeDepreciationPerCut={setBladeDepreciationPerCut}
              laminationWidth={laminationWidth}
              setLaminationWidth={setLaminationWidth}
              bindingMethod={bindingMethod}
              setBindingMethod={setBindingMethod}
              itemPhoto={itemPhoto}
              setItemPhoto={setItemPhoto}
              paymentSlip={paymentSlip}
              setPaymentSlip={setPaymentSlip}
              handleFileUpload={handleFileUpload}
            />
          )}

          {/* Form Action Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
            >
              ຍົກເລີກ (Cancel)
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-black text-xs shadow-md transition active:scale-95"
            >
              ບັນທຶກນຳເຂົ້າ ({inboundCategory === 'Materials' ? 'Save Material Stock' : 'Save Machinery Asset'})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
