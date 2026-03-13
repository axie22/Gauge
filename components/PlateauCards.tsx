'use client';

import { PlateauResult } from '@/lib/hevy';
import { DangerBadge } from './DangerBadge';
import { useUnits } from '@/lib/units';

interface Props {
  plateaus: PlateauResult[];
}

export function PlateauCards({ plateaus }: Props) {
  const { fmtWeight } = useUnits();

  if (plateaus.length === 0) {
    return (
      <div
        className="h-full flex flex-col"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}
      >
        <h2 className="font-semibold" style={{ fontSize: 14, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
          Plateau Detector
        </h2>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12">
          <div
            className="flex items-center justify-center"
            style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(52,211,153,0.35)' }}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)' }} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>No plateaus detected</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold" style={{ fontSize: 14, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
          Plateau Detector
        </h2>
        <span
          className="tabular-nums"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em' }}
        >
          {plateaus.length} STALLED
        </span>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ marginRight: -4, paddingRight: 4 }}>
        {plateaus.map((p, i) => (
          <div
            key={p.exercise_template_id}
            className="flex items-start gap-3 py-3"
            style={i < plateaus.length - 1 ? { borderBottom: '1px solid var(--border)' } : undefined}
          >
            {/* Risk bar */}
            <div
              className="shrink-0 rounded-full mt-0.5"
              style={{
                width: 2,
                height: 36,
                background: p.risk === 'high' ? 'var(--red)' : 'var(--amber)',
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)' }} className="truncate">
                  {p.exercise_title}
                </span>
                <DangerBadge
                  level={p.risk === 'high' ? 'danger' : 'warning'}
                  label={p.risk === 'high' ? 'High' : 'Med'}
                />
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
                {p.last_best > 0 ? fmtWeight(p.last_best, 1) : 'Bodyweight'} · {p.stall_weeks}w stall
              </div>
              {/* Progress bar */}
              <div
                className="mt-2 rounded-full"
                style={{ height: 2, background: 'var(--surface-up)', width: '100%' }}
              >
                <div
                  className="rounded-full"
                  style={{
                    height: 2,
                    width: `${Math.min(100, (p.stall_weeks / 8) * 100)}%`,
                    background: p.risk === 'high' ? 'var(--red)' : 'var(--amber)',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
