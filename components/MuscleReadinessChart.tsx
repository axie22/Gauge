'use client';

import { useEffect, useRef } from 'react';
import { MuscleReadiness } from '@/lib/hevy';

interface Props {
  results: MuscleReadiness[];
}

const STATUS_CONFIG: Record<MuscleReadiness['status'], {
  accent: string; bar: string; text: string; label: string;
}> = {
  fresh:       { accent: 'var(--green)',  bar: 'var(--green)',  text: 'var(--green)',  label: 'Fresh'       },
  optimal:     { accent: 'var(--accent)', bar: 'var(--accent)', text: 'var(--accent)', label: 'Optimal'     },
  fatigued:    { accent: 'var(--amber)',  bar: 'var(--amber)',  text: 'var(--amber)',  label: 'Fatigued'    },
  overtrained: { accent: 'var(--red)',    bar: 'var(--red)',    text: 'var(--red)',    label: 'Overtrained' },
};

function AnimatedBar({ readiness, color }: { readiness: number; color: string }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    el.style.width = '0%';
    const raf = requestAnimationFrame(() => {
      el.style.transition = 'width 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.width = `${readiness}%`;
    });
    return () => cancelAnimationFrame(raf);
  }, [readiness]);

  return (
    <div
      className="relative rounded-full overflow-hidden"
      style={{ height: 3, background: 'var(--surface-up)' }}
    >
      <div
        ref={barRef}
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: color, width: 0 }}
      />
    </div>
  );
}

export function MuscleReadinessChart({ results }: Props) {
  const display = results.slice(0, 12);
  const fatiguedCount    = results.filter((r) => r.status === 'fatigued').length;
  const overtrainedCount = results.filter((r) => r.status === 'overtrained').length;

  const col1 = display.slice(0, Math.ceil(display.length / 2));
  const col2 = display.slice(Math.ceil(display.length / 2));

  return (
    <div
      className="h-full"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-semibold" style={{ fontSize: 14, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
            Muscle Readiness
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em', marginTop: 3 }}>
            SRA FITNESS-FATIGUE MODEL
          </p>
        </div>
        <div className="flex items-center gap-2">
          {overtrainedCount > 0 && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                background: 'var(--red-dim)',
                color: 'var(--red)',
                border: '1px solid rgba(248,113,113,0.2)',
              }}
            >
              {overtrainedCount} overtrained
            </span>
          )}
          {fatiguedCount > 0 && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                background: 'var(--amber-dim)',
                color: 'var(--amber)',
                border: '1px solid rgba(251,191,36,0.2)',
              }}
            >
              {fatiguedCount} fatigued
            </span>
          )}
        </div>
      </div>

      {display.length === 0 ? (
        <div className="flex h-40 items-center justify-center" style={{ color: 'var(--text-3)', fontSize: 13 }}>
          Log workouts to see readiness
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
          {[col1, col2].map((col, ci) => (
            <div key={ci}>
              {col.map((r, i) => {
                const { accent, bar, text, label } = STATUS_CONFIG[r.status];
                const isLast = i === col.length - 1;
                return (
                  <div
                    key={r.muscle_group}
                    className="flex items-center gap-3 py-3"
                    style={!isLast ? { borderBottom: '1px solid var(--border)' } : {}}
                  >
                    {/* Accent strip */}
                    <div style={{ width: 2, height: 32, borderRadius: 2, background: accent, flexShrink: 0 }} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className="capitalize"
                          style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}
                        >
                          {r.muscle_group.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className="tabular-nums"
                            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: text }}
                          >
                            {r.readiness}%
                          </span>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 9,
                              letterSpacing: '0.08em',
                              color: accent,
                              textTransform: 'uppercase',
                            }}
                          >
                            {label}
                          </span>
                        </div>
                      </div>
                      <AnimatedBar readiness={r.readiness} color={bar} />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
