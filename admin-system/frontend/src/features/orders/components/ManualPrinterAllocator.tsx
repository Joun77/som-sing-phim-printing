import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { PrinterAllocation } from '../types';

interface AvailablePrinter {
  id: string;
  name: string;
  cost_per_page: number;
}

interface Props {
  targetQuantity: number;
  allocations: PrinterAllocation[];
  availablePrinters: AvailablePrinter[];
  onAllocationsChange: (newAllocations: PrinterAllocation[]) => void;
}

export const ManualPrinterAllocator: React.FC<Props> = ({
  targetQuantity,
  allocations,
  availablePrinters,
  onAllocationsChange,
}) => {
  const { t } = useTranslation();

  const totalAllocated = allocations.reduce((sum, a) => sum + (a.allocated_pages || 0), 0);
  const remainingPages = targetQuantity - totalAllocated;
  const isComplete = remainingPages === 0 && targetQuantity > 0;

  const handleAddPrinter = (printerId: string) => {
    const printer = availablePrinters.find((p) => p.id === printerId);
    if (!printer || allocations.some((a) => a.printer_id === printerId)) return;

    const remainingToAssign = Math.max(0, remainingPages);

    onAllocationsChange([
      ...allocations,
      {
        printer_id: printer.id,
        printer_name: printer.name,
        allocated_pages: allocations.length === 0 ? targetQuantity : remainingToAssign,
        cost_per_page: printer.cost_per_page || 0,
        subtotal_cost: (allocations.length === 0 ? targetQuantity : remainingToAssign) * (printer.cost_per_page || 0),
      },
    ]);
  };

  const handlePageChange = (printerId: string, pages: number) => {
    const validPages = Math.max(0, pages || 0);
    const updated = allocations.map((a) => {
      if (a.printer_id === printerId) {
        return {
          ...a,
          allocated_pages: validPages,
          subtotal_cost: validPages * a.cost_per_page,
        };
      }
      return a;
    });
    onAllocationsChange(updated);
  };

  const handleRemovePrinter = (printerId: string) => {
    onAllocationsChange(allocations.filter((a) => a.printer_id !== printerId));
  };

  const unassignedPrinters = availablePrinters.filter(
    (p) => !allocations.some((a) => a.printer_id === p.id)
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
      <div className="flex justify-between items-center pb-3 border-b border-gray-100">
        <div>
          <h4 className="font-semibold text-gray-800 text-sm">
            {t('orders.printerAllocation', 'ການແບ່ງເຄື່ອງພິມ')}
          </h4>
          <p className="text-xs text-gray-500">
            {t('orders.printerAllocationSubtitle', 'ກຳນົດຈຳນວນແຜ່ນທີ່ຕ້ອງການພິມໃນແຕ່ລະເຄື່ອງ')}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400 block">
            {t('orders.remainingQuota', 'ຄົງເຫຼືອ')}
          </span>
          <span
            className={`text-sm font-bold ${
              isComplete
                ? 'text-green-600'
                : remainingPages < 0
                ? 'text-red-600'
                : 'text-amber-600'
            }`}
          >
            {remainingPages.toLocaleString()} / {targetQuantity.toLocaleString()}
          </span>
        </div>
      </div>

      {allocations.length === 0 ? (
        <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <p className="text-xs text-gray-500">
            {t('orders.noPrinterSelected', 'ຍັງບໍ່ໄດ້ເລືອກເຄື່ອງພິມ')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {allocations.map((item) => (
            <div
              key={item.printer_id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{item.printer_name}</p>
                <p className="text-xs text-gray-500">
                  {item.cost_per_page.toLocaleString()} LAK / page
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  value={item.allocated_pages || ''}
                  onChange={(e) =>
                    handlePageChange(item.printer_id, parseInt(e.target.value, 10))
                  }
                  className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-right font-medium text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePrinter(item.printer_id)}
                  className="text-red-400 hover:text-red-600 text-xs px-2 py-1"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {unassignedPrinters.length > 0 && (
        <select
          onChange={(e) => {
            if (e.target.value) handleAddPrinter(e.target.value);
            e.target.value = '';
          }}
          className="w-full text-xs py-2 px-3 border border-dashed border-gray-300 rounded-lg text-gray-600 bg-gray-50 hover:bg-gray-100 cursor-pointer"
          defaultValue=""
        >
          <option value="" disabled>
            + {t('orders.addPrinter', 'ເພີ່ມເຄື່ອງພິມອີກເຄື່ອງ...')}
          </option>
          {unassignedPrinters.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.cost_per_page ? p.cost_per_page.toLocaleString() : 0} LAK/page)
            </option>
          ))}
        </select>
      )}


      {!isComplete && targetQuantity > 0 && (
        <p className="text-xs font-medium text-amber-600 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          {remainingPages > 0
            ? t('orders.unallocatedWarning', `ຍັງເຫຼືອ ${remainingPages.toLocaleString()} ແຜ່ນ ທີ່ຍັງບໍ່ໄດ້ແບ່ງເຄື່ອງພິມ`)
            : t('orders.overallocatedWarning', `ຈຳນວນທີ່ແບ່ງເກີນເປົ້າໝາຍຢູ່ ${Math.abs(remainingPages).toLocaleString()} ແຜ່ນ`)}
        </p>
      )}
    </div>
  );
};

export default ManualPrinterAllocator;
