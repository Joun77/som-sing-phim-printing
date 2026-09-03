import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  FolderPlus,
  Box,
  ChevronRight,
  Maximize2,
  Sliders,
  Sparkle,
  CopyCheck,
  CheckCircle,
  FileCheck2,
  HelpCircle,
  UserCheck
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

  const allTemplates = useMemo(() => {
    return [...BUILT_IN_WORKFLOW_TEMPLATES, ...customTemplates];
  }, [customTemplates]);

  // Order items list
  const orderItems: any[] = useMemo(() => {
    if (!order?.items || !Array.isArray(order.items) || order.items.length === 0) {
      return [{ id: 'item_default', name: 'Main Print Job', quantity: 1 }];
    }
    return order.items;
  }, [order]);

  // Active Job Selector state (default to first item)
  const [activeJobId, setActiveJobId] = useState<string>(() => {
    return order?.items?.[0]?.id || 'item_default';
  });

  // Track which template is assigned to each job item: Record<jobId, templateId>
  const [jobTemplates, setJobTemplates] = useState<Record<string, string>>({});

  // Modal/Drawer state for selecting template for a specific job or applying to all
  const [templatePickerTargetJobId, setTemplatePickerTargetJobId] = useState<string | null>(null);

  // Search & Filter templates
  const [templateSearchQuery, setTemplateSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(tpl => {
      const matchesSearch = !templateSearchQuery.trim() || 
        (tpl.name && tpl.name.toLowerCase().includes(templateSearchQuery.toLowerCase().trim())) ||
        (tpl.nameLao && tpl.nameLao.toLowerCase().includes(templateSearchQuery.toLowerCase().trim())) ||
        (tpl.description && tpl.description.toLowerCase().includes(templateSearchQuery.toLowerCase().trim())) ||
        (tpl.category && tpl.category.toLowerCase().includes(templateSearchQuery.toLowerCase().trim()));
      
      const matchesCat = selectedCategory === 'ALL' || tpl.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCat;
    });
  }, [allTemplates, templateSearchQuery, selectedCategory]);

  // Selected Template ID & Steps
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom_itemized');
  const [currentTemplateName, setCurrentTemplateName] = useState<string>('Itemized Production Workflow');
  const [currentTemplateNameLao, setCurrentTemplateNameLao] = useState<string>('ສາຍງານການຜະລິດແຍກຕາມລາຍການສິນຄ້າ');
  const [steps, setSteps] = useState<ProductionWorkflowStep[]>([]);
  const [showSaveTemplateInput, setShowSaveTemplateInput] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [technicianSearchQuery, setTechnicianSearchQuery] = useState<Record<string, string>>({});
  const [activeDropdownStepId, setActiveDropdownStepId] = useState<string | null>(null);
  const [showAssignAllDropdown, setShowAssignAllDropdown] = useState(false);
  const [assignAllSearchQuery, setAssignAllSearchQuery] = useState('');

  // Heuristic auto-detect function for an item
  const detectTemplateForItem = (item: any): WorkflowTemplate => {
    const itemName = `${item?.name || ''} ${item?.item_name || ''} ${item?.bindingMethod || ''} ${item?.binding_type || ''}`.toLowerCase();
    if (itemName.includes('sticker') || itemName.includes('label') || itemName.includes('kiss')) {
      return BUILT_IN_WORKFLOW_TEMPLATES[1];
    } else if (itemName.includes('calendar') || itemName.includes('ປະຕິທິນ')) {
      return BUILT_IN_WORKFLOW_TEMPLATES[3];
    } else if (itemName.includes('box') || itemName.includes('packaging') || itemName.includes('card') || itemName.includes('ນາມບັດ')) {
      return BUILT_IN_WORKFLOW_TEMPLATES[4];
    } else if (itemName.includes('photo') || itemName.includes('poster') || itemName.includes('leaflet') || itemName.includes('ໃບປິວ')) {
      return BUILT_IN_WORKFLOW_TEMPLATES[2];
    }
    return BUILT_IN_WORKFLOW_TEMPLATES[0];
  };

  // Initial load
  useEffect(() => {
    if (!isOpen) return;

    const firstJobId = orderItems[0]?.id || 'item_default';
    setActiveJobId(firstJobId);

    if (order?.productionWorkflow?.steps && order.productionWorkflow.steps.length > 0) {
      setSelectedTemplateId(order.productionWorkflow.templateId || 'custom');
      setCurrentTemplateName(order.productionWorkflow.templateName || 'Custom Workflow');
      setCurrentTemplateNameLao(order.productionWorkflow.templateNameLao || order.productionWorkflow.templateName || 'ຂະບວນການຜະລິດ');
      setSteps(order.productionWorkflow.steps);
      return;
    }

    // Default: assign steps tagged by jobId per item
    const allItemSteps: ProductionWorkflowStep[] = [];
    const initialJobTpls: Record<string, string> = {};

    orderItems.forEach((item, itIdx) => {
      const tpl = detectTemplateForItem(item);
      const jId = item.id || `item_${itIdx + 1}`;
      initialJobTpls[jId] = tpl.id;

      tpl.steps.forEach((st) => {
        allItemSteps.push({
          ...st,
          id: `${jId}_${st.id}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          jobId: jId,
          name: st.name,
          nameLao: st.nameLao,
          status: 'PENDING',
        });
      });
    });

    setJobTemplates(initialJobTpls);
    setSelectedTemplateId('custom_itemized');
    setCurrentTemplateName('Itemized Production Workflow');
    setCurrentTemplateNameLao('ສາຍງານການຜະລິດແຍກຕາມລາຍການສິນຄ້າ');
    setSteps(allItemSteps);
  }, [isOpen, order]);

  // Apply template to a target job
  const handleApplyTemplateToJob = (targetJobId: string, tpl: WorkflowTemplate) => {
    setJobTemplates(prev => ({ ...prev, [targetJobId]: tpl.id }));
    
    // Replace steps for this specific job
    const nonJobSteps = steps.filter(s => s.jobId && s.jobId !== targetJobId);
    const newJobSteps = tpl.steps.map(st => ({
      ...st,
      id: `${targetJobId}_${st.id}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      jobId: targetJobId,
      name: st.name,
      nameLao: st.nameLao,
      status: 'PENDING' as const,
    }));

    setSteps([...nonJobSteps, ...newJobSteps]);
    setTemplatePickerTargetJobId(null);
  };

  // Apply template to ALL items
  const handleApplyTemplateToAll = (tpl: WorkflowTemplate) => {
    const allJobTpls: Record<string, string> = {};
    const allItemSteps: ProductionWorkflowStep[] = [];

    orderItems.forEach((item, itIdx) => {
      const jId = item.id || `item_${itIdx + 1}`;
      allJobTpls[jId] = tpl.id;
      tpl.steps.forEach((st) => {
        allItemSteps.push({
          ...st,
          id: `${jId}_${st.id}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          jobId: jId,
          name: st.name,
          nameLao: st.nameLao,
          status: 'PENDING',
        });
      });
    });

    setJobTemplates(allJobTpls);
    setSteps(allItemSteps);
    setSelectedTemplateId(tpl.id);
    setCurrentTemplateName(tpl.name);
    setCurrentTemplateNameLao(tpl.nameLao);
    setTemplatePickerTargetJobId(null);
  };

  // Active Job Details
  const activeJobItem = useMemo(() => {
    return orderItems.find(i => (i.id || 'item_default') === activeJobId) || orderItems[0];
  }, [orderItems, activeJobId]);

  // Steps filtered by active job view
  const visibleSteps = useMemo(() => {
    if (!activeJobId) return steps;
    return steps.filter(s => !s.jobId || s.jobId === activeJobId);
  }, [steps, activeJobId]);

  // Reordering steps within current view
  const handleMoveStep = (stepId: string, direction: 'up' | 'down') => {
    const currentViewIds = visibleSteps.map(s => s.id);
    const viewIdx = currentViewIds.indexOf(stepId);
    if (viewIdx === -1) return;
    if (direction === 'up' && viewIdx === 0) return;
    if (direction === 'down' && viewIdx === currentViewIds.length - 1) return;

    const targetStepId = currentViewIds[direction === 'up' ? viewIdx - 1 : viewIdx + 1];
    const globalIdx1 = steps.findIndex(s => s.id === stepId);
    const globalIdx2 = steps.findIndex(s => s.id === targetStepId);
    if (globalIdx1 === -1 || globalIdx2 === -1) return;

    const newSteps = [...steps];
    const temp = newSteps[globalIdx1];
    newSteps[globalIdx1] = newSteps[globalIdx2];
    newSteps[globalIdx2] = temp;
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
      jobId: activeJobId || orderItems[0]?.id || 'item_default',
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
        if (s.id !== stepId) return s;
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
          assignedStaffName: employee.name || employee.full_name,
          assignedStaffRole: employee.role || employee.department,
          assignedStaffAvatar: employee.avatar || employee.photo_url,
        };
      })
    );
    setActiveDropdownStepId(null);
  };

  // Assign ONE technician to ALL steps of the CURRENT item
  const handleAssignTechnicianToCurrentItemSteps = (employee: any) => {
    if (!employee) return;
    setSteps(
      steps.map((s) => {
        if (s.jobId && s.jobId !== activeJobId) return s;
        return {
          ...s,
          assignedTo: employee.id,
          assignedStaffName: employee.name || employee.full_name,
          assignedStaffRole: employee.role || employee.department,
          assignedStaffAvatar: employee.avatar || employee.photo_url,
        };
      })
    );
    setShowAssignAllDropdown(false);
  };

  // Assign ONE technician to ALL steps across the ENTIRE order
  const handleAssignTechnicianToAllOrderSteps = (employee: any) => {
    if (!employee) return;
    setSteps(
      steps.map((s) => ({
        ...s,
        assignedTo: employee.id,
        assignedStaffName: employee.name || employee.full_name,
        assignedStaffRole: employee.role || employee.department,
        assignedStaffAvatar: employee.avatar || employee.photo_url,
      }))
    );
    setShowAssignAllDropdown(false);
  };

  // Save current pipeline as custom template
  const handleSaveAsCustomTemplate = () => {
    if (!newTemplateName.trim()) return;

    const newTpl: WorkflowTemplate = {
      id: `tpl_custom_${Date.now()}`,
      name: newTemplateName.trim(),
      nameLao: newTemplateName.trim(),
      description: visibleSteps.map((s) => s.nameLao || s.name).join(' ➔ '),
      category: 'Custom',
      steps: visibleSteps.map((s) => ({
        id: s.id,
        name: s.name,
        nameLao: s.nameLao,
        category: s.category,
      })),
    };

    const updatedCustom = [newTpl, ...customTemplates];
    setCustomTemplates(updatedCustom);
    try {
      localStorage.setItem('ss_print_workflow_templates_v1', JSON.stringify(updatedCustom));
    } catch (e) {
      console.error(e);
    }
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

  const modalElement = (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-md animate-fade-in font-sans">
      <div className="w-[98vw] max-w-[1600px] h-[95vh] flex flex-col bg-slate-50 rounded-3xl shadow-2xl overflow-hidden border border-slate-200/90 animate-scale-up">
        
        {/* Rich Navy Gradient Header with Process Step Breadcrumb */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white px-6 sm:px-8 py-4 flex items-center justify-between shrink-0 border-b border-slate-800 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Layers className="w-5.5 h-5.5" />
            </div>
            <div>
              {/* Process Step Breadcrumb */}
              <div className="flex items-center gap-2 mb-1">
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{currentLang === 'lo' ? 'ຂັ້ນຕອນ 1: ຮັບອໍເດີ' : 'Step 1: Order Reception'}</span>
                </span>
                <span className="text-slate-600">➔</span>
                <span className="flex items-center gap-1 text-[11px] font-black text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-400/30">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{currentLang === 'lo' ? 'ຂັ້ນຕອນ 2: ຂະບວນການຜະລິດ' : 'Step 2: Production Process'}</span>
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10.5px] font-mono bg-white/10 text-white border border-white/20 font-bold ml-1">
                  {order?.orderNo || order?.order_no || order?.id || 'JOB'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                {currentLang === 'lo' ? 'ຂະບວນການຜະລິດ' : 'Production Process'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two-Column Split Layout */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-0 bg-slate-100/50">
          
          {/* Left Column (5 of 12 cols): PRINT JOB ITEMS LIST (Priority 1) */}
          <div className="lg:col-span-5 border-r border-slate-200 bg-slate-50 p-5 sm:p-6 overflow-y-auto space-y-4">
            
            {/* Column Header & Actions */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <div>
                <label className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-sky-600" />
                  <span>{currentLang === 'lo' ? 'ລາຍການສິນຄ້າສັ່ງພິມ (ເລືອກເພື່ອຕັ້ງຄ່າ):' : 'Print Job Items (Select to Configure):'}</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {currentLang === 'lo' ? 'ເລືອກລາຍການເພື່ອປັບ Template ຫຼື ມອບໝາຍຊ່າງ' : 'Select an item to change its workflow or assign staff'}
                </p>
              </div>

              {/* Apply To All Button */}
              {orderItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => setTemplatePickerTargetJobId('ALL')}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Apply same template to all items"
                >
                  <CopyCheck className="w-3.5 h-3.5" />
                  <span>{currentLang === 'lo' ? 'ຕັ້ງຄ່າຄືກັນທຸກລາຍການ' : 'Apply to All'}</span>
                </button>
              )}
            </div>

            {/* Print Items Cards List */}
            <div className="space-y-3">
              {orderItems.map((item, itIdx) => {
                const jId = item.id || `item_${itIdx + 1}`;
                const isSelected = activeJobId === jId;
                const itemSteps = steps.filter(s => s.jobId === jId);
                const assignedCount = itemSteps.filter(s => !!s.assignedStaffName).length;
                const assignedTplId = jobTemplates[jId];
                const currentTpl = allTemplates.find(t => t.id === assignedTplId) || detectTemplateForItem(item);

                return (
                  <div
                    key={jId}
                    onClick={() => setActiveJobId(jId)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-white border-sky-500 ring-2 ring-sky-500/20 shadow-md'
                        : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {/* Header: Item Index, Name & Selection badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-xl font-mono text-xs font-black flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {itIdx + 1}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-slate-900 truncate">
                            {item.name || item.item_name || `Print Job #${itIdx + 1}`}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                            <span className="font-bold text-slate-700">x{item.quantity || 1} {item.unit || 'pcs'}</span>
                            <span>•</span>
                            <span>{item.paperType || item.paper_type || 'Standard Paper'}</span>
                            {item.paperGram && <span>({item.paperGram}g)</span>}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
                          {currentLang === 'lo' ? 'ກຳລັງເລືອກ' : 'Active'}
                        </span>
                      )}
                    </div>

                    {/* Specifications Pill Bar */}
                    {(item.size || item.pages || item.bindingMethod) && (
                      <div className="mt-2.5 flex flex-wrap gap-1 text-[10px]">
                        {item.size && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-bold">
                            {item.size}
                          </span>
                        )}
                        {item.pages && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-bold">
                            {item.pages} {currentLang === 'lo' ? 'ໜ້າ' : 'pages'}
                          </span>
                        )}
                        {item.bindingMethod && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-bold">
                            {item.bindingMethod}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Template Selection Box & Status for this Item */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Template ປັດຈຸບັນ:</span>
                        <div className="flex items-center gap-1 text-xs font-black text-slate-800 truncate">
                          <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate">{currentTpl.nameLao || currentTpl.name}</span>
                        </div>
                      </div>

                      {/* Button to Open Template Picker Popover for THIS Item */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTemplatePickerTargetJobId(jId);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Sliders className="w-3 h-3 text-sky-600" />
                        <span>{currentLang === 'lo' ? 'ປ່ຽນ Template' : 'Change Template'}</span>
                      </button>
                    </div>

                    {/* Step Count and Assigned Technician Summary */}
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-400" />
                        <span>{itemSteps.length} {currentLang === 'lo' ? 'ຂັ້ນຕອນ' : 'steps'}</span>
                      </span>
                      <span className={`font-bold flex items-center gap-1 ${assignedCount === itemSteps.length && itemSteps.length > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        <User className="w-3 h-3" />
                        <span>{assignedCount}/{itemSteps.length} {currentLang === 'lo' ? 'ມອບໝາຍແລ້ວ' : 'assigned'}</span>
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

          {/* Right Column (7 of 12 cols): WORKFLOW PIPELINE OF SELECTED ITEM */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 overflow-y-auto space-y-4 flex flex-col">
            
            {/* Header: Currently active item info & quick actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-black uppercase text-sky-600 tracking-wider">
                    {currentLang === 'lo' ? 'ສາຍງານການຜະລິດສຳລັບ' : 'Workflow Pipeline for'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-sky-100 text-sky-800 border border-sky-200">
                    {activeJobItem.name || `Item ${activeJobId}`}
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900 mt-0.5">
                  {currentLang === 'lo' ? 'ລຳດັບຂັ້ນຕອນການຜະລິດ & ມອບໝາຍຊ່າງປະຈຳຈຸດ' : 'Production Steps & Assigned Technicians'}
                </h3>
              </div>

              {/* Actions Toolbar: Assign Technician to All Steps + Save Template */}
              <div className="flex items-center gap-2">
                {/* 1. Assign All Steps to Same Technician Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAssignAllDropdown(!showAssignAllDropdown)}
                    className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Assign same technician to all steps"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span>{currentLang === 'lo' ? 'ມອບຊ່າງຄົນດຽວທຸກຂັ້ນຕອນ' : 'Assign Same Tech to All'}</span>
                  </button>

                  {/* Dropdown for Picking Single Technician for All Steps */}
                  {showAssignAllDropdown && (
                    <div className="absolute right-0 top-full mt-1.5 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2.5 z-30 space-y-2 animate-fade-in">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                          <span>{currentLang === 'lo' ? 'ເລືອກຊ່າງຄົນດຽວທຸກຂັ້ນຕອນ:' : 'Assign One Tech to All Steps:'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAssignAllDropdown(false)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder={currentLang === 'lo' ? 'ຄົ້ນຫາຊື່ຊ່າງ...' : 'Search technician...'}
                          value={assignAllSearchQuery}
                          onChange={(e) => setAssignAllSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:bg-white"
                          autoFocus
                        />
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-1">
                        {employees
                          .filter((emp: any) => {
                            if (!assignAllSearchQuery.trim()) return true;
                            const q = assignAllSearchQuery.toLowerCase();
                            const name = (emp.name || emp.full_name || '').toLowerCase();
                            const role = (emp.role || emp.department || '').toLowerCase();
                            return name.includes(q) || role.includes(q);
                          })
                          .map((emp: any) => (
                            <div
                              key={emp.id}
                              className="p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 flex items-center justify-between gap-2 transition"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 font-bold text-[10px] flex items-center justify-center shrink-0 overflow-hidden">
                                  {emp.avatar || emp.photo_url ? (
                                    <img src={emp.avatar || emp.photo_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    (emp.name || emp.full_name || 'U').substring(0, 2).toUpperCase()
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-slate-900 block truncate">
                                    {emp.name || emp.full_name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block truncate">
                                    {emp.role || emp.department || 'Staff'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {/* Option A: Apply to Current Item */}
                                <button
                                  type="button"
                                  onClick={() => handleAssignTechnicianToCurrentItemSteps(emp)}
                                  className="px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold transition cursor-pointer shadow-2xs"
                                  title="Assign to all steps of this item"
                                >
                                  {currentLang === 'lo' ? 'ສະເພາະລາຍການນີ້' : 'This Item'}
                                </button>

                                {/* Option B: Apply to Entire Order (if multiple items) */}
                                {orderItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleAssignTechnicianToAllOrderSteps(emp)}
                                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold transition cursor-pointer shadow-2xs"
                                    title="Assign to all steps of all items in this order"
                                  >
                                    {currentLang === 'lo' ? 'ທຸກລາຍການ' : 'All Items'}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Quick Save Custom Template Button */}
                {!showSaveTemplateInput ? (
                  <button
                    type="button"
                    onClick={() => setShowSaveTemplateInput(true)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-sky-600" />
                    <span>{currentLang === 'lo' ? 'ບັນທຶກເປັນ Template' : 'Save as Template'}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder={currentLang === 'lo' ? 'ຕັ້ງຊື່ Template ໃໝ່...' : 'Template Name...'}
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white font-medium w-40"
                    />
                    <button
                      type="button"
                      onClick={handleSaveAsCustomTemplate}
                      disabled={!newTemplateName.trim()}
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
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
            </div>

            {/* Steps List for the active item */}
            <div className="space-y-2.5 flex-1">
              {visibleSteps.map((step, idx) => {
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
                    className="bg-slate-50/80 rounded-2xl border border-slate-200 p-3 shadow-2xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Left: Step Index & Title */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-black flex items-center justify-center shrink-0 shadow-2xs">
                        {idx + 1}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={step.nameLao || step.name}
                            onChange={(e) => handleUpdateStepName(step.id, e.target.value)}
                            className="text-xs font-black text-slate-900 bg-white/80 border border-slate-200 hover:border-slate-300 focus:border-sky-500 focus:bg-white px-2.5 py-1 rounded-xl outline-hidden w-full max-w-sm shadow-2xs"
                          />
                          {getCategoryBadge(step.category)}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Assigned Technician Selector */}
                    <div className="relative shrink-0 sm:w-64">
                      {step.assignedStaffName ? (
                        <div className="flex items-center justify-between p-1.5 pl-2.5 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-bold text-[10px] flex items-center justify-center shrink-0 overflow-hidden">
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
                            className="w-full py-1.5 px-2.5 rounded-xl border border-dashed border-slate-300 hover:border-sky-400 bg-white hover:bg-sky-50/50 text-slate-500 hover:text-sky-700 text-xs font-bold transition flex items-center justify-between cursor-pointer shadow-2xs"
                          >
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[11px]">{currentLang === 'lo' ? 'ມອບໝາຍຊ່າງ' : 'Assign Staff'}</span>
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
                                  placeholder={currentLang === 'lo' ? 'ຄົ້ນຫາຊື່ຊ່າງ...' : 'Search staff...'}
                                  value={technicianSearchQuery[step.id] || ''}
                                  onChange={(e) =>
                                    setTechnicianSearchQuery({ ...technicianSearchQuery, [step.id]: e.target.value })
                                  }
                                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:bg-white"
                                  autoFocus
                                />
                              </div>

                              <div className="max-h-48 overflow-y-auto space-y-1">
                                {filteredStaff.length > 0 ? (
                                  filteredStaff.map((emp: any) => (
                                    <button
                                      key={emp.id}
                                      type="button"
                                      onClick={() => handleAssignStaff(step.id, emp)}
                                      className="w-full p-1.5 rounded-xl hover:bg-slate-100 flex items-center gap-2 text-left transition cursor-pointer"
                                    >
                                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 overflow-hidden">
                                        {emp.avatar || emp.photo_url ? (
                                          <img src={emp.avatar || emp.photo_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          (emp.name || emp.full_name || 'U').substring(0, 2).toUpperCase()
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <span className="text-xs font-bold text-slate-900 block truncate">
                                          {emp.name || emp.full_name}
                                        </span>
                                        <span className="text-[10px] text-slate-400 block truncate">
                                          {emp.role || emp.department || 'Staff'}
                                        </span>
                                      </div>
                                    </button>
                                  ))
                                ) : (
                                  <div className="p-3 text-center text-xs text-slate-400 font-bold">
                                    {currentLang === 'lo' ? 'ບໍ່ພົບລາຍຊື່ຊ່າງ' : 'No staff found'}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Step Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveStep(step.id, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:hover:bg-white transition cursor-pointer shadow-2xs"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStep(step.id, 'down')}
                        disabled={idx === visibleSteps.length - 1}
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:hover:bg-white transition cursor-pointer shadow-2xs"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStep(step.id)}
                        className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer shadow-2xs"
                        title="Delete Step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Custom Step Presets */}
            <div className="pt-3 border-t border-slate-100 shrink-0">
              <span className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                {currentLang === 'lo' ? '+ ເພີ່ມຂັ້ນຕອນພິເສດສຳລັບລາຍການນີ້:' : '+ Add Special Process Steps for this Item:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ADD_PRESETS.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => handleAddCustomStep(preset)}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3 h-3 text-sky-600" />
                    <span>{currentLang === 'lo' ? preset.nameLao : preset.name}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddCustomStep()}
                  className="px-2.5 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-black transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{currentLang === 'lo' ? '+ ຂັ້ນຕອນກຳນົດເອງ' : '+ Custom Step'}</span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-8 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            <span className="font-bold text-slate-700">
              {steps.length} {currentLang === 'lo' ? 'ຂັ້ນຕອນໃນສາຍການຜະລິດທັງໝົດ' : 'total production steps'}
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
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              {currentLang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-black shadow-md shadow-sky-500/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-none"
            >
              <Printer className="w-4 h-4" />
              <span>{currentLang === 'lo' ? 'ຢືນຢັນເລີ່ມຜະລິດ & ສົ່ງເຂົ້າແທ່ນພິມ' : 'Confirm & Release to Production'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Popover Modal for Picking Workflow Template for a specific Item or ALL Items */}
      {templatePickerTargetJobId && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
            
            {/* Template Picker Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {templatePickerTargetJobId === 'ALL'
                      ? (currentLang === 'lo' ? 'ເລືອກ Template ສຳລັບທຸກລາຍການສິນຄ້າ' : 'Select Template for All Items')
                      : (currentLang === 'lo' ? `ເລືອກ Template: ${orderItems.find(i => i.id === templatePickerTargetJobId)?.name || 'ລາຍການສິນຄ້າ'}` : `Select Template for Item`)}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {templatePickerTargetJobId === 'ALL'
                      ? (currentLang === 'lo' ? 'ຂັ້ນຕອນການຜະລິດຈະຖືກນຳໃຊ້ກັບທຸກລາຍການໃນອໍເດີນີ້' : 'This template will be applied across all print jobs in this order')
                      : (currentLang === 'lo' ? 'ປ່ຽນຂັ້ນຕອນການຜະລິດສະເພາະລາຍການນີ້' : 'Customize production pipeline for this item only')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTemplatePickerTargetJobId(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Search & Filter */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={templateSearchQuery}
                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                  placeholder={currentLang === 'lo' ? 'ຄົ້ນຫາ Template (ປຶ້ມ, ສະຕິກເກີ, ໂປສເຕີ)...' : 'Search templates...'}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:border-sky-500 outline-hidden"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                {['ALL', 'Books', 'Stickers', 'Sheets', 'Calendars', 'Packaging', 'Custom'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates List */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 max-h-[50vh]">
              {filteredTemplates.map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => {
                    if (templatePickerTargetJobId === 'ALL') {
                      handleApplyTemplateToAll(tpl);
                    } else if (templatePickerTargetJobId) {
                      handleApplyTemplateToJob(templatePickerTargetJobId, tpl);
                    }
                  }}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 transition cursor-pointer flex flex-col justify-between gap-2 shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-black text-slate-900 group-hover:text-sky-900">
                      {tpl.nameLao || tpl.name}
                    </strong>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      {tpl.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {tpl.description}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-100">
                    <span>{tpl.steps.length} {currentLang === 'lo' ? 'ຂັ້ນຕອນ' : 'steps'}</span>
                    <span className="text-sky-600 font-bold group-hover:underline flex items-center gap-0.5">
                      <span>{currentLang === 'lo' ? 'ເລືອກໃຊ້ນີ້' : 'Select'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Template Picker Footer */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setTemplatePickerTargetJobId(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                {currentLang === 'lo' ? 'ປິດ' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalElement, document.body);
};

export default ConfigureWorkflowModal;
