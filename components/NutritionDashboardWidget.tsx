'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  fetchLog,
  entryHasData,
  lastNDays,
  NutritionLog,
} from '@/lib/nutrition';

function fmt(n: number | null, decimals = 0): string {
  if (n === null) return '—';
  return decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString();
}

function avg(vals: (number | null)[]): number | null {
  const nums = vals.filter((v): v is number => v !== null);
  return nums.length > 0 ? nums.reduce((s, v) => s + v, 0) / nums.length : null;
}

function RecoveryInsight({
  avgCalories,
  avgProtein,
  trackedDays,
}: {
  avgCalories: number | null;
  avgProtein: number | null;
  trackedDays: number;
}) {
  const items: { text: string; color: string }[] = [];

  if (trackedDays < 3) {
    items.push({ text: `Only ${trackedDays}/7 days logged — more data improves accuracy`, color: 'var(--text-3)' });
  } else {
    if (avgProtein !== null) {
      if (avgProtein >= 150) {
        items.push({ text: `High protein avg (${Math.round(avgProtein)}g) — excellent for muscle repair`, color: 'var(--green)' });
      } else if (avgProtein >= 100) {
        items.push({ text: `Moderate protein avg (${Math.round(avgProtein)}g) — adequate for recovery`, color: 'var(--amber)' });
      } else {
        items.push({ text: `Low protein avg (${Math.round(avgProtein)}g) — increasing protein may speed recovery`, color: 'var(--red)' });
      }
    }
    if (avgCalories !== null && avgCalories < 1600) {
      items.push({ text: `Low caloric intake (${Math.round(avgCalories)} kcal avg) — under-fueling can impair adaptation`, color: 'var(--amber)' });
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-4 space-y-1.5">
      {items.map((item, i) => (
        <p
          key={i}
          className="flex items-start gap-1.5"
          style={{ fontSize: 11, color: item.color }}
        >
          <span className="mt-0.5 shrink-0">›</span>
          {item.text}
        </p>
      ))}
    </div>
  );
}

export function NutritionDashboardWidget() {
  const [log, setLog] = useState<NutritionLog | null>(null);

  useEffect(() => {
    fetchLog().then(setLog);
  }, []);

  if (log === null) return null;

  const today = new Date().toISOString().slice(0, 10);
  const days = lastNDays(7);
  const hasAnyData = days.some((d) => log[d] && entryHasData(log[d]));

  const calorieVals = days.map((d) => log[d]?.calories ?? null);
  const proteinVals = days.map((d) => log[d]?.protein_g ?? null);
  const avgCalories = avg(calorieVals);
  const avgProtein = avg(proteinVals);
  const trackedDays = days.filter((d) => log[d] && entryHasData(log[d])).length;

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="font-semibold" style={{ fontSize: 14, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
            Nutrition
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em', marginTop: 3 }}>
            LAST 7 DAYS · {trackedDays}/7 TRACKED
          </p>
        </div>
        <Link
          href="/nutrition"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.08em',
            color: 'var(--accent)',
            textDecoration: 'none',
          }}
        >
          LOG NUTRITION →
        </Link>
      </div>

      {!hasAnyData ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No nutrition data logged yet</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em' }}>
            Track calories and macros to see recovery insights here
          </p>
          <Link
            href="/nutrition"
            style={{
              marginTop: 4,
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent-border)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              padding: '8px 16px',
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            START LOGGING
          </Link>
        </div>
      ) : (
        <>
          {/* 7-day chips */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((d) => {
              const entry = log[d];
              const hasData = entry && entryHasData(entry);
              const isToday = d === today;
              const dayLabel = new Date(d + 'T12:00:00Z').toLocaleString('default', {
                weekday: 'short',
                timeZone: 'UTC',
              });
              return (
                <Link
                  key={d}
                  href="/nutrition"
                  className="rounded-xl text-center transition-colors"
                  style={{
                    padding: '8px 6px',
                    border: `1px solid ${isToday ? 'var(--accent-border)' : hasData ? 'var(--border-up)' : 'var(--border)'}`,
                    background: isToday ? 'var(--accent-dim)' : hasData ? 'var(--surface-up)' : 'transparent',
                    textDecoration: 'none',
                    display: 'block',
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    marginBottom: 6,
                    color: isToday ? 'var(--accent)' : 'var(--text-3)',
                    textTransform: 'uppercase',
                  }}>
                    {dayLabel}
                  </div>
                  {hasData ? (
                    <>
                      <div
                        className="tabular-nums leading-none"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-1)' }}
                      >
                        {entry.calories !== null ? Math.round(entry.calories) : '—'}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', marginTop: 2 }}>
                        KCAL
                      </div>
                      <div
                        className="tabular-nums leading-none"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--accent)', marginTop: 5 }}
                      >
                        {entry.protein_g !== null ? `${Math.round(entry.protein_g)}g` : '—'}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)' }}>
                        PRO
                      </div>
                    </>
                  ) : (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>—</div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Averages */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'AVG CALORIES', value: fmt(avgCalories), unit: 'kcal' },
              { label: 'AVG PROTEIN', value: fmt(avgProtein), unit: 'g' },
              { label: 'AVG CARBS', value: fmt(avg(days.map((d) => log[d]?.carbs_g ?? null))), unit: 'g' },
              { label: 'AVG FAT', value: fmt(avg(days.map((d) => log[d]?.fat_g ?? null))), unit: 'g' },
            ].map(({ label, value, unit }) => (
              <div
                key={label}
                style={{ background: 'var(--surface-up)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.1em' }}>
                  {label}
                </div>
                <div
                  className="tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginTop: 4 }}
                >
                  {value}{' '}
                  <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-3)' }}>{unit}</span>
                </div>
              </div>
            ))}
          </div>

          <RecoveryInsight
            avgCalories={avgCalories}
            avgProtein={avgProtein}
            trackedDays={trackedDays}
          />
        </>
      )}
    </div>
  );
}
