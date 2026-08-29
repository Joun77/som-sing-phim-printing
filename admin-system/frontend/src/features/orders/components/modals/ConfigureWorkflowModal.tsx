import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  User,
  Check,
  Save,
  Layers,
  Sparkles,
  Scissors,
  Printer,
  ShieldCheck,
  Package,
  BookOpen,
  Calendar,
  CreditCard,
  FileText,
  Search,
  CheckCircle2,
  FolderPlus
} from 'lucide-react';
import { ProductionWorkflow, ProductionWorkflowStep, WorkflowTemplate, WorkflowStepCategory } from '../../types';
import { useApp } from '@store/AppContext';

export interface ConfigureWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  currentLang: string;
  onConfirmWorkflow: (workflow: ProductionWorkflow) => void;
}

export const BUILT_IN_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'tpl_booklet_catalog',
    name: 'Booklet & Catalog (Hot Glue / Wire-O)',
    nameLao: 'ປຶ້ມເຂົ້າເລ່ມໄສກາວ / ສັນຫ່ວງ (Booklet & Catalog)',
    description: 'ຕັດເຈ້ຍ ➔ ພິມເນື້ອໃນ ➔ ພິມປົກ ➔ ເຄືອບ ➔ ພັບຍົກ ➔ ໄສກາວ ➔ ຕັດ 3 ດ້ານ ➔ QC',
    category: 'Books',
    steps: [
      { id: 'step_cut_raw', name: 'Raw Paper Cutting', nameLao: 'ຕັດເຈ້ຍແຜ່ນໃຫຍ່', category: 'PRE_PRESS' },
      { id: 'step_print_inner', name: 'Inner Content Printing', nameLao: 'ພິມເນື້ອໃນ', category: 'PRESS' },
      { id: 'step_print_cover', name: 'Cover Printing', nameLao: 'ພິມປົກ', category: 'PRESS' },
      { id: 'step_lam_cover', name: 'Cover Lamination', nameLao: 'ເຄືອບປົກ (Lamination)', category: 'FINISHING' },
      { id: 'step_fold_collate', name: 'Folding & Collating', nameLao: 'ພັບຍົກ & ຮຽງໜ້າ', category: 'FINISHING' },
      { id: 'step_bind_glue', name: 'Hot Glue Binding / Wire-O', nameLao: 'ໄສກາວຮ້ອນ / ເຈາະຮູສັນຫ່ວງ', category: 'FINISHING' },
      { id: 'step_trim_3sides', name: '3-Side Guillotine Trimming', nameLao: 'ຕັດ 3 ດ້ານ (3-Side Trimming)', category: 'POST_PRESS' },
      { id: 'step_qc_pack', name: 'QC & Packaging', nameLao: 'QC ກວດສອບ & ແພັກສິນຄ້າ', category: 'QC' },
    ],
  },
  {
    id: 'tpl_stickers_labels',
    name: 'Stickers & Labels (Kiss-Cut)',
    nameLao: 'ສະຕິກເກີ / ສະຫຼາກສິນຄ້າໄດຄັດ (Stickers & Labels)',
    description: 'ພິມສະຕິກເກີ ➔ ເຄືອບກັນນ້ຳ ➔ ຕັດໄດຄັດ ➔ ລອກເສດ ➔ QC',
    category: 'Stickers',
    steps: [
      { id: 'step_print_sticker', name: 'Sticker Printing', nameLao: 'ພິມສະຕິກເກີ (Digital / Latex)', category: 'PRESS' },
      { id: 'step_lam_waterproof', name: 'Waterproof / Gloss Lamination', nameLao: 'ເຄືອບກັນນ້ຳ / ເຄືອບຟີມ', category: 'FINISHING' },
      { id: 'step_kiss_cut', name: 'Kiss-Cut Die Cutting', nameLao: 'ຕັດໄດຄັດ Kiss-Cut', category: 'POST_PRESS' },
      { id: 'step_weed_waste', name: 'Waste Weeding & Stripping', nameLao: 'ລອກເສດຂອບ / ແຍກດວງ', category: 'FINISHING' },
      { id: 'step_qc_pack_stk', name: 'QC & Packaging', nameLao: 'QC & ແພັກລົງຖົງ/ກ່ອງ', category: 'QC' },
    ],
  },
  {
    id: 'tpl_photo_poster_leaflet',
    name: 'Photo, Poster & Leaflet',
    nameLao: 'ຮູບພາບ / ໂປສເຕີ / ໃບປິວ (Photo, Poster & Leaflet)',
    description: 'ຕັດເຈ້ຍ ➔ ພິມລະອຽດສູງ ➔ ເຄືອບ ➔ ຕັດເຈຽນ ➔ QC',
    category: 'Sheets',
    steps: [
      { id: 'step_cut_sheet', name: 'Paper Sizing', nameLao: 'ຕັດເຈ້ຍຕາມຂະໜາດ', category: 'PRE_PRESS' },
      { id: 'step_print_hires', name: 'High-Res Digital Printing', nameLao: 'ພິມລະອຽດສູງ (CMYK)', category: 'PRESS' },
      { id: 'step_lam_film', name: 'Film Lamination', nameLao: 'ເຄືອບຟີມເງົາ/ດ້ານ', category: 'FINISHING' },
      { id: 'step_trim_finish', name: 'Trim to Bleed Size', nameLao: 'ຕັດເຈຽນຂອບ (Trim Finish)', category: 'POST_PRESS' },
      { id: 'step_qc_pack_photo', name: 'QC & Packaging', nameLao: 'QC ກວດສີ & ແພັກສົ່ງ', category: 'QC' },
    ],
  },
  {
    id: 'tpl_desk_calendar',
    name: 'Desk Calendar (Wire-O Stand)',
    nameLao: 'ປະຕິທິນຕັ້ງໂຕະ (Desk Calendar)',
    description: 'ພິມໃບເດືອນ ➔ ຂຶ້ນໂຄງຈົ່ວ ➔ ເຈາະຮູ ➔ ໃສ່ສັນ Wire-O ➔ QC',
    category: 'Calendars',
    steps: [
      { id: 'step_print_cal_pages', name: 'Monthly Pages Printing', nameLao: 'ພິມໃບເດືອນ 13-14 ໃບ', category: 'PRESS' },
      { id: 'step_mount_triangle', name: 'Stand Board Mounting', nameLao: 'ຂຶ້ນໂຄງຈົ່ວຕັ້ງໂຕະ (Mount Board)', category: 'FINISHING' },
      { id: 'step_hole_punch', name: 'Hole Punching', nameLao: 'ເຈາະຮູສັນປຶ້ມ', category: 'POST_PRESS' },
      { id: 'step_wireo_insert', name: 'Wire-O Insertion & Crimp', nameLao: 'ໃສ່ສັນ Wire-O & ບີບລັອກ', category: 'FINISHING' },
      { id: 'step_qc_pack_cal', name: 'QC & Shrink Wrap', nameLao: 'QC & ຫໍ່ຟີມຫົດ (Shrink Wrap)', category: 'QC' },
    ],
  },
  {
    id: 'tpl_namecard_packaging',
    name: 'Name Card & Packaging Box',
    nameLao: 'ນາມບັດ / ກ່ອງບັນຈຸພັນ (Name Card & Packaging)',
    description: 'ພິມ Art Card ➔ ເຄືອບ ➔ ປ້ຳໄດຄັດ/ເສັ້ນພັບ ➔ ຕິດກາວ ➔ QC',
    category: 'Packaging',
    steps: [
      { id: 'step_print_artcard', name: 'Art Card Printing', nameLao: 'ພິມ Art Card 300g-350g', category: 'PRESS' },
      { id: 'step_lam_pack', name: 'Matte / Soft Touch Coating', nameLao: 'ເຄືອບດ້ານ / Soft-Touch', category: 'FINISHING' },
      { id: 'step_diecut_crease', name: 'Die-cut & Creasing', nameLao: 'ປ້ຳໄດຄັດ & ເສັ້ນພັບ (Creasing)', category: 'POST_PRESS' },
      { id: 'step_glue_form', name: 'Gluing & Assembly', nameLao: 'ຕິດກາວ & ຂຶ້ນຮູບກ່ອງ', category: 'FINISHING' },
      { id: 'step_qc_pack_box', name: 'QC & Packaging Box', nameLao: 'QC & ແພັກລົງກ່ອງໃຫຍ່', category: 'QC' },
    ],
  },
];

