import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function PaperSpecForm({ formData, onChange }: { formData: any; onChange: (updated: any) => void }) {
  const { t } = useTranslation();

  const specs = formData.specs || {};
  const [paperFormat, setPaperFormat] = useState(formData.paper_format || formData.paperFormat || specs.paperFormat || 'Sheet');
  const [paperSize, setPaperSize] = useState(formData.standardSize || specs.standardSize || 'A4');
  const [sheetsPerReam, setSheetsPerReam] = useState(formData.sheets_per_ream || formData.sheets_per_pack || formData.sheetsPerPack || specs.sheets_per_ream || specs.sheets_per_pack || specs.sheetsPerPack || 500);
  const [rollWidthM, setRollWidthM] = useState(formData.rollWidthM || specs.rollWidthM || 1.07);
  const [rollLengthM, setRollLengthM] = useState(formData.rollLengthM || specs.rollLengthM || 50);
  const [grammageGsm, setGrammageGsm] = useState(formData.grammageGsm || specs.grammageGsm || 80);
  const [paperSurface, setPaperSurface] = useState(formData.paperSurface || specs.paperSurface || 'Glossy');

  const isSheet = paperFormat.toLowerCase() === 'sheet';

  const updateParent = (fields: any = {}) => {
    const currentFormat = fields.paperFormat || paperFormat;
    const currentIsSheet = currentFormat.toLowerCase() === 'sheet';
    const currentSheetsPerReam = fields.sheets_per_ream !== undefined ? fields.sheets_per_ream : sheetsPerReam;
    const currentRollWidth = fields.rollWidthM !== undefined ? fields.rollWidthM : rollWidthM;
    const currentRollLength = fields.rollLengthM !== undefined ? fields.rollLengthM : rollLengthM;

    onChange({
      paperFormat: currentFormat,
      paper_format: currentFormat.toLowerCase(),
      standardSize: currentIsSheet ? paperSize : undefined,
      sheets_per_ream: currentIsSheet ? Number(currentSheetsPerReam) : undefined,
      sheets_per_pack: currentIsSheet ? Number(currentSheetsPerReam) : undefined,
      sheetsPerPack: currentIsSheet ? Number(currentSheetsPerReam) : undefined,
      rollWidthM: !currentIsSheet ? Number(currentRollWidth) : undefined,
      rollLengthM: !currentIsSheet ? Number(currentRollLength) : undefined,
      grammageGsm: Number(grammageGsm),
      paperSurface,
      specs: {
        ...specs,
        paperFormat: currentFormat,
        paper_format: currentFormat.toLowerCase(),
        standardSize: currentIsSheet ? paperSize : undefined,
        sheets_per_ream: currentIsSheet ? Number(currentSheetsPerReam) : undefined,
        sheets_per_pack: currentIsSheet ? Number(currentSheetsPerReam) : undefined,
        sheetsPerPack: currentIsSheet ? Number(currentSheetsPerReam) : undefined,
        rollWidthM: !currentIsSheet ? Number(currentRollWidth) : undefined,
        rollLengthM: !currentIsSheet ? Number(currentRollLength) : undefined,
        grammageGsm: Number(grammageGsm),
        paperSurface,
      },
      ...fields
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-700">
      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Format</label>
        <select 
          value={paperFormat} 
          onChange={(e) => {
            const val = e.target.value;
            setPaperFormat(val);
            updateParent({ paperFormat: val, paper_format: val.toLowerCase() });
          }} 
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
        >
          <option value="Sheet">Sheet (แผ่น)</option>
          <option value="Roll">Roll (ม้วน)</option>
        </select>
      </div>

      {isSheet ? (
        <>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Standard Size</label>
            <select 
              value={paperSize} 
              onChange={(e) => {
                const val = e.target.value;
                setPaperSize(val);
                updateParent({ standardSize: val });
              }} 
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
            >
              {['A4', 'A3', 'A3+', 'A5', 'B5', 'SRA3', 'Custom Sheet'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
              {t('inbound.paper.sheets_per_pack')} *
            </label>
            <input 
              type="number" 
              min="1"
              placeholder={t('inbound.paper.sheets_per_ream_placeholder')}
              value={sheetsPerReam} 
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Number(e.target.value);
                setSheetsPerReam(val);
                updateParent({ sheets_per_ream: val, sheets_per_pack: val, sheetsPerPack: val });
              }} 
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-sky-500"
            />
            <p className="text-[10px] text-slate-400 font-normal mt-1">
              {t('inbound.paper.sheets_per_ream_helper')}
            </p>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
              {t('inbound.paper.roll_width')} (m) *
            </label>
            <input 
              type="number" 
              step="0.001" 
              placeholder={t('inbound.paper.roll_width_placeholder')}
              value={rollWidthM} 
              onChange={(e) => {
                const val = Number(e.target.value);
                setRollWidthM(val);
                updateParent({ rollWidthM: val });
              }} 
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
              {t('inbound.paper.roll_length')} (m) *
            </label>
            <input 
              type="number" 
              step="0.1" 
              placeholder={t('inbound.paper.roll_length_placeholder')}
              value={rollLengthM} 
              onChange={(e) => {
                const val = Number(e.target.value);
                setRollLengthM(val);
                updateParent({ rollLengthM: val });
              }} 
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <p className="text-[10px] text-slate-400 font-normal">
              {t('inbound.paper.roll_helper')}
            </p>
          </div>
        </>
      )}

      <div>
        <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">Grammage (GSM / grm)</label>
        <div className="relative">
          <input 
            type="number" 
            min="1"
            placeholder="e.g. 80, 130, 210, 300"
            value={grammageGsm || ''} 
            onChange={(e) => {
              const val = e.target.value === '' ? '' : Number(e.target.value);
              setGrammageGsm(val);
              updateParent({ grammageGsm: val });
            }} 
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-sky-500 pr-12"
          />
          <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">gsm</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Surface Finish</label>
        <select 
          value={paperSurface} 
          onChange={(e) => {
            const val = e.target.value;
            setPaperSurface(val);
            updateParent({ paperSurface: val });
          }} 
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
        >
          {['Glossy', 'Matte', 'Satin/Luster', 'Plain Paper', 'Canvas', 'Sticker/Vinyl'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}
