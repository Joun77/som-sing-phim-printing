import React, { useState, useCallback } from 'react';

interface OrderTrackingSearchProps {
  onSearch: (trackingCode: string) => void;
  loading?: boolean;
  initialValue?: string;
}

const SAMPLE_CODES = ['SSP-2601-8890', 'SSP-2608-5421', 'TRK-99001', 'ORD-2026-001'];

export const OrderTrackingSearch: React.FC<OrderTrackingSearchProps> = ({
  onSearch,
  loading = false,
  initialValue = '',
}) => {
  const [inputVal, setInputVal] = useState<string>(initialValue);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSearchSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      const trimmed = inputVal.trim();
      if (!trimmed) {
        setValidationError('ກະລຸນາປ້ອນລະຫັດ Tracking Code ຫຼື ເລກທີອໍເດີ');
        return;
      }

      if (trimmed.length < 3) {
        setValidationError('ລະຫັດສັ້ນເກີນໄປ (ຢ່າງໜ້ອຍ 3 ຕົວອັກສອນ)');
        return;
      }

      setValidationError(null);
      onSearch(trimmed);
    },
    [inputVal, onSearch]
  );

  const handleQuickSampleClick = useCallback(
    (sample: string) => {
      setInputVal(sample);
      setValidationError(null);
      onSearch(sample);
    },
    [onSearch]
  );

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="flex items-center rounded-2xl bg-white p-2 shadow-lg border border-slate-200 focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-100 transition-all">
          <div className="pl-3 pr-2 text-slate-400">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="ປ້ອນລະຫັດ Tracking Code ເຊັ່ນ: SSP-2601-8890 ຫຼື ORD-001..."
            className="w-full text-sm font-medium text-slate-800 placeholder-slate-400 bg-transparent py-2.5 px-2 focus:outline-none"
            disabled={loading}
          />
          {inputVal && (
            <button
              type="button"
              onClick={() => {
                setInputVal('');
                setValidationError(null);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 mr-1"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 px-5 py-2.5 text-sm font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-slate-900" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>ກວດສອບ...</span>
              </>
            ) : (
              <span>ຕິດຕາມອໍເດີ</span>
            )}
          </button>
        </div>

        {validationError && (
          <p className="mt-2 text-xs font-medium text-red-500 pl-4">{validationError}</p>
        )}
      </form>

      {/* Quick sample chips */}
      <div className="flex items-center gap-2 mt-3 pl-2 flex-wrap text-xs text-slate-500">
        <span>ຕົວຢ່າງລະຫັດ:</span>
        {SAMPLE_CODES.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => handleQuickSampleClick(code)}
            className="font-mono bg-slate-100 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 transition-colors cursor-pointer"
          >
            {code}
          </button>
        ))}
      </div>
    </div>
  );
};