const QUICK_ADD_PRESETS = [
  { name: 'Spot UV Coating', nameLao: 'Spot UV ສະເພາະຈຸດ', category: 'FINISHING' as WorkflowStepCategory },
  { name: 'Hot Foil Stamping (Gold/Silver)', nameLao: 'ປ້ຳຟອຍເຄ ຄຳ/ເງິນ (Hot Foil)', category: 'FINISHING' as WorkflowStepCategory },
  { name: 'Embossing / Debossing', nameLao: 'ປ້ຳນູນ / ປ້ຳຈົມ (Emboss/Deboss)', category: 'FINISHING' as WorkflowStepCategory },
  { name: 'Corner Stapling', nameLao: 'ແມັກມຸມ (Corner Staple)', category: 'FINISHING' as WorkflowStepCategory },
  { name: 'Perforation Line', nameLao: 'ເສັ້ນປຸຈີກ (Perforation)', category: 'POST_PRESS' as WorkflowStepCategory },
  { name: 'Numbering / Barcoding', nameLao: 'ລັນເບີ / ບາໂຄດ (Numbering)', category: 'PRESS' as WorkflowStepCategory },
];

export const ConfigureWorkflowModal: React.FC<ConfigureWorkflowModalProps> = ({
  isOpen,
  onClose,
  order,
  currentLang,
  onConfirmWorkflow,
}) => {
  const { employees = [] } = useApp();

  // Custom saved templates from localStorage
  const [customTemplates, setCustomTemplates] = useState<WorkflowTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('ss_print_workflow_templates_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // All templates
  const allTemplates = useMemo(() => {
    return [...BUILT_IN_WORKFLOW_TEMPLATES, ...customTemplates];
  }, [customTemplates]);

  // Selected Template ID & Steps
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl_booklet_catalog');
  const [currentTemplateName, setCurrentTemplateName] = useState<string>('Booklet & Catalog');
  const [currentTemplateNameLao, setCurrentTemplateNameLao] = useState<string>('ປຶ້ມເຂົ້າເລ່ມໄສກາວ / ສັນຫ່ວງ');
  const [steps, setSteps] = useState<ProductionWorkflowStep[]>([]);
  const [showSaveTemplateInput, setShowSaveTemplateInput] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [technicianSearchQuery, setTechnicianSearchQuery] = useState<Record<string, string>>({});
  const [activeDropdownStepId, setActiveDropdownStepId] = useState<string | null>(null);

  // Auto detect template based on order items
  useEffect(() => {
    if (!isOpen) return;

    if (order?.productionWorkflow?.steps && order.productionWorkflow.steps.length > 0) {
      // Load existing workflow
      setSelectedTemplateId(order.productionWorkflow.templateId || 'custom');
      setCurrentTemplateName(order.productionWorkflow.templateName || 'Custom Workflow');
      setCurrentTemplateNameLao(order.productionWorkflow.templateNameLao || order.productionWorkflow.templateName || 'ຂະບວນການຜະລິດ');
      setSteps(order.productionWorkflow.steps);
      return;
    }

    // Heuristic detection based on items
    let matchedTpl = BUILT_IN_WORKFLOW_TEMPLATES[0];
    const items = order?.items || [];
    const itemNames = items.map((i: any) => `${i.name || ''} ${i.item_name || ''} ${i.bindingMethod || ''} ${i.binding_type || ''}`).join(' ').toLowerCase();

    if (itemNames.includes('sticker') || itemNames.includes('label') || itemNames.includes('kiss')) {
      matchedTpl = BUILT_IN_WORKFLOW_TEMPLATES[1];
    } else if (itemNames.includes('calendar') || itemNames.includes('ປະຕິທິນ')) {
      matchedTpl = BUILT_IN_WORKFLOW_TEMPLATES[3];
    } else if (itemNames.includes('box') || itemNames.includes('packaging') || itemNames.includes('card') || itemNames.includes('ນາມບັດ')) {
      matchedTpl = BUILT_IN_WORKFLOW_TEMPLATES[4];
    } else if (itemNames.includes('photo') || itemNames.includes('poster') || itemNames.includes('leaflet') || itemNames.includes('ໃບປິວ')) {
      matchedTpl = BUILT_IN_WORKFLOW_TEMPLATES[2];
    }

    setSelectedTemplateId(matchedTpl.id);
    setCurrentTemplateName(matchedTpl.name);
    setCurrentTemplateNameLao(matchedTpl.nameLao);
    setSteps(
      matchedTpl.steps.map((st) => ({
        ...st,
        status: 'PENDING',
      }))
    );
  }, [isOpen, order]);

  // When user selects a different template
  const handleSelectTemplate = (tpl: WorkflowTemplate) => {
    setSelectedTemplateId(tpl.id);
    setCurrentTemplateName(tpl.name);
    setCurrentTemplateNameLao(tpl.nameLao);
    setSteps(
      tpl.steps.map((st) => ({
        ...st,
        status: 'PENDING',
      }))
    );
  };

  // Reordering steps
  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === steps.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;
    setSteps(newSteps);
  };

  // Delete step
  const handleDeleteStep = (stepId: string) => {
    setSteps(steps.filter((s) => s.id !== stepId));
  };

  // Add custom step
  const handleAddCustomStep = (preset?: { name: string; nameLao: string; category: WorkflowStepCategory }) => {
    const newId = `step_custom_${Date.now()}`;
    const newStep: ProductionWorkflowStep = {
      id: newId,
      name: preset ? preset.name : 'Custom Finishing Step',
      nameLao: preset ? preset.nameLao : 'ຂັ້ນຕອນແປຮູບພິເສດ',
      category: preset ? preset.category : 'FINISHING',
      status: 'PENDING',
    };
    setSteps([...steps, newStep]);
  };

  // Update Step Name
  const handleUpdateStepName = (stepId: string, nameLao: string) => {
    setSteps(
      steps.map((s) => (s.id === stepId ? { ...s, nameLao, name: nameLao } : s))
    );
  };

  // Assign staff to step
  const handleAssignStaff = (stepId: string, employee: any) => {
    setSteps(
      steps.map((s) => {
        if (s.id === stepId) {
          if (!employee) {
            return {
              ...s,
              assignedTo: undefined,
              assignedStaffName: undefined,
              assignedStaffRole: undefined,
              assignedStaffAvatar: undefined,
            };
          }
          return {
            ...s,
            assignedTo: employee.id,
            assignedStaffName: employee.name || employee.full_name || 'Staff',
            assignedStaffRole: employee.role || employee.department || 'Technician',
            assignedStaffAvatar: employee.avatar,
          };
        }
        return s;
      })
    );
    setActiveDropdownStepId(null);
  };

  // Save as Custom Template
  const handleSaveAsCustomTemplate = () => {
    if (!newTemplateName.trim()) return;

    const newTpl: WorkflowTemplate = {
      id: `tpl_custom_${Date.now()}`,
      name: newTemplateName.trim(),
      nameLao: newTemplateName.trim(),
      description: `${steps.length} steps tailored workflow`,
      category: 'Custom',
      isCustom: true,
      steps: steps.map(({ status, completedAt, completedBy, ...rest }) => rest),
    };

    const updatedCustom = [newTpl, ...customTemplates];
    setCustomTemplates(updatedCustom);
    try {
      localStorage.setItem('ss_print_workflow_templates_v1', JSON.stringify(updatedCustom));
    } catch (e) {
      console.error(e);
    }
    setSelectedTemplateId(newTpl.id);
    setCurrentTemplateName(newTpl.name);
    setCurrentTemplateNameLao(newTpl.nameLao);
    setShowSaveTemplateInput(false);
    setNewTemplateName('');
  };

  // Confirm and Release to Production
  const handleConfirm = () => {
    const workflow: ProductionWorkflow = {
      templateId: selectedTemplateId,
      templateName: currentTemplateName,
      templateNameLao: currentTemplateNameLao,
      steps: steps,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
    };
    onConfirmWorkflow(workflow);
    onClose();
  };

  const getCategoryBadge = (category: WorkflowStepCategory) => {
    switch (category) {
      case 'PRE_PRESS':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">Pre-Press</span>;
      case 'PRESS':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">Press Run</span>;
      case 'POST_PRESS':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">Post-Press</span>;
      case 'FINISHING':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">Finishing</span>;
      case 'QC':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">QC & Pack</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">Other</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 sm:px-7 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] font-mono uppercase tracking-widest text-amber-400 font-black">
                  Production Workflow Engine
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {order?.orderNo || order?.order_no || order?.id || 'JOB'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-100">
                {currentLang === 'lo' ? 'ກຳນົດສາຍງານການຜະລິດ & ມອບໝາຍຊ່າງ' : 'Configure Production Workflow & Assign Technicians'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          
          {/* 1. Built-in & Custom Template Selector */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{currentLang === 'lo' ? '1. ເລືອກ Template ຂະບວນການຜະລິດມາດຕະຖານ:' : '1. Choose Workflow Template:'}</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {allTemplates.length} {currentLang === 'lo' ? 'ແບບພ້ອມໃຊ້' : 'Templates available'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {allTemplates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <strong className={`text-xs font-black ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                          {tpl.nameLao || tpl.name}
                        </strong>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-500 line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                      <span className="font-mono font-bold text-slate-500">
                        {tpl.steps.length} {currentLang === 'lo' ? 'ຂັ້ນຕອນ' : 'steps'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-bold">
                        {tpl.category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Interactive Steps Editor & Technician Assignment */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider block">
                  Workflow Pipeline ({steps.length} Steps)
                </span>
                <h3 className="text-sm font-black text-slate-900">
                  {currentLang === 'lo' ? 'ລຳດັບຂັ້ນຕອນການຜະລິດ & ຊ່າງຜູ້ຮັບຜິດຊອບ' : 'Production Steps & Assigned Technicians'}
                </h3>
              </div>

              {/* Quick Save Template Button */}
              {!showSaveTemplateInput ? (
                <button
                  type="button"
                  onClick={() => setShowSaveTemplateInput(true)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
                  <span>{currentLang === 'lo' ? 'ບັນທຶກເປັນ Template ໃໝ່' : 'Save as Template'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder={currentLang === 'lo' ? 'ຕັ້ງຊື່ Template ໃໝ່...' : 'Template Name...'}
                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white font-medium w-44"
                  />
                  <button
                    type="button"
                    onClick={handleSaveAsCustomTemplate}
                    disabled={!newTemplateName.trim()}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-3 h-3 inline mr-1" />
                    <span>{currentLang === 'lo' ? 'ບັນທຶກ' : 'Save'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSaveTemplateInput(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* List of Steps */}
            <div className="space-y-2.5">
              {steps.map((step, idx) => {
                const searchQ = (technicianSearchQuery[step.id] || '').toLowerCase();
                const filteredStaff = employees.filter((emp: any) => {
                  if (!searchQ) return true;
                  const name = (emp.name || emp.full_name || '').toLowerCase();
                  const role = (emp.role || emp.department || '').toLowerCase();
                  return name.includes(searchQ) || role.includes(searchQ);
                });

                return (
                  <div
                    key={step.id}
                    className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Left: Step Index & Title */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={step.nameLao || step.name}
                            onChange={(e) => handleUpdateStepName(step.id, e.target.value)}
                            className="text-xs font-black text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-slate-50 px-1 py-0.5 rounded outline-hidden w-full max-w-sm"
                          />
                          {getCategoryBadge(step.category)}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Assigned Technician Selector */}
                    <div className="relative shrink-0 sm:w-64">
                      {step.assignedStaffName ? (
                        <div className="flex items-center justify-between p-1.5 pl-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 overflow-hidden">
                              {step.assignedStaffAvatar ? (
                                <img src={step.assignedStaffAvatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                step.assignedStaffName.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate text-[11px]">
                                {step.assignedStaffName}
                              </span>
                              <span className="text-[9.5px] text-slate-400 block truncate">
                                {step.assignedStaffRole || 'Technician'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAssignStaff(step.id, null)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-200 transition cursor-pointer"
                            title="Unassign"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <button
                            type="button"
                            onClick={() => setActiveDropdownStepId(activeDropdownStepId === step.id ? null : step.id)}
                            className="w-full py-1.5 px-2.5 rounded-xl border border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 text-slate-500 hover:text-blue-700 text-xs font-bold transition flex items-center justify-between cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[11px]">{currentLang === 'lo' ? '+ ມອບໝາຍຊ່າງ' : '+ Assign Staff'}</span>
                            </span>
                            <Search className="w-3 h-3 text-slate-400" />
                          </button>

                          {/* Dropdown for picking staff */}
                          {activeDropdownStepId === step.id && (
                            <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-20 space-y-1.5 animate-fade-in">
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  placeholder={currentLang === 'lo' ? 'ຄົ້ນຫາຊ່າງ ຫຼື ພະແນກ...' : 'Search staff...'}
                                  value={technicianSearchQuery[step.id] || ''}
                                  onChange={(e) =>
                                    setTechnicianSearchQuery({
                                      ...technicianSearchQuery,
                                      [step.id]: e.target.value,
                                    })
                                  }
                                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:border-blue-500"
                                  autoFocus
                                />
                              </div>

                              <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-slate-100">
                                {filteredStaff.length > 0 ? (
                                  filteredStaff.map((emp: any) => (
                                    <button
                                      key={emp.id}
                                      type="button"
                                      onClick={() => handleAssignStaff(step.id, emp)}
                                      className="w-full text-left p-1.5 rounded-lg hover:bg-blue-50 transition flex items-center justify-between gap-2 cursor-pointer pt-2"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                          {(emp.name || emp.full_name || 'E').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                          <span className="text-xs font-bold text-slate-800 block truncate">
                                            {emp.name || emp.full_name}
                                          </span>
                                          <span className="text-[10px] text-slate-400 block truncate">
                                            {emp.role || emp.department || 'Staff'}
                                          </span>
                                        </div>
                                      </div>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                                        Select
                                      </span>
                                    </button>
                                  ))
                                ) : (
                                  <div className="p-3 text-center text-xs text-slate-400">
                                    {currentLang === 'lo' ? 'ບໍ່ພົບຊື່ພະນັກງານ' : 'No staff found'}
                                  </div>
                                )}
                              </div>

                              {/* Manual Quick Add Technician */}
                              <div className="pt-1.5 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const customName = prompt(currentLang === 'lo' ? 'ພິມຊື່ຊ່າງຜູ້ຮັບຜິດຊອບ:' : 'Enter technician name:');
                                    if (customName) {
                                      handleAssignStaff(step.id, { id: `custom_${Date.now()}`, name: customName, role: 'Operator' });
                                    }
                                  }}
                                  className="w-full py-1 text-center text-[10.5px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                >
                                  {currentLang === 'lo' ? '+ ພິມຊື່ຊ່າງແບບດ່ວນ' : '+ Type custom name'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Move & Delete Actions */}
                    <div className="flex items-center gap-1 shrink-0 justify-end">
                      <button
                        type="button"
                        onClick={() => handleMoveStep(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStep(idx, 'down')}
                        disabled={idx === steps.length - 1}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStep(step.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Delete Step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Custom Step Buttons */}
            <div className="pt-2">
              <span className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                {currentLang === 'lo' ? '+ ເພີ່ມຂັ້ນຕອນພິເສດ (Quick Add Presets):' : '+ Add Special Process Steps:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ADD_PRESETS.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => handleAddCustomStep(preset)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3 h-3 text-blue-600" />
                    <span>{currentLang === 'lo' ? preset.nameLao : preset.name}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddCustomStep()}
                  className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-black transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{currentLang === 'lo' ? '+ ຂັ້ນຕອນກຳນົດເອງ' : '+ Custom Step'}</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-7 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            <span className="font-bold text-slate-700">
              {steps.length} {currentLang === 'lo' ? 'ຂັ້ນຕອນໃນສາຍການຜະລິດ' : 'steps configured'}
            </span>
            <span className="mx-2">•</span>
            <span className="text-amber-700 font-bold">
              {currentLang === 'lo' ? 'ຕັດສະຕັອກເຈ້ຍ-ໝຶກອັດຕະໂນມັດ' : 'Stock deducted automatically'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              {currentLang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black shadow-md shadow-amber-500/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-none"
            >
              <Printer className="w-4 h-4" />
              <span>{currentLang === 'lo' ? 'ຢືນຢັນເລີ່ມຜະລິດ & ສົ່ງເຂົ້າແທ່ນພິມ' : 'Confirm & Release to Production'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ConfigureWorkflowModal;
