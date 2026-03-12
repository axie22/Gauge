import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { NutritionLog, NutritionEntry } from '@/lib/nutrition';

const DATA_PATH = path.join(process.cwd(), 'data', 'nutrition.json');

async function readLog(): Promise<NutritionLog> {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw) as NutritionLog;
  } catch {
    return {};
  }
}

async function writeLog(log: NutritionLog): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(log, null, 2), 'utf-8');
}

export async function GET() {
  return NextResponse.json(await readLog());
}

export async function POST(req: NextRequest) {
  const entry: NutritionEntry = await req.json();
  const log = await readLog();
  log[entry.date] = entry;
  await writeLog(log);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date');
  if (!date) {
    return NextResponse.json({ error: 'date query param required' }, { status: 400 });
  }
  const log = await readLog();
  delete log[date];
  await writeLog(log);
  return NextResponse.json({ ok: true });
}
