import { getAuthHeaders } from '../../../utils/authHeaders';
import type {
  ProductionStageAssignment,
  CreateAssignmentPayload,
  UpdateAssignmentPayload,
  UpdateProgressPayload,
  ReadyQueueItem,
  AssignableStaff,
  ConflictInfo,
} from '../../../types/production';

export class ApiError extends Error {
  conflict?: ConflictInfo;
  code?: string;
  statusCode?: number;

  constructor(message: string, statusCode?: number, conflict?: ConflictInfo, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.conflict = conflict;
    this.code = code;
  }
}

export async function fetchDailyPlan(params?: {
  date?: string;
  shift?: string;
  assignee_id?: string;
  machine_id?: string;
  status?: string;
}): Promise<ProductionStageAssignment[]> {
  const query = new URLSearchParams();
  if (params?.date) query.set('date', params.date);
  if (params?.shift) query.set('shift', params.shift);
  if (params?.assignee_id) query.set('assignee_id', params.assignee_id);
  if (params?.machine_id) query.set('machine_id', params.machine_id);
  if (params?.status) query.set('status', params.status);

  const url = `/api/v1/production/daily-plan${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url, {
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) {
    let errMsg = 'Failed to fetch daily plan';
    let code: string | undefined;
    try {
      const data = await res.json();
      errMsg = data.error || data.message || errMsg;
      code = data.code;
    } catch (_) {}
    throw new ApiError(errMsg, res.status, undefined, code);
  }

  const json = await res.json();
  return json.data || [];
}

export async function fetchReadyOrdersQueue(): Promise<ReadyQueueItem[]> {
  const res = await fetch('/api/v1/production/daily-plan/ready-queue', {
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) {
    let errMsg = 'Failed to fetch ready orders queue';
    let code: string | undefined;
    try {
      const data = await res.json();
      errMsg = data.error || data.message || errMsg;
      code = data.code;
    } catch (_) {}
    throw new ApiError(errMsg, res.status, undefined, code);
  }

  const json = await res.json();
  return json.data || [];
}

export async function fetchAssignableStaff(): Promise<AssignableStaff[]> {
  const res = await fetch('/api/v1/production/daily-plan/staff', {
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) {
    let errMsg = 'Failed to fetch staff list';
    let code: string | undefined;
    try {
      const data = await res.json();
      errMsg = data.error || data.message || errMsg;
      code = data.code;
    } catch (_) {}
    throw new ApiError(errMsg, res.status, undefined, code);
  }

  const json = await res.json();
  return json.data || [];
}

export async function createAssignment(payload: CreateAssignmentPayload): Promise<ProductionStageAssignment> {
  const res = await fetch('/api/v1/production/daily-plan/assignments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = 'Failed to create assignment';
    let conflict: ConflictInfo | undefined;
    let code: string | undefined;
    try {
      const data = await res.json();
      errMsg = data.error || data.message || errMsg;
      conflict = data.conflict;
      code = data.code;
    } catch (_) {}
    throw new ApiError(errMsg, res.status, conflict, code);
  }

  const json = await res.json();
  return json.data;
}

export async function updateAssignment(
  id: string,
  payload: UpdateAssignmentPayload
): Promise<ProductionStageAssignment> {
  const res = await fetch(`/api/v1/production/daily-plan/assignments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = 'Failed to update assignment';
    let conflict: ConflictInfo | undefined;
    let code: string | undefined;
    try {
      const data = await res.json();
      errMsg = data.error || data.message || errMsg;
      conflict = data.conflict;
      code = data.code;
    } catch (_) {}
    throw new ApiError(errMsg, res.status, conflict, code);
  }

  const json = await res.json();
  return json.data;
}

export async function deleteAssignment(id: string): Promise<void> {
  const res = await fetch(`/api/v1/production/daily-plan/assignments/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) {
    let errMsg = 'Failed to delete assignment';
    let code: string | undefined;
    try {
      const data = await res.json();
      errMsg = data.error || data.message || errMsg;
      code = data.code;
    } catch (_) {}
    throw new ApiError(errMsg, res.status, undefined, code);
  }
}

export async function updateAssignmentProgress(
  id: string,
  payload: UpdateProgressPayload
): Promise<ProductionStageAssignment> {
  const res = await fetch(`/api/v1/production/daily-plan/assignments/${id}/progress`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = 'Failed to update progress';
    let code: string | undefined;
    try {
      const data = await res.json();
      errMsg = data.error || data.message || errMsg;
      code = data.code;
    } catch (_) {}
    throw new ApiError(errMsg, res.status, undefined, code);
  }

  const json = await res.json();
  return json.data;
}
