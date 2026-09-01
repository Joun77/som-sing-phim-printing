import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PrintOrderFormValues,
  CustomerPriceQuote,
  FileScanStatus,
  ProductOption,
} from '../types/pricing';
import { calculatePricing } from '../api/client';

interface UseDynamicPriceCalculatorProps {
  values: PrintOrderFormValues;
  paperOptions: ProductOption[];
  bindingOptions: ProductOption[];
  finishingOptions: ProductOption[];
}

export function useDynamicPriceCalculator({
  values,
  paperOptions,
  bindingOptions,
  finishingOptions,
}: UseDynamicPriceCalculatorProps) {
  const [quote, setQuote] = useState<CustomerPriceQuote | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStatus, setScanStatus] = useState<FileScanStatus | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [detectedPages, setDetectedPages] = useState<number | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isValidDriveUrl = useCallback((url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return false;
    return (
      trimmed.includes('drive.google.com') &&
      (trimmed.includes('/file/d/') || trimmed.includes('id='))
    );
  }, []);

  // Calculation Engine
  const calculateLocalQuote = useCallback(
    (
      currentValues: PrintOrderFormValues,
      activeScanStatus: FileScanStatus | null,
      pageOverride?: number
    ): CustomerPriceQuote => {
      const selectedPaper = paperOptions.find((p) => p.id === currentValues.paperType) || paperOptions[0];
      const selectedBinding = bindingOptions.find((b) => b.id === currentValues.bindingType) || bindingOptions[0];
      const selectedFinishing = finishingOptions.find((f) => f.id === currentValues.finishingType) || finishingOptions[0];

      const pages = pageOverride || currentValues.pageCount || 1;
      const qty = Math.max(1, currentValues.quantity);

      // Base Paper Cost
      const paperUnitRate = selectedPaper?.pricePerUnit || 150; // LAK per sheet
      const sheetsPerUnit = currentValues.isDoubleSided ? Math.ceil(pages / 2) : pages;
      const paperCostPerUnit = paperUnitRate * sheetsPerUnit;

      // Ink Cost Per Side (Aggregate rate)
      const baseInkPerSide = 200; // Base LAK
      const inkCostPerUnit = baseInkPerSide * pages;

      // Add-ons
      const bindingCostPerUnit = selectedBinding?.pricePerUnit || 0;
      const finishingCostPerUnit = selectedFinishing?.pricePerUnit || 0;
      const setupCost = 5000; // Flat setup fee

      const unitBaseCost = paperCostPerUnit + inkCostPerUnit + bindingCostPerUnit + finishingCostPerUnit;
      const subtotal = unitBaseCost * qty + setupCost;
      const totalUnitPrice = Math.round((subtotal / qty) * 100) / 100;
      const unitPricePerPage = Math.round((totalUnitPrice / pages) * 100) / 100;

      const badge =
        activeScanStatus === 'AUTO_VERIFIED'
          ? 'AUTO_VERIFIED'
          : activeScanStatus === 'PENDING_MANUAL_VERIFICATION'
          ? 'PENDING_VERIFICATION'
          : 'PENDING_VERIFICATION';

      return {
        unitPricePerPage,
        totalUnitPrice,
        quantity: qty,
        subtotal,
        badge,
        pageCount: pages,
      };
    },
    [paperOptions, bindingOptions, finishingOptions]
  );

  // Poll or simulate scan job completion
  const triggerDriveScan = useCallback((url: string) => {
    setIsScanning(true);
    setScanStatus('PROCESSING');
    setScanError(null);

    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);

    // Simulate async pipeline (Route A or B)
    pollTimerRef.current = setTimeout(() => {
      setIsScanning(false);
      // If URL contains "large" or "restricted", route to Route B
      if (url.includes('restricted') || url.includes('private')) {
        setScanStatus('PENDING_MANUAL_VERIFICATION');
        setScanError('เอกสารต้องขอสิทธิ์เข้าถึง ระบบประเมินด้วยอัตรามาตรฐาน');
      } else {
        setScanStatus('AUTO_VERIFIED');
        setDetectedPages(16); // Detected page count from MuPDF
      }
    }, 1200);
  }, []);

  // Debounced listener on values change
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsLoading(true);

    debounceTimerRef.current = setTimeout(async () => {
      const trimmedUrl = values.driveUrl?.trim();
      if (trimmedUrl && isValidDriveUrl(trimmedUrl) && !scanStatus && !isScanning) {
        triggerDriveScan(trimmedUrl);
      }

      const effectivePages = detectedPages || values.pageCount || 1;
      const qty = Math.max(1, values.quantity);

      try {
        // Attempt backend calculation
        const selectedPaper = paperOptions.find((p) => p.id === values.paperType);
        const selectedBinding = bindingOptions.find((b) => b.id === values.bindingType);
        const selectedFinishing = finishingOptions.find((f) => f.id === values.finishingType);

        const backendRes = await calculatePricing({
          job_name: values.productId || 'Custom Print',
          quantity: qty,
          paper_sku: selectedPaper?.id || 'standard-paper',
          paper_cost_per_unit: selectedPaper?.pricePerUnit || 150,
          paper_format: 'A4',
          unfolded_width_mm: 210,
          unfolded_height_mm: 297,
          lamination_type: selectedFinishing?.id !== 'none' ? selectedFinishing?.id : undefined,
          lamination_cost: selectedFinishing?.pricePerUnit || 0,
          binding_type: selectedBinding?.id !== 'none' ? selectedBinding?.id : undefined,
          binding_cost: selectedBinding?.pricePerUnit || 0,
          ink_coverage_percent: 15,
          markup_margin: 0.35,
        });

        if (backendRes && backendRes.sale_price) {
          const totalUnitPrice = Math.round((backendRes.sale_price / qty) * 100) / 100;
          const unitPricePerPage = Math.round((totalUnitPrice / effectivePages) * 100) / 100;
          setQuote({
            unitPricePerPage,
            totalUnitPrice,
            quantity: qty,
            subtotal: backendRes.sale_price,
            badge: scanStatus === 'AUTO_VERIFIED' ? 'AUTO_VERIFIED' : 'PENDING_VERIFICATION',
            pageCount: effectivePages,
          });
          setIsLoading(false);
          return;
        }
      } catch {
        // Offline or network fallback
      }

      const calculated = calculateLocalQuote(values, scanStatus, effectivePages);
      setQuote(calculated);
      setIsLoading(false);
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [values, scanStatus, detectedPages, calculateLocalQuote, isValidDriveUrl, triggerDriveScan, isScanning, paperOptions, bindingOptions, finishingOptions]);

  const recalculate = useCallback(() => {
    const effectivePages = detectedPages || values.pageCount || 1;
    const calculated = calculateLocalQuote(values, scanStatus, effectivePages);
    setQuote(calculated);
  }, [values, detectedPages, scanStatus, calculateLocalQuote]);

  return {
    quote,
    isLoading,
    isScanning,
    scanStatus,
    scanError,
    detectedPages,
    recalculate,
  };
}
