import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_URL, WHOOP_SCOPES } from '@/lib/whoop';

function generateState(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  // Use Math.random since crypto.getRandomValues may not be available in all edge environments
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// GET /api/auth/whoop — initiates OAuth flow
export async function GET() {
  const clientId = process.env.WHOOP_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'WHOOP_CLIENT_ID not configured in .env' },
      { status: 500 },
    );
  }

  const redirectUri =
    process.env.WHOOP_REDIRECT_URI ??
    'http://localhost:3000/api/auth/whoop/callback';

  const state = generateState();

  // Store state in a short-lived cookie to verify on callback
  const cookieStore = await cookies();
  cookieStore.set('whoop_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: WHOOP_SCOPES,
    state,
  });

  return NextResponse.redirect(`${AUTH_URL}?${params.toString()}`);
}

// GET (when called directly without redirect, e.g. status check from client)
// Note: this is the same GET — but if called with ?status=1 it returns JSON instead of redirecting
// We handle the actual OAuth initiation above; this branch handles status checks.

// DELETE /api/auth/whoop — disconnect (delete stored tokens)
export async function DELETE() {
  const { deleteTokens } = await import('@/lib/whoop-server');
  await deleteTokens();
  return NextResponse.json({ ok: true });
}
