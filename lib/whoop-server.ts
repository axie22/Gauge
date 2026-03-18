import { promises as fs } from 'fs';
import path from 'path';
import {
  WhoopTokens,
  WhoopRecovery,
  WhoopWorkout,
  WhoopSleep,
  WhoopCycle,
  STRENGTH_SPORT_IDS,
  refreshAccessToken,
  whoopFetchAll,
} from './whoop';
import { EnrichedWorkout } from './hevy';

const TOKEN_PATH = path.join(process.cwd(), 'data', 'whoop-tokens.json');

// ─── Token Management ────────────────────────────────────────────────────────

export async function readTokens(): Promise<WhoopTokens | null> {
  try {
    const raw = await fs.readFile(TOKEN_PATH, 'utf-8');
    return JSON.parse(raw) as WhoopTokens;
  } catch {
    return null;
  }
}

export async function writeTokens(tokens: WhoopTokens): Promise<void> {
  await fs.mkdir(path.dirname(TOKEN_PATH), { recursive: true });
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
}

export async function deleteTokens(): Promise<void> {
  try {
    await fs.unlink(TOKEN_PATH);
  } catch {
    // already deleted — fine
  }
}

export async function isWhoopConnected(): Promise<boolean> {
  const tokens = await readTokens();
  return tokens !== null;
}

// Returns a valid access token, refreshing if within 5 minutes of expiry.
// Returns null if Whoop is not connected.
export async function getValidToken(): Promise<string | null> {
  const tokens = await readTokens();
  if (!tokens) return null;

  const BUFFER_MS = 5 * 60 * 1000;
  if (Date.now() < tokens.expires_at - BUFFER_MS) {
    return tokens.access_token;
  }

  try {
    const refreshed = await refreshAccessToken(tokens.refresh_token);
    await writeTokens(refreshed);
    return refreshed.access_token;
  } catch (err) {
    console.error('[whoop] Token refresh failed:', err);
    return null;
  }
}

// ─── Data Fetchers ───────────────────────────────────────────────────────────
// No caching — always fetch fresh. unstable_cache was caching null at startup
// before the token existed, causing data to never appear. For a personal
// dashboard, live API calls are correct.

export interface WhoopRecoveryData {
  today: WhoopRecovery | null;
  recent: WhoopRecovery[];
}

export async function getCachedWhoopRecovery(): Promise<WhoopRecoveryData | null> {
  const token = await getValidToken();
  if (!token) return null;

  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 30);

  try {
    const records = await whoopFetchAll<WhoopRecovery>(
      '/v2/recovery',
      token,
      { start: start.toISOString(), end: end.toISOString() },
    );

    records.sort((a, b) => a.created_at.localeCompare(b.created_at));
    const scored = [...records].reverse().find((r) => r.score_state === 'SCORED' && r.score);

    return { today: scored ?? null, recent: records };
  } catch (err) {
    console.error('[whoop] Failed to fetch recovery:', err);
    return null;
  }
}

export interface WhoopWorkoutData {
  workouts: WhoopWorkout[];
}

export async function getCachedWhoopWorkouts(days = 90): Promise<WhoopWorkoutData | null> {
  const token = await getValidToken();
  if (!token) return null;

  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - days);

  try {
    const workouts = await whoopFetchAll<WhoopWorkout>(
      '/v2/activity/workout',
      token,
      { start: start.toISOString(), end: end.toISOString() },
    );
    return { workouts };
  } catch (err) {
    console.error('[whoop] Failed to fetch workouts:', err);
    return null;
  }
}

export async function getCachedWhoopSleep(days = 30): Promise<WhoopSleep[]> {
  const token = await getValidToken();
  if (!token) return [];

  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - days);

  try {
    return await whoopFetchAll<WhoopSleep>(
      '/v2/activity/sleep',
      token,
      { start: start.toISOString(), end: end.toISOString() },
    );
  } catch (err) {
    console.error('[whoop] Failed to fetch sleep:', err);
    return [];
  }
}

export async function getCachedWhoopCycles(days = 30): Promise<WhoopCycle[]> {
  const token = await getValidToken();
  if (!token) return [];

  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - days);

  try {
    return await whoopFetchAll<WhoopCycle>(
      '/v2/cycle',
      token,
      { start: start.toISOString(), end: end.toISOString() },
    );
  } catch (err) {
    console.error('[whoop] Failed to fetch cycles:', err);
    return [];
  }
}

