import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { exchangeCodeForTokens } from '@/lib/whoop';
import { writeTokens } from '@/lib/whoop-server';

// GET /api/auth/whoop/callback?code=...&state=...
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle user denial or error from Whoop
  if (error) {
    return NextResponse.redirect(
      new URL(`/profile?whoop=error&reason=${encodeURIComponent(error)}`, req.url),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/profile?whoop=error&reason=missing_params', req.url));
  }

  // Verify state to prevent CSRF
  const cookieStore = await cookies();
  const storedState = cookieStore.get('whoop_oauth_state')?.value;
  cookieStore.delete('whoop_oauth_state');

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL('/profile?whoop=error&reason=state_mismatch', req.url));
  }

  const redirectUri =
    process.env.WHOOP_REDIRECT_URI ??
    'http://localhost:3000/api/auth/whoop/callback';

  try {
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    await writeTokens(tokens);
    // Bust stale null caches from before the token existed
    revalidateTag('whoop-recovery', 'max');
    revalidateTag('whoop-workouts', 'max');
    revalidateTag('whoop-sleep', 'max');
    revalidateTag('whoop-cycles', 'max');
    return NextResponse.redirect(new URL('/profile?whoop=connected', req.url));
  } catch (err) {
    console.error('[whoop] Callback token exchange failed:', err);
    return NextResponse.redirect(
      new URL('/profile?whoop=error&reason=token_exchange', req.url),
    );
  }
}
