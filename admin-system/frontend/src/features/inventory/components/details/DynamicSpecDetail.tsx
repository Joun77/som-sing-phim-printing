import React from 'react';
import PaperSpecDetail from './PaperSpecDetail';
import InkSpecDetail from './InkSpecDetail';
import PrinterSpecDetail from './PrinterSpecDetail';
import GenericSpecDetail from './GenericSpecDetail';

export interface DynamicSpecDetailProps {
  item: any;
  currentLang?: string;
  categoryType?: string;
}

/**
 * Unified Dynamic Component for Rendering Inventory Technical Specifications
 * Supports Paper, Ink, Printer, Machine assets and Generic Specs.
 */
export default function DynamicSpecDetail({
  item,
  currentLang = 'lo',
  categoryType,
}: DynamicSpecDetailProps) {
  if (!item) return null;

  const resolvedCategory = (
    categoryType ||
    item.category ||
    item.categoryType ||
    ''
  ).toLowerCase();

  if (resolvedCategory.includes('paper') || resolvedCategory.includes('ເຈ້ຍ')) {
    return <PaperSpecDetail item={item} currentLang={currentLang} />;
  }

  if (resolvedCategory.includes('ink') || resolvedCategory.includes('ໝຶກ')) {
    return <InkSpecDetail item={item} currentLang={currentLang} />;
  }

  if (
    resolvedCategory.includes('printer') ||
    resolvedCategory.includes('equipment') ||
    resolvedCategory.includes('เครื่อง') ||
    resolvedCategory.includes('เครื่องพิมพ์')
  ) {
    return <PrinterSpecDetail item={item} currentLang={currentLang} />;
  }

  return <GenericSpecDetail item={item} />;
}
