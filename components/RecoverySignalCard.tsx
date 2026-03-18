'use client';

import Link from 'next/link';
import { WhoopRecoveryData } from '@/lib/whoop-server';

interface Props {
  data: WhoopRecoveryData | null;
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

export function RecoverySignalCard({ data }: Props) {
  const score = data?.today?.score;

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
          RECOVERY · WHOOP
        </span>
        <Link
          href="/recovery"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.08em',
            color: 'var(--accent)',
            textDecoration: 'none',
          }}
        >
          VIEW →
        </Link>
      </div>

      {score ? (
        <div className="flex items-center gap-4">
          <div>
            <div
              className="tabular-nums leading-none"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 32,
                fontWeight: 700,
                color: recoveryColor(score.recovery_score),
                letterSpacing: '-0.02em',
              }}
            >
              {score.recovery_score}
              <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-3)' }}>%</span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 8,
                letterSpacing: '0.1em',
                color: recoveryColor(score.recovery_score),
                marginTop: 3,
              }}
            >
              {recoveryLabel(score.recovery_score)}
            </div>
          </div>

          <div
            className="flex-1 grid grid-cols-2 gap-3"
            style={{ borderLeft: '1px solid var(--border)', paddingLeft: 16 }}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.1em', marginBottom: 2 }}>HRV</div>
              <div className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>
                {Math.round(score.hrv_rmssd_milli)}
                <span style={{ fontSize: 9, fontWeight: 400, color: 'var(--text-3)', marginLeft: 2 }}>ms</span>
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.1em', marginBottom: 2 }}>RHR</div>
              <div className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>
                {score.resting_heart_rate}
                <span style={{ fontSize: 9, fontWeight: 400, color: 'var(--text-3)', marginLeft: 2 }}>bpm</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {data ? 'Waiting for today\'s score…' : '— Connect Whoop'}
          </span>
          {!data && (
            <a
              href="/api/auth/whoop"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '0.08em',
                fontWeight: 700,
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid var(--accent-border)',
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
                textDecoration: 'none',
              }}
            >
              CONNECT
            </a>
          )}
        </div>
      )}
    </div>
  );
}
