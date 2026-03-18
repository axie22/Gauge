// Whoop API v2 client
// Base URL for all v2 developer endpoints

export const WHOOP_BASE = 'https://api.prod.whoop.com/developer';
const TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';
const AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';

export const WHOOP_SCOPES = [
  'read:recovery',
  'read:workout',
  'read:sleep',
  'read:cycles',
  'offline',
].join(' ');

export { AUTH_URL, TOKEN_URL };

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WhoopTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch ms
}

export interface WhoopTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface WhoopRecoveryScore {
  user_calibrating: boolean;
  recovery_score: number;       // 0–100
  resting_heart_rate: number;   // bpm
  hrv_rmssd_milli: number;      // ms
  spo2_percentage: number | null;
  skin_temp_celsius: number | null;
}

export interface WhoopRecovery {
  cycle_id: string;
  sleep_id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE';
  score: WhoopRecoveryScore | null;
}

export interface WhoopWorkoutScore {
  strain: number;               // 0–21
  average_heart_rate: number;   // bpm
  max_heart_rate: number;       // bpm
  kilojoule: number;
  percent_recorded: number;
  distance_meter: number | null;
  altitude_gain_meter: number | null;
  altitude_change_meter: number | null;
  zone_durations: {
    zone_zero_milli: number;
    zone_one_milli: number;
    zone_two_milli: number;
    zone_three_milli: number;
    zone_four_milli: number;
    zone_five_milli: number;
  };
}

export interface WhoopWorkout {
  id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;  // ISO 8601
  end: string;    // ISO 8601
  timezone_offset: string;
  sport_id: number;
  sport_name: string;
  score_state: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE';
  score: WhoopWorkoutScore | null;
}

export interface WhoopSleepStage {
  total_in_bed_time_milli: number;
  total_awake_time_milli: number;
  total_no_data_time_milli: number;
  total_light_sleep_time_milli: number;
  total_slow_wave_sleep_time_milli: number;
  total_rem_sleep_time_milli: number;
  sleep_cycle_count: number;
  disturbance_count: number;
}

export interface WhoopSleepScore {
  stage_summary: WhoopSleepStage;
  sleep_needed: {
    baseline_milli: number;
    need_from_sleep_debt_milli: number;
    need_from_recent_strain_milli: number;
    need_from_recent_nap_milli: number;
  };
  respiratory_rate: number;
  sleep_performance_percentage: number;
  sleep_consistency_percentage: number;
  sleep_efficiency_percentage: number;
}

export interface WhoopSleep {
  id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE';
  score: WhoopSleepScore | null;
}

export interface WhoopCycleScore {
  strain: number;
  kilojoule: number;
  average_heart_rate: number;
  max_heart_rate: number;
}

export interface WhoopCycle {
  id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string | null;
  timezone_offset: string;
  score_state: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE';
  score: WhoopCycleScore | null;
}

// Sport IDs that overlap with strength/Hevy workouts
export const STRENGTH_SPORT_IDS = new Set([45, 48, 96]);
// 45 = Weightlifting, 48 = Functional Fitness, 96 = HIIT

// ─── API Client ─────────────────────────────────────────────────────────────

interface PaginatedResponse<T> {
  records: T[];
  next_token: string | null;
}

export async function whoopFetch<T>(
  path: string,
  accessToken: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`${WHOOP_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Whoop API ${path} → ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export async function whoopFetchAll<T>(
  path: string,
  accessToken: string,
  params: Record<string, string> = {},
): Promise<T[]> {
  const all: T[] = [];
  let nextToken: string | null = null;

  do {
    const query: Record<string, string> = { ...params, limit: '25' };
    if (nextToken) query.nextToken = nextToken;

    const page = await whoopFetch<PaginatedResponse<T>>(path, accessToken, query);
    all.push(...page.records);
    nextToken = page.next_token;
  } while (nextToken);

  return all;
}

// ─── Token Exchange ──────────────────────────────────────────────────────────

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
): Promise<WhoopTokens> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Token exchange failed ${res.status}: ${body}`);
  }

  const data: WhoopTokenResponse = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<WhoopTokens> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Token refresh failed ${res.status}: ${body}`);
  }

  const data: WhoopTokenResponse = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}
