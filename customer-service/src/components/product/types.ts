import type { PreflightReport } from '../../lib/preflightAnalyzer.ts'
import type { SpecOption } from '../../data/catalog.ts'

export interface ArtworkBatchItem {
  id: string
  fileName: string
  file?: File
  previewUrl: string
  fileType: string
  fileSizeMB: string
  report?: PreflightReport | null
  colorMode: 'cmyk' | 'grayscale'
  sizeId: string
  materialId: string
  finishingId: string
  selectedGroupOptions: Record<string, string>
  quantity: number
  specialNotes: string
}

export interface OptionButtonProps {
  option: SpecOption
  selected: boolean
  onSelect: (id: string) => void
  language: string
  currency: any
  convertTo: (thb: number) => number
  badge?: string
}

export interface SpecGroupProps {
  icon?: string
  title: string
  hint?: string
  options: SpecOption[]
  value: string
  onChange: (id: string) => void
  language: string
  currency: any
  convertTo: (thb: number) => number
  displayType?: 'cards' | 'dropdown' | string
}
