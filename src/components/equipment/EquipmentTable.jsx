import React from 'react';
import { ShieldAlert, CheckCircle, Wrench, Settings } from 'lucide-react';

export default function EquipmentTable({ machines, onMaintenance, onUpdateComponent }) {
  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num).replace('LAK', '₭');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-slate-800">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase text-slate-500 tracking-wider">
              <th className="py-4 px-6">Asset Name</th>
              <th className="py-4 px-6">Category</th>
              <th className="py-4 px-6">Linked Material SKU</th>
              <th className="py-4 px-6">Operational parameters</th>
              <th className="py-4 px-6">SLA Status</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-semibold">
            {machines.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400 font-bold">
                  No machinery registered. Click "+ Add Machine" to begin.
                </td>
              </tr>
            ) : (
              machines.map(eq => {
                // Status checks based on component wear
                const isCritical = eq.components && eq.components.some(c => c.usage >= (c.threshold || 90));
                
                // Categorized parameters summary
                let paramsSummary = '-';
                if (eq.category === 'Printer') {
                  paramsSummary = `${eq.speedPpm || 0} PPM / Max Width ${eq.maxWidth || 'A3'}`;
                } else if (eq.category === 'Cutter') {
                  paramsSummary = `Capacity: ${eq.cutCapacity || 0} sheets / Blade: ${eq.bladeDepreciationPerCut || 0}₭`;
                } else if (eq.category === 'Binder') {
                  paramsSummary = `Avg Time: ${eq.avgTimePerBook || 0}m / Job depr: ${formatLAK(eq.depreciationPerJob || 0)}`;
                } else if (eq.category === 'Laminator') {
                  paramsSummary = `Speed: ${eq.speedMPerMin || 0} m/min / Warm-up: ${eq.warmUpTime || 0}m`;
                }

                return (
                  <tr key={eq.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4.5 px-6">
                      <div>
                        <span className="font-extrabold text-slate-800 block leading-tight">{eq.name}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 block mt-1 uppercase">{eq.id}</span>
                      </div>
                    </td>
                    <td className="py-4.5 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-700 border">
                        {eq.category}
                      </span>
                    </td>
                    <td className="py-4.5 px-6">
                      {eq.linkedMaterialSku ? (
                        <span className="font-mono text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase font-bold">
                          {eq.linkedMaterialSku}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None linked</span>
                      )}
                    </td>
                    <td className="py-4.5 px-6 text-xs text-slate-500 font-semibold font-sans">
                      {paramsSummary}
                    </td>
                    <td className="py-4.5 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        isCritical 
                          ? 'text-red-600 bg-red-50 border-red-100 animate-pulse' 
                          : 'text-green-600 bg-green-50 border-green-100'
                      }`}>
                        {isCritical ? (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Service Required</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Operational</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4.5 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onMaintenance(eq.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 border hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl transition"
                          title="Schedule Maintenance"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>SLA Reset</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
