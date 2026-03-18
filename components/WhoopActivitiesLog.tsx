'use client';

import { useState } from 'react';
import { WhoopWorkout } from '@/lib/whoop';

interface Props {
  workouts: WhoopWorkout[];
}

function strainColor(strain: number): string {
  if (strain >= 18) return 'var(--red)';
  if (strain >= 14) return 'var(--amber)';
  if (strain >= 10) return 'var(--green)';
  return 'var(--text-2)';
}

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('default', {
    month: 'short', day: 'numeric', weekday: 'short',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('default', {
    hour: 'numeric', minute: '2-digit',
  });
}

function ZoneBar({ zones }: { zones: WhoopWorkout['score'] }) {
  if (!zones) return null;
  const z = zones.zone_durations;
  const total = Object.values(z).reduce((s, v) => s + v, 0);
  if (total === 0) return null;

  const bars = [
    { key: 'z1', ms: z.zone_one_milli,   color: '#3b82f6',        label: 'Z1' },
    { key: 'z2', ms: z.zone_two_milli,   color: 'var(--green)',   label: 'Z2' },
    { key: 'z3', ms: z.zone_three_milli, color: 'var(--amber)',   label: 'Z3' },
    { key: 'z4', ms: z.zone_four_milli,  color: '#f97316',        label: 'Z4' },
    { key: 'z5', ms: z.zone_five_milli,  color: 'var(--red)',     label: 'Z5' },
  ].filter((b) => b.ms > 0);

  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-3)', letterSpacing: '0.1em', marginBottom: 4 }}>HR ZONES</div>
      <div className="flex gap-px rounded overflow-hidden" style={{ height: 5 }}>
        {bars.map((b) => (
          <div key={b.key} style={{ width: `${(b.ms / total) * 100}%`, background: b.color }} />
        ))}
      </div>
      <div className="flex gap-3 mt-1">
        {bars.map((b) => (
          <span key={b.key} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-3)' }}>
            <span style={{ color: b.color }}>{b.label}</span> {Math.round(b.ms / 60000)}m
          </span>
        ))}
      </div>
    </div>
  );
}

export function WhoopActivitiesLog({ workouts }: Props) {
  const [showAll, setShowAll] = useState(false);

  // Sort newest first
  const sorted = [...workouts]
    .filter((w) => w.score_state === 'SCORED' && w.score)
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

  const visible = showAll ? sorted : sorted.slice(0, 10);

  if (sorted.length === 0) {
    return (
      <div
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}
      >
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>All Activities</h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>No scored activities yet</p>
      </div>
    );
  }

  return (
    <div
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
            All Activities
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 2, letterSpacing: '0.06em' }}>
            {sorted.length} SCORED WORKOUTS
          </p>
        </div>
        <div className="flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="4" stroke="var(--accent)" strokeWidth="1.2" />
            <circle cx="5" cy="5" r="1.8" fill="var(--accent)" />
          </svg>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.1em', fontWeight: 700 }}>
            WHOOP
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {visible.map((w) => {
          const s = w.score!;
          const kcal = Math.round(s.kilojoule * 0.239);
          const dur = formatDuration(w.start, w.end);

          return (
            <div
              key={w.id}
              style={{
                background: 'var(--surface-up)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '12px 14px',
              }}
            >
              {/* Header row */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', textTransform: 'capitalize' }}>
                    {w.sport_name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', marginTop: 2, letterSpacing: '0.06em' }}>
                    {formatDate(w.start).toUpperCase()} · {formatTime(w.start)} · {dur}
                  </div>
                </div>
                <div
                  className="tabular-nums"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 22,
                    fontWeight: 700,
                    color: strainColor(s.strain),
                    lineHeight: 1,
                  }}
                >
                  {s.strain.toFixed(1)}
                  <span style={{ fontSize: 9, fontWeight: 400, color: 'var(--text-3)', marginLeft: 3 }}>STRAIN</span>
                </div>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  { label: 'AVG HR', value: s.average_heart_rate, unit: 'bpm' },
                  { label: 'MAX HR', value: s.max_heart_rate, unit: 'bpm' },
                  { label: 'CALORIES', value: kcal, unit: 'kcal' },
                ].map(({ label, value, unit }) => (
                  <div key={label}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-3)', letterSpacing: '0.1em', marginBottom: 2 }}>
                      {label}
                    </div>
                    <div className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>
                      {value}
                      <span style={{ fontSize: 9, fontWeight: 400, color: 'var(--text-3)', marginLeft: 2 }}>{unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <ZoneBar zones={s} />
            </div>
          );
        })}
      </div>

      {sorted.length > 10 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '8px',
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-3)',
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          {showAll ? 'SHOW LESS' : `SHOW ALL ${sorted.length} ACTIVITIES`}
        </button>
      )}
    </div>
  );
}
