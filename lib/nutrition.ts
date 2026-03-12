export interface NutritionEntry {
  date: string;           // YYYY-MM-DD
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  water_ml: number | null;
  notes: string;
}

export type NutritionLog = Record<string, NutritionEntry>;

// ─── API-backed persistence (server writes to data/nutrition.json) ─────────────

export async function fetchLog(): Promise<NutritionLog> {
  try {
    const res = await fetch('/api/nutrition', { cache: 'no-store' });
    if (!res.ok) return {};
    return (await res.json()) as NutritionLog;
  } catch {
    return {};
  }
}

export async function saveEntry(entry: NutritionEntry): Promise<void> {
  await fetch('/api/nutrition', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
}

export async function deleteEntry(date: string): Promise<void> {
  await fetch(`/api/nutrition?date=${encodeURIComponent(date)}`, {
    method: 'DELETE',
  });
}

export function emptyEntry(date: string): NutritionEntry {
  return {
    date,
    calories: null,
    protein_g: null,
    carbs_g: null,
    fat_g: null,
    fiber_g: null,
    water_ml: null,
    notes: '',
  };
}

export function entryHasData(e: NutritionEntry): boolean {
  return (
    e.calories !== null ||
    e.protein_g !== null ||
    e.carbs_g !== null ||
    e.fat_g !== null
  );
}

export function entryIsComplete(e: NutritionEntry): boolean {
  return (
    e.calories !== null &&
    e.protein_g !== null &&
    e.carbs_g !== null &&
    e.fat_g !== null
  );
}

/** Returns the last N date strings ending at (and including) today, UTC-based */
export function lastNDays(n: number): string[] {
  const today = new Date().toISOString().slice(0, 10);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - (n - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}
