'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchLog, entryHasData, lastNDays, NutritionLog } from '@/lib/nutrition';

function avg(vals: (number | null)[]): number | null {
  const nums = vals.filter((v): v is number => v !== null);
  return nums.length > 0 ? nums.reduce((s, v) => s + v, 0) / nums.length : null;
}

function fmt(n: number | null): string {
  if (n === null) return '—';
  return Math.round(n).toLocaleString();
}

export function NutritionStrip() {
  const [log, setLog] = useState<NutritionLog | null>(null);

  useEffect(() => {
    fetchLog().then(setLog);
  }, []);

  const days = lastNDays(7);
  const avgCalories = log ? avg(days.map((d) => log[d]?.calories ?? null)) : null;
  const avgProtein  = log ? avg(days.map((d) => log[d]?.protein_g ?? null)) : null;
  const trackedDays = log ? days.filter((d) => log[d] && entryHasData(log[d])).length : null;

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '16px 20px',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.14em',
            color: 'var(--text-3)',
            fontWeight: 600,
          }}
        >
          NUTRITION · 7D AVG
          {trackedDays !== null && (
            <span style={{ marginLeft: 6, color: 'var(--text-3)' }}>
              {trackedDays}/7 TRACKED
            </span>
          )}
        </span>
        <Link
          href="/nutrition"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.08em',
            color: 'var(--accent)',
            textDecoration: 'none',
          }}
        >
          LOG →
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.1em', marginBottom: 2 }}>
            CALORIES
          </div>
          <div className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
            {fmt(avgCalories)}
            {avgCalories !== null && (
              <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-3)', marginLeft: 3 }}>kcal</span>
            )}
          </div>
        </div>

        <div style={{ width: 1, height: 32, background: 'var(--border)' }} />

        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.1em', marginBottom: 2 }}>
            PROTEIN
          </div>
          <div className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.01em' }}>
            {fmt(avgProtein)}
            {avgProtein !== null && (
              <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-3)', marginLeft: 3 }}>g</span>
            )}
          </div>
        </div>

        {trackedDays === 0 && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em' }}>
            No data logged this week
          </p>
        )}
      </div>
    </div>
  );
}
