// TypeScript types matching Go backend production/models.go 100%

export interface ProductionStageAssignment {
  id: string;
  order_id: string;
  order_no?: string;
  customer_name?: string;
  delivery_date?: string;
  order_item_id: string;
  item_name?: string;
  item_specs?: Record<string, any>;
  quantity?: number;
  job_ticket_id?: string;
  stage: string;
  planned_date: string; // YYYY-MM-DD
  planned_shift: 'morning' | 'afternoon' | 'full' | string;
  planned_start_time?: string;
  planned_end_time?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  assignee_id?: string;
  assignee_name?: string;
  machine_id?: string;
  machine_name?: string;
  priority: number; // 1 = Normal, 2 = Urgent, 3 = Rush
  sequence_order: number;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAssignmentPayload {
  order_id: string;
  order_item_id: string;
  job_ticket_id?: string;
  stage: string;
  planned_date: string;
  planned_shift?: string;
  planned_start_time?: string;
  planned_end_time?: string;
  assignee_id?: string;
  machine_id?: string;
  priority?: number;
  sequence_order?: number;
  notes?: string;
  force?: boolean;
}

export interface UpdateAssignmentPayload {
  stage?: string;
  planned_date?: string;
  planned_shift?: string;
  planned_start_time?: string;
  planned_end_time?: string;
  assignee_id?: string;
  machine_id?: string;
  priority?: number;
  sequence_order?: number;
  status?: string;
  notes?: string;
  force?: boolean;
}

export interface UpdateProgressPayload {
  status: 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  operator_id?: string;
  spoilage_count?: number;
}

export interface ReadyOrderItem {
  id: string;
  order_id: string;
  item_name: string;
  quantity: number;
  page_count: number;
  paper_size: string;
  binding_type: string;
  current_step: string;
  assigned_machine?: string;
  specs?: Record<string, any>;
}

export interface ReadyQueueItem {
  order_id: string;
  order_no: string;
  customer_name: string;
  delivery_date: string;
  status: string;
  deposit_paid: boolean;
  deposit_amount: number;
  total_amount: number;
  proof_approved: boolean;
  margin_approved: boolean;
  is_ready_for_production: boolean;
  block_reason?: string;
  items: ReadyOrderItem[];
}

export interface AssignableStaff {
  id: string;
  nameLo: string;
  nameEn: string;
  role: string;
  department: string;
  status: string;
  skills: string[];
}

export interface ConflictInfo {
  has_conflict: boolean;
  conflicted_machine: boolean;
  conflicted_assignee: boolean;
  message: string;
  details: string[];
}
