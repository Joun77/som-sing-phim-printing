import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  saveWearPartsRequest,
  createWearPartRequest,
  deleteWearPartRequest,
  type WearPartComponent,
  type WearPartDraft,
  type NewWearPartInput
} from './wearPartsService';

describe('Wear Parts CRUD API Failure Guard & Local State Immunity', () => {
  const initialComponents: WearPartComponent[] = [
    { id: 'wp-01', name: 'Pickup Roller', cost: 600000, lifeVal: 50000 },
    { id: 'wp-02', name: 'Maintenance Box', cost: 700000, lifeVal: 50000 }
  ];

  it('API PUT failure must return error, prevent equipment mutation and suppress success toast', async () => {
    let equipmentUpdated = false;
    const toasts: { msg: string; type: string }[] = [];

    const failingFetch = (async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Database connection failed' })
    })) as unknown as typeof fetch;

    const draft: Record<string, WearPartDraft> = {
      'Pickup Roller': { cost: 999999, life: 10000 }
    };

    // Execute the shared request helper
    const apiRes = await saveWearPartsRequest('PRN-9614', initialComponents, draft, {}, failingFetch);

    // Production flow guard pattern: halt if API call fails
    if (!apiRes.ok) {
      toasts.push({ msg: apiRes.error || 'Failed to save wear parts', type: 'error' });
    } else {
      equipmentUpdated = true;
      toasts.push({ msg: 'Saved wear parts successfully', type: 'success' });
    }

    assert.strictEqual(apiRes.ok, false, 'API response must indicate failure');
    assert.strictEqual(apiRes.error, 'Database connection failed');
    assert.strictEqual(equipmentUpdated, false, 'updateEquipment must NOT be called on failure');
    assert.strictEqual(toasts.some(t => t.type === 'success'), false, 'Success toast must NOT be shown');
    assert.strictEqual(toasts.some(t => t.type === 'error'), true, 'Error toast must be shown');
  });

  it('API POST failure must return error, prevent component insertion and suppress success toast', async () => {
    let equipmentUpdated = false;
    const toasts: { msg: string; type: string }[] = [];

    const failingFetch = (async () => ({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Cost price must be greater than or equal to 0' })
    })) as unknown as typeof fetch;

    const newPart: NewWearPartInput = {
      name: 'Invalid Belt',
      category: 'belt',
      cost: -100,
      life: 50000
    };

    // Execute the shared request helper
    const apiRes = await createWearPartRequest('PRN-9614', newPart, {}, failingFetch);

    // Production flow guard pattern: halt if API call fails
    if (!apiRes.ok) {
      toasts.push({ msg: apiRes.error || 'Failed to create wear part', type: 'error' });
    } else {
      equipmentUpdated = true;
      toasts.push({ msg: 'Added new wear part successfully', type: 'success' });
    }

    assert.strictEqual(apiRes.ok, false, 'API response must indicate failure');
    assert.strictEqual(apiRes.error, 'Cost price must be greater than or equal to 0');
    assert.strictEqual(equipmentUpdated, false, 'updateEquipment must NOT be called on failure');
    assert.strictEqual(toasts.some(t => t.type === 'success'), false, 'Success toast must NOT be shown');
    assert.strictEqual(toasts.some(t => t.type === 'error'), true, 'Error toast must be shown');
  });

  it('API DELETE failure must return error, prevent component removal and suppress info toast', async () => {
    let equipmentUpdated = false;
    const toasts: { msg: string; type: string }[] = [];

    const failingFetch = (async () => ({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Wear part not found for this machine' })
    })) as unknown as typeof fetch;

    // Execute the shared request helper
    const apiRes = await deleteWearPartRequest('PRN-9614', 'wp-01', {}, failingFetch);

    // Production flow guard pattern: halt if API call fails
    if (!apiRes.ok) {
      toasts.push({ msg: apiRes.error || 'Failed to delete wear part', type: 'error' });
    } else {
      equipmentUpdated = true;
      toasts.push({ msg: 'Deleted wear part successfully', type: 'info' });
    }

    assert.strictEqual(apiRes.ok, false, 'API response must indicate failure');
    assert.strictEqual(apiRes.error, 'Wear part not found for this machine');
    assert.strictEqual(equipmentUpdated, false, 'updateEquipment must NOT be called on failure');
    assert.strictEqual(toasts.some(t => t.type === 'info'), false, 'Info toast must NOT be shown');
    assert.strictEqual(toasts.some(t => t.type === 'error'), true, 'Error toast must be shown');
  });

  it('Successful CRUD operations must return ok: true and allow local state updates', async () => {
    const successFetch = (async (url: string, init?: any) => ({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: init?.method === 'POST' ? { id: 'wp-new-01' } : {}
      })
    })) as unknown as typeof fetch;

    const putRes = await saveWearPartsRequest(
      'PRN-9614',
      initialComponents,
      { 'Pickup Roller': { cost: 650000, life: 60000 } },
      {},
      successFetch
    );
    assert.strictEqual(putRes.ok, true, 'PUT request should succeed');

    const postRes = await createWearPartRequest(
      'PRN-9614',
      { name: 'Paper Feed Belt', category: 'belt', cost: 350000, life: 40000 },
      {},
      successFetch
    );
    assert.strictEqual(postRes.ok, true, 'POST request should succeed');
    assert.strictEqual(postRes.id, 'wp-new-01', 'POST request should return created ID');

    const delRes = await deleteWearPartRequest('PRN-9614', 'wp-01', {}, successFetch);
    assert.strictEqual(delRes.ok, true, 'DELETE request should succeed');
  });

  it('Template or temp wear parts (part-* or temp-*) must trigger POST to acquire real DB ID', async () => {
    const postCalls: { url: string; body: any }[] = [];
    const templateComponents: WearPartComponent[] = [
      { id: 'part-12345', name: 'Pickup Roller', cost: 600000, lifeVal: 50000 },
      { id: 'temp-67890', name: 'Carriage Belt', cost: 600000, lifeVal: 50000 }
    ];

    const mockFetch = (async (url: string, init?: any) => {
      postCalls.push({ url, body: JSON.parse(init?.body || '{}') });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: { id: `real-uuid-${postCalls.length}` }
        })
      };
    }) as unknown as typeof fetch;

    const res = await saveWearPartsRequest(
      'PRN-9614',
      templateComponents,
      {
        'Pickup Roller': { cost: 650000, life: 55000 },
        'Carriage Belt': { cost: 620000, life: 52000 }
      },
      {},
      mockFetch
    );

    assert.strictEqual(res.ok, true);
    assert.strictEqual(postCalls.length, 2, 'Must make 2 POST calls for 2 template parts');
    assert.strictEqual(postCalls[0].url, '/api/v1/equipment/PRN-9614/wear-parts');
    assert.strictEqual(templateComponents[0].id, 'real-uuid-1', 'Must mutate part.id to acquired DB UUID');
    assert.strictEqual(templateComponents[1].id, 'real-uuid-2', 'Must mutate part.id to acquired DB UUID');
  });
});

