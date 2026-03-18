'use client';

import { useMemo } from 'react';
import { WhoopSleep } from '@/lib/whoop';

interface Props {
  records: WhoopSleep[];
}

function fmtDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmtDate(isoStr: string): string {
  return new Date(isoStr).toLocaleString('default', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

// Sleep stage color scale
const STAGE_COLORS = {
  sws:   { color: '#00B4FF',              label: 'Deep' },
  rem:   { color: 'var(--green)',          label: 'REM'  },
  light: { color: 'rgba(0,180,255,0.30)', label: 'Light' },
  awake: { color: 'rgba(255,255,255,0.06)', label: 'Awake' },
};

function performanceColor(score: number): string {
  if (score >= 85) return 'var(--green)';
  if (score >= 70) return 'var(--amber)';
  return 'var(--red)';
}

export function WhoopSleepBreakdown({ records }: Props) {
  // Last 7 non-nap sleep records, most recent last
  const nights = useMemo(() => {
    return records
      .filter((r) => !r.nap && r.score_state === 'SCORED' && r.score)
      .slice(-7);
  }, [records]);

  if (nights.length === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', minHeight: 120 }}
      >
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No sleep data available yet</p>
      </div>
    );
  }

  // Find max total bed time for scaling
  const maxBedMs = Math.max(
    ...nights.map((r) => {
      const s = r.score!.stage_summary;
      return s.total_in_bed_time_milli;
    }),
  );

  // Averages
  const avgPerf = nights.reduce((s, r) => s + r.score!.sleep_performance_percentage, 0) / nights.length;
  const avgSws = nights.reduce((s, r) => s + r.score!.stage_summary.total_slow_wave_sleep_time_milli, 0) / nights.length;
  const avgRem = nights.reduce((s, r) => s + r.score!.stage_summary.total_rem_sleep_time_milli, 0) / nights.length;
  const avgTotal = nights.reduce((s, r) => s + r.score!.stage_summary.total_in_bed_time_milli, 0) / nights.length;

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="font-semibold" style={{ fontSize: 14, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
            Sleep Breakdown
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em', marginTop: 3 }}>
            LAST {nights.length} NIGHTS
          </p>
        </div>

        {/* Avg stats */}
        <div className="flex gap-5">
          {[
            { label: 'AVG PERF', value: `${Math.round(avgPerf)}%`, color: performanceColor(avgPerf) },
            { label: 'AVG DEEP', value: fmtDuration(avgSws) },
            { label: 'AVG REM', value: fmtDuration(avgRem) },
            { label: 'AVG TOTAL', value: fmtDuration(avgTotal) },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-right">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.1em', marginBottom: 2 }}>
                {label}
              </div>
              <div
                className="tabular-nums"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: color ?? 'var(--text-1)' }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stage legend */}
      <div className="flex gap-4 mb-5">
        {Object.entries(STAGE_COLORS).map(([key, { color, label }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color, border: key === 'awake' ? '1px solid var(--border-up)' : undefined }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.08em' }}>
              {label.toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      {/* Nightly bars */}
      <div className="space-y-2.5">
        {nights.map((r) => {
          const s = r.score!.stage_summary;
          const totalMs = s.total_in_bed_time_milli;
          const barWidth = totalMs / maxBedMs; // fraction of max width

          const stages = [
            { ms: s.total_slow_wave_sleep_time_milli, ...STAGE_COLORS.sws },
            { ms: s.total_rem_sleep_time_milli,        ...STAGE_COLORS.rem },
            { ms: s.total_light_sleep_time_milli,      ...STAGE_COLORS.light },
            { ms: s.total_awake_time_milli,             ...STAGE_COLORS.awake },
          ].filter((seg) => seg.ms > 0);

          const perf = r.score!.sleep_performance_percentage;

          return (
            <div key={r.id} className="flex items-center gap-3">
              {/* Date */}
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-3)',
                  letterSpacing: '0.04em',
                  width: 80,
                  flexShrink: 0,
                }}
              >
                {fmtDate(r.start).toUpperCase()}
              </div>

              {/* Bar */}
              <div className="flex-1" style={{ height: 20, position: 'relative' }}>
                {/* Background track */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'var(--surface-up)',
                    borderRadius: 4,
                  }}
                />
                {/* Filled portion */}
                <div
                  className="flex overflow-hidden"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${barWidth * 100}%`,
                    borderRadius: 4,
                  }}
                >
                  {stages.map((seg, i) => (
                    <div
                      key={i}
                      style={{
                        width: `${(seg.ms / totalMs) * 100}%`,
                        background: seg.color,
                        minWidth: 2,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Duration + performance */}
              <div className="flex items-center gap-2 shrink-0" style={{ width: 90, justifyContent: 'flex-end' }}>
                <span
                  className="tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-2)' }}
                >
                  {fmtDuration(totalMs)}
                </span>
                <span
                  className="tabular-nums"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: performanceColor(perf),
                  }}
                >
                  {Math.round(perf)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
