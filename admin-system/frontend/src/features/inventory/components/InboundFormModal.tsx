import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, PackagePlus, RefreshCw, AlertCircle, CheckCircle2, DollarSign, Layers, Search, Zap } from 'lucide-react';
import { MaterialMaster, CreateInboundPayload } from '../types';
import { createInbound } from '../api/inventoryApi';

interface InboundFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  materials: MaterialMaster[];
}

export default function InboundFormModal({ isOpen, onClose, onSuccess, materials }: InboundFormModalProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search filter for existing material
  const [searchTerm, setSearchTerm] = useState('');

  // Form Fields
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [skuCode, setSkuCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('paper');
  const [supplierName, setSupplierName] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [lotBatchNumber, setLotBatchNumber] = useState('');
  const [inboundDate, setInboundDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantityReceived, setQuantityReceived] = useState<number | string>(1);
  const [purchaseUnit, setPurchaseUnit] = useState('รีม');
  const [purchaseMultiplier, setPurchaseMultiplier] = useState<number | string>(500);
  const [unitPurchasePrice, setUnitPurchasePrice] = useState<number | string>(0);
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
  const [origin, setOrigin] = useState('TH');
  const [tariffFee, setTariffFee] = useState<number | string>(0);
  const [freightFee, setFreightFee] = useState<number | string>(0);

  // Filtered materials for easy search
  const filteredMaterials = useMemo(() => {
    if (!searchTerm.trim()) return materials;
    const term = searchTerm.toLowerCase();
    return materials.filter(m => 
      (m.name && m.name.toLowerCase().includes(term)) ||
      (m.sku && m.sku.toLowerCase().includes(term)) ||
      (m.category && m.category.toLowerCase().includes(term))
    );
  }, [materials, searchTerm]);

  // Auto-fill when selecting an existing material
  useEffect(() => {
    if (mode === 'existing' && selectedMaterialId) {
      const selected = materials.find(m => m.id === selectedMaterialId || m.sku === selectedMaterialId);
      if (selected) {
        setSkuCode(selected.sku || selected.id);
        setItemName(selected.name);
        setCategory(selected.category || 'paper');
        setPurchaseUnit(selected.purchase_unit || 'รีม');
        setPurchaseMultiplier(selected.purchase_multiplier || 500);
        setUnitPurchasePrice(selected.cost_per_purchase_unit || 0);
      }
    } else if (mode === 'new') {
      setSelectedMaterialId('');
      setSkuCode(`MAT-${Date.now().toString().slice(-6)}`);
      setItemName('');
      setUnitPurchasePrice(0);
    }
  }, [mode, selectedMaterialId, materials]);

  // Initial selection if existing
  useEffect(() => {
    if (materials && materials.length > 0 && !selectedMaterialId && mode === 'existing') {
      setSelectedMaterialId(materials[0].id || materials[0].sku);
    }
  }, [materials, mode, selectedMaterialId]);

  if (!isOpen) return null;

  const numQty = parseFloat(String(quantityReceived)) || 0;
  const numPrice = parseFloat(String(unitPurchasePrice)) || 0;
  const numMult = parseFloat(String(purchaseMultiplier)) || 1;
  const numTariff = parseFloat(String(tariffFee)) || 0;
  const numFreight = parseFloat(String(freightFee)) || 0;

  const totalItemCost = numQty * numPrice;
  const grandTotal = totalItemCost + numTariff + numFreight;

  // Estimated Moving Average Cost Simulation
  const selectedMat = materials.find(m => m.id === selectedMaterialId || m.sku === selectedMaterialId);
  let estimatedNewUnitCost: number | null = null;
  if (selectedMat && mode === 'existing') {
    const currentStock = Number(selectedMat.stock_qty || 0);
    const currentCost = Number(selectedMat.cost_per_consumption_unit || 0);
    const mult = numMult > 0 ? numMult : 1;
    const incomingConsumptionQty = numQty * mult;
    const incomingConsumptionCost = numPrice / mult;

    if (currentStock <= 0) {
      estimatedNewUnitCost = incomingConsumptionCost;
    } else {
      const totalUnits = currentStock + incomingConsumptionQty;
      if (totalUnits > 0) {
        estimatedNewUnitCost = ((currentStock * currentCost) + (incomingConsumptionQty * incomingConsumptionCost)) / totalUnits;
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!skuCode.trim()) {
      setError('กรุณาระบุรหัสสินค้า (SKU)');
      return;
    }
    if (!itemName.trim()) {
      setError('กรุณาระบุชื่อสินค้า');
      return;
    }
    if (numQty <= 0) {
      setError('จำนวนรับเข้าต้องมากกว่า 0');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateInboundPayload = {
        material_id: mode === 'existing' ? selectedMaterialId : skuCode,
        sku_code: skuCode,
        item_name: itemName,
        category: category,
        supplier_name: supplierName,
        po_number: poNumber,
        inbound_date: inboundDate,
        quantity_received: numQty,
        purchase_unit: purchaseUnit,
        purchase_multiplier: numMult,
        unit_purchase_price: numPrice,
        total_price: grandTotal,
        payment_method: paymentMethod,
        origin: origin,
        tariff_fee: numTariff,
        freight_fee: numFreight,
      };

      await createInbound(payload);
      queryClient.invalidateQueries({ queryKey: ['inbound'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกการรับเข้า');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl">
              <PackagePlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">รับเข้าสินค้าสู่คลัง (Stock Inbound)</h3>
              <p className="text-xs text-blue-100 mt-0.5">ระบบคำนวณต้นทุนเฉลี่ยถ่วงน้ำหนัก (Moving Average Cost) อัตโนมัติ</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="px-6 pt-4 pb-2 bg-slate-50 border-b border-slate-200/60">
          <div className="grid grid-cols-2 gap-2 bg-slate-200/70 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                mode === 'existing'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              เติมสินค้าเดิม (Restock Existing)
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                mode === 'new'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PackagePlus className="w-4 h-4" />
              เพิ่มสินค้าใหม่ (New SKU)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode 1: Existing Item Selection with Quick Filter */}
          {mode === 'existing' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  เลือกสินค้าจากคลัง Master Stock <span className="text-rose-500">*</span>
                </label>
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="พิมพ์ค้นหาชื่อ/SKU..."
                    className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                <option value="">-- เลือกรหัส / ชื่อสินค้า --</option>
                {filteredMaterials.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.sku || m.id}] {m.name} ({m.category}) - คงเหลือ: {Number(m.stock_qty || 0).toLocaleString()} {m.consumption_unit}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sku & Item Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                รหัสสินค้า (SKU) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={skuCode}
                onChange={(e) => setSkuCode(e.target.value)}
                disabled={mode === 'existing'}
                className={`w-full px-4 py-2.5 rounded-2xl text-sm border ${
                  mode === 'existing'
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                }`}
                placeholder="e.g. PAP-ART-260-A3"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                ชื่อสินค้า <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                disabled={mode === 'existing'}
                className={`w-full px-4 py-2.5 rounded-2xl text-sm border ${
                  mode === 'existing'
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                }`}
                placeholder="e.g. กระดาษอาร์ตมัน 260g (A3+)"
                required
              />
            </div>
          </div>

          {/* Category & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">หมวดหมู่</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={mode === 'existing'}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="paper">กระดาษ (Paper)</option>
                <option value="ink">น้ำหมึก (Ink)</option>
                <option value="lamination">ฟิล์มเคลือบ (Lamination)</option>
                <option value="binding">อุปกรณ์เข้าเล่ม (Binding)</option>
                <option value="spare_parts">อะไหล่เครื่องพิมพ์ (Spare Parts)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">ผู้จัดจำหน่าย / ซัพพลายเออร์</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="e.g. SCG Packaging, Bangkok Ink"
              />
            </div>
          </div>

          {/* Inbound Date, PO & Lot Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">วันที่รับเข้า</label>
              <input
                type="date"
                value={inboundDate}
                onChange={(e) => setInboundDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">เลขที่ PO / บิลจัดซื้อ</label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="PO-2026-0801"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Lot / Batch Number</label>
              <input
                type="text"
                value={lotBatchNumber}
                onChange={(e) => setLotBatchNumber(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="LOT-202608-A"
              />
            </div>
          </div>

          {/* Quantity, Unit & Multiplier */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              หน่วยและการแปลงจำนวน (Multiplier)
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">จำนวนที่สั่งซื้อ</label>
                <input
                  type="number"
                  min="0.0001"
                  step="any"
                  value={quantityReceived}
                  onChange={(e) => setQuantityReceived(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">หน่วยซื้อ (Purchase Unit)</label>
                <input
                  type="text"
                  value={purchaseUnit}
                  onChange={(e) => setPurchaseUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="รีม, ลัง, ขวด"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">ตัวคูณ (Multiplier)</label>
                <input
                  type="number"
                  min="0.0001"
                  step="any"
                  value={purchaseMultiplier}
                  onChange={(e) => setPurchaseMultiplier(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="500 ແຜ່ນ/ຣີມ"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-blue-600 inline shrink-0" />
              <span>ແປງເປັນຫົວໜ່ວຍຕັດສະຕັອກຕົວຈິງ: <strong className="text-blue-700">{(numQty * numMult).toLocaleString()}</strong> ຫົວໜ່ວຍ</span>
            </p>
          </div>

          {/* Pricing & Moving Average Preview */}
          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-blue-600" />
              ລາຄາຈັດຊື້ & ການຄິດໄລ່ຕົ້ນທຶນ (Purchase Cost & Moving Average)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">ราคาซื้อต่อหน่วย (LAK / {purchaseUnit})</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={unitPurchasePrice}
                  onChange={(e) => setUnitPurchasePrice(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">ยอดรวมราคาสินค้า (LAK)</label>
                <input
                  type="text"
                  value={totalItemCost.toLocaleString() + ' LAK'}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Moving Average Simulation Notice */}
            {mode === 'existing' && selectedMat && estimatedNewUnitCost !== null && (
              <div className="pt-2 border-t border-blue-200/60 text-xs flex items-center justify-between text-blue-900">
                <span>ต้นทุนเดิม: <strong>{Number(selectedMat.cost_per_consumption_unit || 0).toFixed(2)} LAK</strong> / {selectedMat.consumption_unit}</span>
                <span className="font-bold text-emerald-700">
                  &rarr; ต้นทุนเฉลี่ยใหม่: {estimatedNewUnitCost.toFixed(2)} LAK / {selectedMat.consumption_unit}
                </span>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500">ยอดรวมทั้งสิ้น:</span>
            <span className="text-lg font-black text-slate-800 ml-2">{grandTotal.toLocaleString()} LAK</span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-2xl text-sm font-semibold transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  ยืนยันการรับเข้า
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
