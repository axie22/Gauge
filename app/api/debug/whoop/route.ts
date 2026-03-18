import { NextResponse } from 'next/server';
import { readTokens, getValidToken } from '@/lib/whoop-server';
import { WHOOP_BASE } from '@/lib/whoop';

// GET /api/debug/whoop
// Bypasses all caches. Returns raw token state + raw API responses.
// Remove this file before deploying publicly.

async function rawFetch(path: string, token: string, params: Record<string, string> = {}) {
  const url = new URL(`${WHOOP_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const text = await res.text();
  let body: unknown;
  try { body = JSON.parse(text); } catch { body = text; }

  return { status: res.status, ok: res.ok, body };
}

export async function GET() {
  const result: Record<string, unknown> = {};

  // 1. Token file state
  const stored = await readTokens();
  result.token_file = stored
    ? {
        has_access_token: !!stored.access_token,
        has_refresh_token: !!stored.refresh_token,
        expires_at: new Date(stored.expires_at).toISOString(),
        expires_in_minutes: Math.round((stored.expires_at - Date.now()) / 60000),
        is_expired: Date.now() > stored.expires_at,
      }
    : null;

  // 2. Get a valid token (will refresh if needed)
  const token = await getValidToken();
  result.token_valid = token !== null;

  if (!token) {
    return NextResponse.json({ ...result, error: 'No valid token — reconnect Whoop from the Profile page' });
  }

  const end = new Date();
  const start30 = new Date(end);
  start30.setDate(end.getDate() - 30);
  const start7 = new Date(end);
  start7.setDate(end.getDate() - 7);

  const dateParams30 = { start: start30.toISOString(), end: end.toISOString(), limit: '5' };
  const dateParams7  = { start: start7.toISOString(),  end: end.toISOString(), limit: '3' };

  // 3. Probe each endpoint
  const [recovery, workouts, sleep, cycles, profile] = await Promise.all([
    rawFetch('/v2/recovery',          token, dateParams30),
    rawFetch('/v2/activity/workout',  token, dateParams7),
    rawFetch('/v2/activity/sleep',    token, dateParams7),
    rawFetch('/v2/cycle',             token, dateParams7),
    rawFetch('/v2/user/profile/basic', token),
  ]);

  result.endpoints = { recovery, workouts, sleep, cycles, profile };

  return NextResponse.json(result, { status: 200 });
}
