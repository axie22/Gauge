import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

// POST /api/revalidate/whoop
// Busts all Whoop unstable_cache entries. Call this when data looks stale.
export async function POST() {
  revalidateTag('whoop-recovery', 'max');
  revalidateTag('whoop-workouts', 'max');
  revalidateTag('whoop-sleep', 'max');
  revalidateTag('whoop-cycles', 'max');
  return NextResponse.json({ ok: true, revalidated: ['whoop-recovery', 'whoop-workouts', 'whoop-sleep', 'whoop-cycles'] });
}
