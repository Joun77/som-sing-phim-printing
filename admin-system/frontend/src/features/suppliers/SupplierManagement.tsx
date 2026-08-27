import React, { useState } from 'react';
import { Building2, ShoppingBag, Scale } from 'lucide-react';
import { SupplierListPage } from './SupplierListPage';
import { POListPage } from './POListPage';
import { SupplierPriceCompare } from './SupplierPriceCompare';

export const SupplierManagement: React.FC = () => {
  const [tab, setTab] = useState<'suppliers' | 'pos' | 'compare'>('pos');

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Navigation Sub-tabs */}
      <div className="flex items-center gap-2 overflow-x-auto bg-white p-2.5 rounded-2xl border border-slate-100 shadow-xs">
        {[
          { id: 'pos', label: 'ໃບສັ່ງຊື້ວັດຖຸດິບ (Purchase Orders)', icon: ShoppingBag },
          { id: 'suppliers', label: 'ຈັດການຂໍ້ມູນຜູ້ສະໜອງ (Suppliers Master)', icon: Building2 },
          { id: 'compare', label: 'ປຽບທຽບລາຄາ (Price Comparison)', icon: Scale },
        ].map(item => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-primary-navy text-white shadow-md shadow-primary-navy/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === 'pos' && <POListPage />}
      {tab === 'suppliers' && <SupplierListPage />}
      {tab === 'compare' && <SupplierPriceCompare />}
    </div>
  );
};
