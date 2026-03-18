'use client';

import { WhoopRecoveryData } from '@/lib/whoop-server';

interface Props {
  data: WhoopRecoveryData;
}

function recoveryColor(score: number): string {
  if (score >= 67) return 'var(--green)';
  if (score >= 34) return 'var(--amber)';
  return 'var(--red)';
}

function recoveryLabel(score: number): string {
  if (score >= 67) return 'RECOVERED';
  if (score >= 34) return 'MODERATE';
  return 'LOW';
}

function fmtMs(ms: number): string {
  return `${Math.round(ms)}`;
}

function StatCell({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  color?: string;
}) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.12em', marginBottom: 4 }}>
        {label}
      </div>
      <div
        className="tabular-nums leading-none"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: color ?? 'var(--text-1)' }}
      >
        {value}
        {unit && <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-3)', marginLeft: 3 }}>{unit}</span>}
      </div>
    </div>
  );
}

export function WhoopRecoveryCard({ data }: Props) {
  const recovery = data.today;
  const score = recovery?.score;

  // 7-day trend from recent records
  const scored = data.recent
    .filter((r) => r.score_state === 'SCORED' && r.score)
    .slice(-7);

  const avgHrv =
    scored.length >= 2
      ? scored.reduce((s, r) => s + (r.score?.hrv_rmssd_milli ?? 0), 0) / scored.length
      : null;

  return (
    <div
      className="h-full"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="font-semibold" style={{ fontSize: 14, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
            Recovery
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em', marginTop: 3 }}>
            POWERED BY WHOOP
          </p>
        </div>

        {/* Recovery score — large number */}
        {score ? (
          <div className="text-right">
            <div
              className="tabular-nums leading-none"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 40,
                fontWeight: 700,
                color: recoveryColor(score.recovery_score),
                letterSpacing: '-0.02em',
              }}
            >
              {score.recovery_score}
              <span style={{ fontSize: 18, color: 'var(--text-3)', fontWeight: 400 }}>%</span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '0.1em',
                color: recoveryColor(score.recovery_score),
                marginTop: 4,
              }}
            >
              {recoveryLabel(score.recovery_score)}
            </div>
          </div>
        ) : (
          <div className="text-right">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-3)' }}>
              {recovery?.score_state === 'PENDING_SCORE' ? 'Pending…' : '—'}
            </div>
          </div>
        )}
      </div>

      {/* Metrics row */}
      {score ? (
        <div
          className="grid grid-cols-3 gap-4"
          style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}
        >
          <StatCell
            label="HRV"
            value={fmtMs(score.hrv_rmssd_milli)}
            unit="ms"
            color="var(--text-1)"
          />
          <StatCell
            label="RHR"
            value={String(score.resting_heart_rate)}
            unit="bpm"
            color="var(--text-1)"
          />
          {avgHrv !== null && (
            <StatCell
              label="7D AVG HRV"
              value={fmtMs(avgHrv)}
              unit="ms"
              color={
                score.hrv_rmssd_milli > avgHrv * 1.05
                  ? 'var(--green)'
                  : score.hrv_rmssd_milli < avgHrv * 0.9
                  ? 'var(--red)'
                  : 'var(--text-2)'
              }
            />
          )}
        </div>
      ) : (
        <div
          style={{ borderTop: '1px solid var(--border)', paddingTop: 16, color: 'var(--text-3)', fontSize: 12 }}
        >
          {data.recent.length === 0
            ? 'No recovery data yet — wear your Whoop while sleeping.'
            : 'Waiting for today\'s recovery score to post.'}
        </div>
      )}

      {/* Trend sparkline — simple row of colored dots for last 7 days */}
      {scored.length >= 2 && (
        <div className="mt-4 flex items-center gap-1.5">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.08em', marginRight: 4 }}>
            7D
          </span>
          {scored.map((r, i) => {
            const s = r.score!.recovery_score;
            return (
              <div
                key={i}
                title={`${r.created_at.slice(0, 10)}: ${s}%`}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: recoveryColor(s),
                  opacity: 0.6 + (i / scored.length) * 0.4,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
