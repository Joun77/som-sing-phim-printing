import { describe, it } from 'node:test';
import assert from 'node:assert';

interface WearPartComponent {
  id: string;
  name: string;
  cost: number;
  lifeVal: number;
}

// Emulate wear part save flow with response.ok verification
async function simulateSaveWearParts(
  machineId: string,
  parts: WearPartComponent[],
  drafts: Record<string, { cost: number; life: number }>,
  mockFetch: (url: string, init?: any) => Promise<{ ok: boolean; status: number; json: () => Promise<any> }>,
  onUpdateEquipment: (id: string, updated: any) => void,
  showToast: (msg: string, type: string) => void
) {
  try {
    for (const part of parts) {
      const draft = drafts[part.name];
      if (draft) {
        const res = await mockFetch(`/api/v1/equipment/${machineId}/wear-parts/${part.id}`, {
          method: 'PUT',
          body: JSON.stringify({ cost_price_lak: draft.cost, expected_lifespan_units: draft.life })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}: Failed to update wear part`);
        }
      }
    }
  } catch (err: any) {
    showToast(err.message || 'Failed to save wear parts', 'error');
    return false; // Abort without modifying local equipment components
  }

  const updatedComponents = parts.map(p => {
    const draft = drafts[p.name];
    return draft ? { ...p, cost: draft.cost, lifeVal: draft.life } : p;
  });
  onUpdateEquipment(machineId, { components: updatedComponents });
  showToast('Saved wear parts successfully', 'success');
  return true;
}

// Emulate wear part create flow with response.ok verification
async function simulateAddWearPart(
  machineId: string,
  newPart: { name: string; cost: number; life: number },
  existingParts: WearPartComponent[],
  mockFetch: (url: string, init?: any) => Promise<{ ok: boolean; status: number; json: () => Promise<any> }>,
  onUpdateEquipment: (id: string, updated: any) => void,
  showToast: (msg: string, type: string) => void
) {
  let createdId = `part-${Date.now()}`;
  try {
    const res = await mockFetch(`/api/v1/equipment/${machineId}/wear-parts`, {
      method: 'POST',
      body: JSON.stringify(newPart)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: Failed to create wear part`);
    }
    const json = await res.json().catch(() => ({}));
    if (json?.data?.id) createdId = json.data.id;
  } catch (err: any) {
    showToast(err.message || 'Failed to create wear part', 'error');
    return false; // Abort without modifying local equipment components
  }

  const updated = [...existingParts, { id: createdId, name: newPart.name, cost: newPart.cost, lifeVal: newPart.life }];
  onUpdateEquipment(machineId, { components: updated });
  showToast('Added new wear part successfully', 'success');
  return true;
}

// Emulate wear part delete flow with response.ok verification
async function simulateDeleteWearPart(
  machineId: string,
  partId: string,
  existingParts: WearPartComponent[],
  mockFetch: (url: string, init?: any) => Promise<{ ok: boolean; status: number; json: () => Promise<any> }>,
  onUpdateEquipment: (id: string, updated: any) => void,
  showToast: (msg: string, type: string) => void
) {
  try {
    const res = await mockFetch(`/api/v1/equipment/${machineId}/wear-parts/${partId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: Failed to delete wear part`);
    }
  } catch (err: any) {
    showToast(err.message || 'Failed to delete wear part', 'error');
    return false; // Abort without modifying local equipment components
  }

  const updated = existingParts.filter(p => p.id !== partId);
  onUpdateEquipment(machineId, { components: updated });
  showToast('Deleted wear part successfully', 'info');
  return true;
}

describe('Wear Parts CRUD API Failure Guard & Local State Immunity', () => {
  const initialComponents: WearPartComponent[] = [
    { id: 'wp-01', name: 'Pickup Roller', cost: 600000, lifeVal: 50000 },
    { id: 'wp-02', name: 'Maintenance Box', cost: 700000, lifeVal: 50000 }
  ];

  it('API PUT failure must not mutate local equipment components and must not show success toast', async () => {
    let equipmentUpdated = false;
    const toasts: { msg: string; type: string }[] = [];

    const failingFetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Database connection failed' })
    });

    const success = await simulateSaveWearParts(
      'PRN-9614',
      initialComponents,
      { 'Pickup Roller': { cost: 999999, lifeVal: 10000 } },
      failingFetch,
      () => { equipmentUpdated = true; },
      (msg, type) => { toasts.push({ msg, type }); }
    );

    assert.strictEqual(success, false, 'Operation should return false on failure');
    assert.strictEqual(equipmentUpdated, false, 'updateEquipment must NOT be called on failure');
    assert.strictEqual(toasts.some(t => t.type === 'success'), false, 'Success toast must NOT be shown');
    assert.strictEqual(toasts.some(t => t.type === 'error'), true, 'Error toast must be shown');
  });

  it('API POST failure must not add component to local equipment state and must not show success toast', async () => {
    let equipmentUpdated = false;
    const toasts: { msg: string; type: string }[] = [];

    const failingFetch = async () => ({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Cost price must be greater than or equal to 0' })
    });

    const success = await simulateAddWearPart(
      'PRN-9614',
      { name: 'Invalid Belt', cost: -100, life: 50000 },
      initialComponents,
      failingFetch,
      () => { equipmentUpdated = true; },
      (msg, type) => { toasts.push({ msg, type }); }
    );

    assert.strictEqual(success, false, 'Operation should return false on failure');
    assert.strictEqual(equipmentUpdated, false, 'updateEquipment must NOT be called on failure');
    assert.strictEqual(toasts.some(t => t.type === 'success'), false, 'Success toast must NOT be shown');
    assert.strictEqual(toasts.some(t => t.type === 'error'), true, 'Error toast must be shown');
  });

  it('API DELETE failure must not remove component from local equipment state and must not show info toast', async () => {
    let equipmentUpdated = false;
    const toasts: { msg: string; type: string }[] = [];

    const failingFetch = async () => ({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Wear part not found for this machine' })
    });

    const success = await simulateDeleteWearPart(
      'PRN-9614',
      'wp-01',
      initialComponents,
      failingFetch,
      () => { equipmentUpdated = true; },
      (msg, type) => { toasts.push({ msg, type }); }
    );

    assert.strictEqual(success, false, 'Operation should return false on failure');
    assert.strictEqual(equipmentUpdated, false, 'updateEquipment must NOT be called on failure');
    assert.strictEqual(toasts.some(t => t.type === 'info'), false, 'Info toast must NOT be shown');
    assert.strictEqual(toasts.some(t => t.type === 'error'), true, 'Error toast must be shown');
  });
});
