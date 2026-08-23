import { 
  MaterialMaster, 
  StockInboundRecord, 
  CreateInboundPayload, 
  CancelInboundPayload,
  InkBottleInventory,
  DeductInkBottlePayload 
} from '../types';

const API_BASE = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
  ? 'http://localhost:8080'
  : '';

/**
 * Fetch all master inventory materials
 */
export async function fetchMaterials(): Promise<MaterialMaster[]> {
  const res = await fetch(`${API_BASE}/api/v1/materials`);
  if (!res.ok) {
    throw new Error(`Failed to fetch materials: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data || [];
}

/**
 * Fetch a single material by ID or SKU
 */
export async function fetchMaterialById(id: string): Promise<MaterialMaster> {
  const res = await fetch(`${API_BASE}/api/v1/materials/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch material: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

/**
 * Update material directly (Admin direct edit)
 */
export async function updateMaterial(id: string, payload: Partial<MaterialMaster>): Promise<MaterialMaster> {
  const res = await fetch(`${API_BASE}/api/v1/materials/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update material: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export const updateMaterialDirect = updateMaterial;

/**
 * Process a stock inbound transaction (Atomic moving average cost update)
 */
export async function createInbound(payload: CreateInboundPayload): Promise<StockInboundRecord> {
  const res = await fetch(`${API_BASE}/api/v1/inventory/inbound`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create inbound: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

/**
 * Fetch procurement inbound logs & history
 */
export async function fetchInboundHistory(): Promise<StockInboundRecord[]> {
  const res = await fetch(`${API_BASE}/api/v1/inventory/inbound`);
  if (!res.ok) {
    throw new Error(`Failed to fetch inbound history: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data || [];
}

/**
 * Cancel/revert an inbound record with stock deduction
 */
export async function cancelInbound(
  idOrPayload: string | CancelInboundPayload,
  optionalPayload?: CancelInboundPayload
): Promise<StockInboundRecord> {
  let url = `${API_BASE}/api/v1/inventory/inbound/cancel`;
  let body: CancelInboundPayload;

  if (typeof idOrPayload === 'string') {
    url = `${API_BASE}/api/v1/inventory/inbound/${idOrPayload}/cancel`;
    body = optionalPayload || { inbound_id: idOrPayload, user_id: 'admin', reason: 'User cancellation' };
  } else {
    body = idOrPayload;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to cancel inbound: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

/**
 * Fetch ink bottle inventory for shop floor
 */
export async function fetchInkBottles(): Promise<InkBottleInventory[]> {
  const res = await fetch(`${API_BASE}/api/v1/inventory/ink-bottles`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ink bottles: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data || [];
}

/**
 * Register intake of ink bottles
 */
export async function intakeInkBottle(payload: any): Promise<InkBottleInventory> {
  const res = await fetch(`${API_BASE}/api/v1/inventory/ink-bottles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to intake ink bottles: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

/**
 * Deduct ink bottles when refilling printer
 */
export async function deductInkBottle(payload: DeductInkBottlePayload): Promise<InkBottleInventory> {
  const res = await fetch(`${API_BASE}/api/v1/inventory/ink-bottles/deduct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to deduct ink bottle: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}
