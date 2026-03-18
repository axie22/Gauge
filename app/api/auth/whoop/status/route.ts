import { NextResponse } from 'next/server';
import { isWhoopConnected } from '@/lib/whoop-server';

export async function GET() {
  const connected = await isWhoopConnected();
  return NextResponse.json({ connected });
}
