/**
 * Shared service helper for machine wear parts API operations and error handling.
 * Used by EquipmentDetailsPage and unit tests to ensure consistent request/error handling.
 */

export interface WearPartDraft {
  cost: number;
  life: number;
  name?: string;
  nameLo?: string;
  unitLabel?: string;
}

export interface NewWearPartInput {
  name: string;
  nameLo?: string;
  category: string;
  cost: number;
  life: number;
  unit?: string;
}

export interface WearPartComponent {
  id?: string;
  name: string;
  nameLo?: string;
  cost?: number;
  lifeVal?: number;
  unitLabel?: string;
  costPerUnit?: number;
  [key: string]: any;
}

export interface WearPartApiResponse {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function putWearPartApi(
  equipmentId: string,
  partId: string,
  payload: {
    part_name_en?: string;
    part_name_lo?: string;
    cost_price_lak?: number;
    expected_lifespan_units?: number;
    unit_type?: string;
  },
  headers: Record<string, string> = {},
  customFetch: typeof fetch = fetch
): Promise<WearPartApiResponse> {
  try {
    const res = await customFetch(`/api/v1/equipment/${equipmentId}/wear-parts/${partId}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { ok: false, error: errData.error || `HTTP ${res.status}: Failed to update wear part` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Network error updating wear part' };
  }
}

export async function postWearPartApi(
  equipmentId: string,
  newPart: NewWearPartInput,
  headers: Record<string, string> = {},
  customFetch: typeof fetch = fetch
): Promise<WearPartApiResponse> {
  try {
    const res = await customFetch(`/api/v1/equipment/${equipmentId}/wear-parts`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        part_name_en: newPart.name.trim(),
        part_name_lo: (newPart.nameLo || newPart.name).trim(),
        part_category: newPart.category,
        cost_price_lak: newPart.cost,
        expected_lifespan_units: newPart.life,
        unit_type: newPart.unit || 'pages'
      })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { ok: false, error: errData.error || `HTTP ${res.status}: Failed to create wear part` };
    }
    const json = await res.json().catch(() => ({}));
    return { ok: true, id: json?.data?.id };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Network error creating wear part' };
  }
}

export async function deleteWearPartApi(
  equipmentId: string,
  partId: string,
  headers: Record<string, string> = {},
  customFetch: typeof fetch = fetch
): Promise<WearPartApiResponse> {
  try {
    const res = await customFetch(`/api/v1/equipment/${equipmentId}/wear-parts/${partId}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { ok: false, error: errData.error || `HTTP ${res.status}: Failed to delete wear part` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Network error deleting wear part' };
  }
}

/**
 * Saves all modified wear parts via PUT requests.
 * Halts on first failure without completing updates.
 */
export async function saveWearPartsRequest(
  machineId: string,
  parts: WearPartComponent[],
  drafts: Record<string, WearPartDraft>,
  headers: Record<string, string> = {},
  customFetch: typeof fetch = fetch
): Promise<WearPartApiResponse> {
  for (const part of parts) {
    const draft = drafts[part.name];
    if (draft) {
      const updatedCost = Number(draft.cost);
      const updatedLife = Number(draft.life);
      const updatedName = draft.name ? draft.name.trim() : part.name;
      const updatedNameLo = draft.nameLo ? draft.nameLo.trim() : part.nameLo;
      const updatedUnit = draft.unitLabel ? draft.unitLabel.trim() : part.unitLabel;

      if (part.id && !part.id.startsWith('part-') && !part.id.startsWith('temp-')) {
        const res = await putWearPartApi(
          machineId,
          part.id,
          {
            part_name_en: updatedName,
            part_name_lo: updatedNameLo,
            cost_price_lak: updatedCost,
            expected_lifespan_units: updatedLife,
            unit_type: updatedUnit
          },
          headers,
          customFetch
        );
        if (!res.ok) {
          return { ok: false, error: res.error || `Failed to update wear part ${part.name}` };
        }
      }
    }
  }
  return { ok: true };
}

/**
 * Creates a new wear part via POST request.
 */
export async function createWearPartRequest(
  machineId: string,
  newPart: NewWearPartInput,
  headers: Record<string, string> = {},
  customFetch: typeof fetch = fetch
): Promise<WearPartApiResponse> {
  return postWearPartApi(machineId, newPart, headers, customFetch);
}

/**
 * Deletes a wear part via DELETE request.
 */
export async function deleteWearPartRequest(
  machineId: string,
  partId: string,
  headers: Record<string, string> = {},
  customFetch: typeof fetch = fetch
): Promise<WearPartApiResponse> {
  return deleteWearPartApi(machineId, partId, headers, customFetch);
}
