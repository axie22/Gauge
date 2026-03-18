import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Whoop sends:
//   X-WHOOP-Signature: HMAC-SHA256 of (timestamp + "." + body) using webhook secret
//   X-WHOOP-Signature-Timestamp: unix timestamp
//
// Set WHOOP_WEBHOOK_SECRET in .env (found in Whoop developer dashboard).
// Requires a public HTTPS URL — for local dev use a tunnel (e.g. ngrok).

function verifySignature(
  body: string,
  timestamp: string,
  signature: string,
  secret: string,
): boolean {
  const payload = `${timestamp}.${body}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(req: NextRequest) {
  const secret = process.env.WHOOP_WEBHOOK_SECRET;
  if (!secret) {
    // Webhook not configured — accept but do nothing
    return NextResponse.json({ ok: true });
  }

  const signature = req.headers.get('x-whoop-signature');
  const timestamp = req.headers.get('x-whoop-signature-timestamp');

  if (!signature || !timestamp) {
    return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 });
  }

  const body = await req.text();

  try {
    if (!verifySignature(body, timestamp, signature, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
  }

  // Reject stale webhooks (> 5 min old)
  const age = Date.now() - parseInt(timestamp, 10) * 1000;
  if (age > 5 * 60 * 1000) {
    return NextResponse.json({ error: 'Stale webhook' }, { status: 401 });
  }

  const event = JSON.parse(body) as { type: string; user_id: number };

  // Log received event — cache TTLs (30min/1hr) handle freshness for now.
  // TODO: when deployed, use revalidateTag to invalidate specific caches on push.
  console.log(`[whoop webhook] ${event.type} for user ${event.user_id}`);

  // Must respond with 2xx within 1 second
  return NextResponse.json({ ok: true });
}
