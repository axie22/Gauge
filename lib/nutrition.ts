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

export const NUTRITION_KEY = 'hevy-nutrition-log';

export function loadLog(): NutritionLog {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(NUTRITION_KEY);
    return raw ? (JSON.parse(raw) as NutritionLog) : {};
  } catch {
    return {};
  }
}

export function saveEntry(entry: NutritionEntry): void {
  const log = loadLog();
  log[entry.date] = entry;
  localStorage.setItem(NUTRITION_KEY, JSON.stringify(log));
}

export function deleteEntry(date: string): void {
  const log = loadLog();
  delete log[date];
  localStorage.setItem(NUTRITION_KEY, JSON.stringify(log));
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
