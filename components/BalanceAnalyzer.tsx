'use client';

import { useMemo, useState } from 'react';
import { EnrichedWorkout, BalanceResult } from '@/lib/hevy';
import { analyzeBalance } from '@/lib/analytics';
import { useUnits } from '@/lib/units';

interface Props {
  workouts: EnrichedWorkout[];
  initialBalance: BalanceResult;
}

type Period = 30 | 90 | 365;

function RatioPair({
  leftLabel,
  leftVol,
  rightLabel,
  rightVol,
  ratio,
  isWarning,
  fmtVolume,
}: {
  leftLabel: string;
  leftVol: number;
  rightLabel: string;
  rightVol: number;
  ratio: number;
  isWarning: boolean;
  fmtVolume: (kg: number) => string;
}) {
  const total = leftVol + rightVol;
  const leftPct = total > 0 ? (leftVol / total) * 100 : 50;
  const rightPct = total > 0 ? (rightVol / total) * 100 : 50;
  const ratioColor = isWarning ? 'var(--amber)' : 'var(--green)';

  return (
    <div style={{ paddingTop: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500 }}>
          {leftLabel} / {rightLabel}
        </span>
        <span
          className="tabular-nums"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            fontWeight: 700,
            color: ratioColor,
          }}
        >
          {ratio === 99 ? '∞' : ratio.toFixed(2)}x
        </span>
      </div>

      {/* Left bar */}
      <div className="mb-1.5">
        <div className="flex items-center justify-between mb-1">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em' }}>
            {leftLabel.toUpperCase()}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
            {fmtVolume(leftVol)}
          </span>
        </div>
        <div style={{ height: 4, background: 'var(--surface-up)', borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${leftPct}%`,
              background: isWarning ? 'var(--amber)' : 'var(--accent)',
              borderRadius: 2,
              transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>
      </div>

      {/* Right bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em' }}>
            {rightLabel.toUpperCase()}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-2)' }}>
            {fmtVolume(rightVol)}
          </span>
        </div>
        <div style={{ height: 4, background: 'var(--surface-up)', borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${rightPct}%`,
              background: 'var(--surface-hover)',
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function BalanceAnalyzer({ workouts, initialBalance }: Props) {
  const [period, setPeriod] = useState<Period>(30);
  const { fmtVolume } = useUnits();

  const balance = useMemo(() => {
    if (period === initialBalance.period_days) return initialBalance;
    return analyzeBalance(workouts, period);
  }, [period, workouts, initialBalance]);

  const periods: Period[] = [30, 90, 365];
  const pushPullWarning = balance.push_pull_ratio > 2.0;
  const quadHipWarning = balance.quad_hip_ratio > 2.5;

  return (
    <div
      className="h-full"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold" style={{ fontSize: 14, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
            Strength Balance
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em', marginTop: 3 }}>
            VOLUME RATIOS
          </p>
        </div>
        <div
          className="flex rounded overflow-hidden"
          style={{ border: '1px solid var(--border-up)' }}
        >
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.08em',
                padding: '5px 10px',
                color: period === p ? 'var(--text-1)' : 'var(--text-3)',
                background: period === p ? 'var(--surface-up)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {p === 365 ? '1Y' : `${p}D`}
            </button>
          ))}
        </div>
      </div>

      {balance.push_volume === 0 && balance.pull_volume === 0 ? (
        <div className="flex h-40 items-center justify-center" style={{ color: 'var(--text-3)', fontSize: 13 }}>
          No push/pull data for this period
        </div>
      ) : (
        <div>
          <RatioPair
            leftLabel="Push"
            leftVol={balance.push_volume}
            rightLabel="Pull"
            rightVol={balance.pull_volume}
            ratio={balance.push_pull_ratio}
            isWarning={pushPullWarning}
            fmtVolume={fmtVolume}
          />
          <RatioPair
            leftLabel="Quad"
            leftVol={balance.quad_volume}
            rightLabel="Hip"
            rightVol={balance.hip_volume}
            ratio={balance.quad_hip_ratio}
            isWarning={quadHipWarning}
            fmtVolume={fmtVolume}
          />

          {balance.warning && (
            <div
              className="mt-4 rounded-lg px-3 py-2.5 text-xs"
              style={{
                background: 'var(--amber-dim)',
                border: '1px solid rgba(251,191,36,0.2)',
                color: 'var(--amber)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
              }}
            >
              {balance.warning}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
