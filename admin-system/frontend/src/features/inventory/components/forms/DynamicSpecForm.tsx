import React from 'react';
import PaperSpecForm from './category-specs/PaperSpecForm';
import InkSpecForm from './category-specs/InkSpecForm';
import PrinterSpecForm from './category-specs/PrinterSpecForm';
import GenericSpecForm from './category-specs/GenericSpecForm';
import InkSetForm from './InkSetForm';
import FinishingForm from './FinishingForm';

export interface DynamicSpecFormProps {
  categoryType: string;
  formData: any;
  onChange: (updatedData: any) => void;
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

/**
 * Unified Dynamic Component for Rendering Inventory Technical Specification Forms
 * Dynamically switches form fields based on item categoryType.
 */
export default function DynamicSpecForm({
  categoryType,
  formData,
  onChange,
  onSubmit,
  onCancel = () => {},
}: DynamicSpecFormProps) {
  const cat = (categoryType || '').toLowerCase();
  const handleSubmit = onSubmit || ((data: any) => onChange(data));

  if (cat.includes('paper') || cat.includes('ເຈ້ຍ')) {
    return <PaperSpecForm formData={formData} onChange={onChange} />;
  }

  if (cat.includes('inkset') || cat === 'ink_set') {
    return <InkSetForm onSubmit={handleSubmit} onCancel={onCancel} />;
  }

  if (cat.includes('ink') || cat.includes('ໝຶກ')) {
    return <InkSpecForm formData={formData} onChange={onChange} />;
  }

  if (cat.includes('printer') || cat.includes('equipment') || cat.includes('เครื่อง')) {
    return <PrinterSpecForm formData={formData} onChange={onChange} />;
  }

  if (cat.includes('finishing') || cat.includes('lamination') || cat.includes('binding')) {
    return <FinishingForm onSubmit={handleSubmit} onCancel={onCancel} />;
  }

  return <GenericSpecForm formData={formData} onChange={onChange} />;
}