// ─── Deduplication ──────────────────────────────────────────────────────────

function overlapFraction(
  aStart: number, aEnd: number,
  bStart: number, bEnd: number,
): number {
  const overlapMs = Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
  const shorter = Math.min(aEnd - aStart, bEnd - bStart);
  return shorter > 0 ? overlapMs / shorter : 0;
}

/**
 * Attaches Whoop biometric data to Hevy workouts that overlap in time.
 * Hevy is the source of truth for exercises/sets/weights.
 * Whoop is the source of truth for HR, strain, and calories.
 */
export function deduplicateAndEnrich(
  hevyWorkouts: EnrichedWorkout[],
  whoopWorkouts: WhoopWorkout[],
): EnrichedWorkout[] {
  // Only consider strength-type Whoop workouts with a valid score
  const candidates = whoopWorkouts.filter(
    (w) => STRENGTH_SPORT_IDS.has(w.sport_id) && w.score_state === 'SCORED' && w.score,
  );

  const matched = new Set<string>();

  return hevyWorkouts.map((hevy) => {
    const hStart = new Date(hevy.start_time).getTime();
    const hEnd = new Date(hevy.end_time).getTime();

    let bestMatch: WhoopWorkout | null = null;
    let bestOverlap = 0;

    for (const whoop of candidates) {
      if (matched.has(whoop.id)) continue;
      const wStart = new Date(whoop.start).getTime();
      const wEnd = new Date(whoop.end).getTime();
      const overlap = overlapFraction(hStart, hEnd, wStart, wEnd);
      if (overlap >= 0.5 && overlap > bestOverlap) {
        bestOverlap = overlap;
        bestMatch = whoop;
      }
    }

    if (!bestMatch?.score) return hevy;
    matched.add(bestMatch.id);

    const s = bestMatch.score;
    return {
      ...hevy,
      whoop_biometrics: {
        strain: s.strain,
        avg_heart_rate: s.average_heart_rate,
        max_heart_rate: s.max_heart_rate,
        kilojoule: s.kilojoule,
        zone_durations: s.zone_durations,
      },
    };
  });
}

// ─── AI Coach Summary ────────────────────────────────────────────────────────

export function summarizeWhoopRecovery(data: WhoopRecoveryData): string {
  const lines: string[] = ['WHOOP BIOMETRICS:'];

  if (data.today?.score) {
    const s = data.today.score;
    lines.push(
      `- Today's recovery: ${s.recovery_score}/100 | HRV: ${s.hrv_rmssd_milli.toFixed(1)}ms | RHR: ${s.resting_heart_rate}bpm`,
    );
    if (s.spo2_percentage) lines.push(`- SpO2: ${s.spo2_percentage.toFixed(1)}%`);
  } else {
    lines.push('- Today: Recovery pending (check Whoop app)');
  }

  const scored = data.recent.filter((r) => r.score_state === 'SCORED' && r.score);
  const last7 = scored.slice(-7);
  if (last7.length >= 3) {
    const avgHrv = last7.reduce((s, r) => s + (r.score?.hrv_rmssd_milli ?? 0), 0) / last7.length;
    const avgRhr = last7.reduce((s, r) => s + (r.score?.resting_heart_rate ?? 0), 0) / last7.length;
    lines.push(
      `- 7-day avg HRV: ${avgHrv.toFixed(1)}ms | 7-day avg RHR: ${avgRhr.toFixed(1)}bpm`,
    );

    if (last7.length >= 4) {
      const mid = Math.floor(last7.length / 2);
      const early = last7.slice(0, mid).map((r) => r.score!.hrv_rmssd_milli);
      const late = last7.slice(mid).map((r) => r.score!.hrv_rmssd_milli);
      const avgEarly = early.reduce((a, b) => a + b, 0) / early.length;
      const avgLate = late.reduce((a, b) => a + b, 0) / late.length;
      const delta = avgLate - avgEarly;
      if (Math.abs(delta) > 2) {
        lines.push(`- HRV trend: ${delta > 0 ? '↑ improving' : '↓ declining'} (${delta > 0 ? '+' : ''}${delta.toFixed(1)}ms over 7d)`);
      }
    }
  }

  const lowRecovery = last7.filter((r) => r.score && r.score.recovery_score < 34);
  if (lowRecovery.length > 0) {
    lines.push(`- Low recovery days (last 7d): ${lowRecovery.length} (score < 34)`);
  }

  return lines.join('\n');
}
