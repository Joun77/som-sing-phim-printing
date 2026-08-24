import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { PricingCalculationRequest, PricingResponse, CostBreakdown } from '../types/order';

interface UsePricingCalculatorOptions {
  debounceMs?: number;
  apiBaseUrl?: string;
}

interface UsePricingCalculatorReturn {
  pricing: PricingResponse | null;
  loading: boolean;
  error: string | null;
  calculateNow: (overrideInput?: PricingCalculationRequest) => Promise<PricingResponse | null>;
}

const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_API_BASE = 'http://localhost:8080/api/v1';

// Local authoritative fallback formula matching Go backend PricingService
function fallbackCalculate(input: PricingCalculationRequest): PricingResponse {
  const qty = Math.max(1, input.quantity || 1);
  const pages = Math.max(1, input.page_count || 1);
  const totalImpressions = qty * pages;

  const widthM = (input.unfolded_width_mm || 0) / 1000;
  const heightM = (input.unfolded_height_mm || 0) / 1000;
  const areaM2 = widthM > 0 && heightM > 0 ? widthM * heightM : 0.06237;
  const areaScale = areaM2 / 0.06237;

  let rawPaperCost = (input.paper_cost_per_unit_lak || 1200) * qty;
  if (input.sheets_per_pack && input.cuts_per_sheet && input.sheets_per_pack > 0 && input.cuts_per_sheet > 0) {
    const costPerSheet = (input.paper_cost_per_unit_lak || 1200) / input.sheets_per_pack;
    const sheetsNeeded = Math.ceil(totalImpressions / input.cuts_per_sheet);
    rawPaperCost = costPerSheet * sheetsNeeded;
  }

  const spoilage = (input.spoilage_rate_percent || 5) / 100;
  const wasteCost = Math.round(rawPaperCost * spoilage);
  const baseMaterialCost = Math.round(rawPaperCost + wasteCost);

  const covPct = input.ink_coverage_percent || 15;
  const volPerImpression = 0.007 * covPct * areaScale;
  const totalVolMl = volPerImpression * totalImpressions;

  const genuineRate = input.ink_cost_per_ml_lak || 1500;
  const genuineBaseline = Math.round(totalVolMl * genuineRate);

  let activeInkCost = genuineBaseline;
  let compatibleCost = 0;
  let inkSavings = 0;
  let inkSavingsPct = 0;

  if (input.use_compatible_ink && input.compatible_ink_cost_per_ml_lak && input.compatible_ink_cost_per_ml_lak > 0) {
    compatibleCost = Math.round(totalVolMl * input.compatible_ink_cost_per_ml_lak);
    activeInkCost = compatibleCost;
    if (genuineBaseline > compatibleCost) {
      inkSavings = genuineBaseline - compatibleCost;
      inkSavingsPct = Math.round((inkSavings / genuineBaseline) * 10000) / 100;
    }
  }

  const lamination = (input.lamination_cost_lak || 0) * qty;
  const binding = (input.binding_cost_lak || 0) * qty;
  const grommets = (input.grommets_count || 0) * (input.grommet_cost_lak || 0) * qty;
  const folding = input.edge_folding ? (input.folding_cost_lak || 0) * qty : 0;
  const labor = Math.round((input.labor_hours || 0) * (input.labor_rate_per_hour_lak || 40000));
  const laborFinishing = lamination + binding + grommets + folding + labor;

  const plateCost = input.plate_cost_per_unit_lak || 0;
  const machineDepr = Math.round((input.machine_depreciation_rate_lak || 0) * totalImpressions);

  const netInternal = baseMaterialCost + activeInkCost + laborFinishing + plateCost + machineDepr;
  const markupPct = (input.markup_margin_percent || 35) / 100;
  const markupAmount = Math.round(netInternal * markupPct);
  const subtotal = netInternal + markupAmount;

  const taxPct = (input.tax_rate_percent || 0) / 100;
  const taxAmount = Math.round(subtotal * taxPct);
  let totalPrice = subtotal + taxAmount;

  if (input.min_total_price_lak && totalPrice < input.min_total_price_lak) {
    totalPrice = input.min_total_price_lak;
  }

  const unitPrice = Math.ceil(totalPrice / qty);

  const breakdown: CostBreakdown = {
    base_material_cost_lak: baseMaterialCost,
    ink_usage_cost_lak: activeInkCost,
    plate_cost_lak: plateCost,
    machine_depreciation_lak: machineDepr,
    labor_finishing_cost_lak: laborFinishing,
    waste_spoilage_cost_lak: wasteCost,
    net_internal_cost_lak: netInternal,
    markup_amount_lak: markupAmount,
    tax_amount_lak: taxAmount,
    total_price_lak: totalPrice,
    unit_price_lak: unitPrice,
    genuine_ink_baseline_lak: genuineBaseline,
    compatible_ink_cost_lak: compatibleCost,
    ink_savings_lak: inkSavings,
    ink_savings_percent: inkSavingsPct,
  };

  return {
    job_name: input.job_name || 'Print Job',
    quantity: qty,
    unit_price_lak: unitPrice,
    total_price_lak: totalPrice,
    cost_breakdown: breakdown,
    currency: 'LAK',
  };
}

export function usePricingCalculator(
  input: PricingCalculationRequest | null,
  options: UsePricingCalculatorOptions = {}
): UsePricingCalculatorReturn {
  const { debounceMs = DEFAULT_DEBOUNCE_MS, apiBaseUrl = DEFAULT_API_BASE } = options;

  const [pricing, setPricing] = useState<PricingResponse | null>(() => (input ? fallbackCalculate(input) : null));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stringified input signature to prevent redundant fetches
  const inputSignature = useMemo(() => (input ? JSON.stringify(input) : ''), [input]);

  const executeCalculation = useCallback(
    async (calcInput: PricingCalculationRequest): Promise<PricingResponse | null> => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiBaseUrl}/pricing/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(calcInput),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        const result: PricingResponse = data.data || data;
        setPricing(result);
        return result;
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return null;
        }
        // Fallback to local high-precision calculation engine
        const fallback = fallbackCalculate(calcInput);
        setPricing(fallback);
        return fallback;
      } finally {
        setLoading(false);
      }
    },
    [apiBaseUrl]
  );

  useEffect(() => {
    if (!input || !input.quantity || input.quantity <= 0) {
      setPricing(null);
      setLoading(false);
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      executeCalculation(input);
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [inputSignature, debounceMs, executeCalculation]);

  const calculateNow = useCallback(
    async (overrideInput?: PricingCalculationRequest): Promise<PricingResponse | null> => {
      const target = overrideInput || input;
      if (!target || !target.quantity || target.quantity <= 0) {
        return null;
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return executeCalculation(target);
    },
    [input, executeCalculation]
  );

  return {
    pricing,
    loading,
    error,
    calculateNow,
  };
}
