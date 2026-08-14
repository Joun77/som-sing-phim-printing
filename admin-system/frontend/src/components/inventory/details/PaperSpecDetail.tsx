import React from 'react';

export default function PaperSpecDetail({ item, currentLang }: { item: any; currentLang: string }) {
  const specs = item.specs || item.technical_specs || item || {};
  const isSheet = (specs.paperFormat || specs.paper_format || 'sheet').toLowerCase() === 'sheet';

  return (
    <div className="grid grid-cols-2 gap-4 text-xs font-medium">
      <div>
        <span className="text-slate-400 block text-[11px] font-semibold">
          {currentLang === 'lo' ? 'ຮູບແບບ (Paper Format):' : 'Paper Format:'}
        </span>
        <span className="text-slate-800 font-bold">{isSheet ? 'Sheet (แผ่น)' : 'Roll (ม้วน)'}</span>
      </div>

      {isSheet ? (
        <>
          {specs.standardSize && (
            <div>
              <span className="text-slate-400 block text-[11px] font-semibold">
                {currentLang === 'lo' ? 'ຂະໜາດມາດຕະຖານ (Standard Size):' : 'Standard Size:'}
              </span>
              <span className="text-slate-800 font-bold">{specs.standardSize}</span>
            </div>
          )}
          {(specs.sheets_per_pack || specs.sheets_per_ream || specs.sheetsPerPack) && (
            <div>
              <span className="text-slate-400 block text-[11px] font-semibold">
                {currentLang === 'lo' ? 'ຈຳນວນແຜ່ນຕໍ່ 1 ແພັກ (Sheets/Pack):' : 'Sheets per Pack:'}
              </span>
              <span className="text-sky-700 font-black">
                {specs.sheets_per_pack || specs.sheets_per_ream || specs.sheetsPerPack} {currentLang === 'lo' ? 'ແຜ່ນ' : 'sheets'}
              </span>
            </div>
          )}
        </>
      ) : (
        <>
          {specs.rollWidthM && (
            <div>
              <span className="text-slate-400 block text-[11px] font-semibold">
                {currentLang === 'lo' ? 'ຄວາມກວ້າງໜ້າເຈ້ຍມ້ວນ (Roll Width):' : 'Roll Width:'}
              </span>
              <span className="text-slate-800 font-bold">{specs.rollWidthM} m</span>
            </div>
          )}
          {specs.rollLengthM && (
            <div>
              <span className="text-slate-400 block text-[11px] font-semibold">
                {currentLang === 'lo' ? 'ຄວາມຍາວມ້ວນ (Roll Length):' : 'Roll Length:'}
              </span>
              <span className="text-slate-800 font-bold">{specs.rollLengthM} m</span>
            </div>
          )}
        </>
      )}

      {(specs.grammageGsm || specs.grammage) && (
        <div>
          <span className="text-slate-400 block text-[11px] font-semibold">
            {currentLang === 'lo' ? 'ຄວາມໜາ/ນ້ຳໜັກ (Grammage GSM):' : 'Grammage (GSM):'}
          </span>
          <span className="text-slate-800 font-bold">{specs.grammageGsm || specs.grammage} gsm</span>
        </div>
      )}

      {(specs.paperSurface || specs.surfaceFinish) && (
        <div>
          <span className="text-slate-400 block text-[11px] font-semibold">
            {currentLang === 'lo' ? 'ผิวสัมผัส (Surface Finish):' : 'Surface Finish:'}
          </span>
          <span className="text-slate-800 font-bold">{specs.paperSurface || specs.surfaceFinish}</span>
        </div>
      )}
    </div>
  );
}
