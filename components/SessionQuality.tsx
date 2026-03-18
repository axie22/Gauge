'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { SessionQualityResult } from '@/lib/hevy';
import { WhoopRecovery } from '@/lib/whoop';

type ChartPoint = SessionQualityResult & {
  rolling_avg: number;
  recovery_normalized: number | null; // recovery score / 10 to fit 0-10 scale
};

interface Props {
  qualities: SessionQualityResult[];
  recoveryRecords?: WhoopRecovery[];
}

function scoreColor(score: number): string {
  if (score >= 7.5) return '#34d399';
  if (score >= 5) return '#fbbf24';
  return '#f87171';
}

const CustomDot = (props: { cx?: number; cy?: number; payload?: SessionQualityResult }) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill={scoreColor(payload.score)}
      stroke="var(--bg)"
      strokeWidth={1.5}
    />
  );
};

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: 'var(--surface-up)', border: '1px solid var(--border-up)', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em', marginBottom: 6 }}>
        {d.date}
      </div>
      <div className="space-y-1">
        <div className="flex justify-between gap-6">
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Score</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: scoreColor(d.score) }}>
            {d.score}/10
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>7-session avg</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>
            {d.rolling_avg.toFixed(1)}
          </span>
        </div>
        {d.recovery_normalized !== null && (
          <div className="flex justify-between gap-6">
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Recovery</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--green)' }}>
              {Math.round(d.recovery_normalized * 10)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export function SessionQuality({ qualities, recoveryRecords }: Props) {
  const recent = qualities.slice(-60);

  const chartData = useMemo<ChartPoint[]>(() => {
    return recent.map((q, i) => {
      const window = recent.slice(Math.max(0, i - 6), i + 1);
      const avg = window.reduce((s, w) => s + w.score, 0) / window.length;

      // Match recovery record by date — Whoop posts recovery the morning of that day
      const recovery = recoveryRecords?.find(
        (r) => r.created_at.slice(0, 10) === q.date && r.score_state === 'SCORED' && r.score,
      );
      const recovery_normalized = recovery?.score
        ? Math.round(recovery.score.recovery_score) / 10
        : null;

      return { ...q, rolling_avg: Math.round(avg * 10) / 10, recovery_normalized };
    });
  }, [recent, recoveryRecords]);

  const hasRecoveryData = chartData.some((d) => d.recovery_normalized !== null);

  const avgScore =
    recent.length > 0
      ? (recent.reduce((sum, q) => sum + q.score, 0) / recent.length).toFixed(1)
      : '—';

  const avgNum = parseFloat(avgScore);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
      {hasRecoveryData && (
        <div className="flex items-center gap-4 mb-3">
          {[
            { color: '#00B4FF', label: '7-session avg', dash: false },
            { color: 'var(--green)', label: 'Whoop recovery (normalized)', dash: true },
          ].map(({ color, label, dash }) => (
            <div key={label} className="flex items-center gap-1.5">
              <svg width="16" height="8">
                <line
                  x1="0" y1="4" x2="16" y2="4"
                  stroke={color}
                  strokeWidth="1.5"
                  strokeDasharray={dash ? '4 2' : undefined}
                />
              </svg>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.08em' }}>
                {label.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold" style={{ fontSize: 14, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
            Session Quality
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em', marginTop: 3 }}>
            DENSITY · COMPLETENESS · TIMING
          </p>
        </div>
        <div className="text-right">
          <div
            className="tabular-nums leading-none"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: scoreColor(avgNum) }}
          >
            {avgScore}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em', marginTop: 3 }}>
            AVG SCORE
          </div>
        </div>
      </div>

      {recent.length < 2 ? (
        <div className="flex h-48 items-center justify-center" style={{ color: 'var(--text-3)', fontSize: 13 }}>
          Need more sessions for quality scoring
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#464646', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              interval={Math.floor(recent.length / 6)}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fill: '#464646', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
            <ReferenceLine y={7.5} stroke="rgba(52,211,153,0.2)" strokeDasharray="4 2" />
            <ReferenceLine y={5} stroke="rgba(251,191,36,0.2)" strokeDasharray="4 2" />
            <Line
              type="monotone"
              dataKey="score"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={1}
              dot={<CustomDot />}
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="rolling_avg"
              stroke="#00B4FF"
              strokeWidth={2}
              dot={false}
              activeDot={false}
            />
            {hasRecoveryData && (
              <Line
                type="monotone"
                dataKey="recovery_normalized"
                stroke="var(--green)"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={false}
                activeDot={false}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
