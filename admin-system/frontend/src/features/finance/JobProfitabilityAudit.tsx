import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';

type JobProfitability = { job_id: string; job_name: string; customer_name: string; revenue: number; total_cost: number; gross_profit: number; profit_margin_percent: number };

export const JobProfitabilityAudit: React.FC = () => {
  const [rows, setRows] = useState<JobProfitability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/v1/finance/job-profitability');
      const body = await response.json();
      if (!response.ok || body?.status !== 'success' || !Array.isArray(body.data) || !body.data.every((row: JobProfitability) => row.job_id && ['revenue', 'total_cost', 'gross_profit', 'profit_margin_percent'].every(key => typeof row[key] === 'number' && Number.isFinite(row[key])))) throw new Error('ບໍ່ສາມາດໂຫຼດກຳໄລງານໄດ້');
      setRows(body.data); setError(null);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'ບໍ່ສາມາດໂຫຼດກຳໄລງານໄດ້'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  return <section className="bg-white rounded-3xl border p-6 space-y-4" aria-label="ກຳໄລງານພິມ">
    <h3 className="text-xl font-bold">ກຳໄລ ແລະ ຕົ້ນທຶນງານພິມ</h3>
    <button onClick={load} disabled={loading} className="px-4 py-2 rounded-xl border">ອັບເດດ</button>
    {loading ? <p role="status">ກຳລັງໂຫຼດ...</p> : error ? <p role="alert">{error}</p> : !rows.length ? <p>ຍັງບໍ່ມີຂໍ້ມູນກຳໄລງານ</p> : <div className="overflow-auto"><table className="w-full text-left">
      <thead><tr>{['ອໍເດີ', 'ລູກຄ້າ', 'ລາຍຮັບ (LAK)', 'ຕົ້ນທຶນ (LAK)', 'ກຳໄລຂັ້ນຕົ້ນ (LAK)', 'ອັດຕາກຳໄລ'].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.job_id} className="border-t"><td className="p-3">{row.job_id}</td><td>{row.customer_name}</td><td>{row.revenue.toLocaleString()}</td><td>{row.total_cost.toLocaleString()}</td><td>{row.gross_profit.toLocaleString()}</td><td>{row.profit_margin_percent.toFixed(2)}%</td></tr>)}</tbody>
    </table></div>}
  </section>;
};
