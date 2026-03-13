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

type ChartPoint = SessionQualityResult & { rolling_avg: number };

interface Props {
  qualities: SessionQualityResult[];
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
        <div className="flex justify-between gap-6">
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Density</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)' }}>{d.density_score.toFixed(1)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Completeness</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)' }}>{d.completeness_score.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
};

export function SessionQuality({ qualities }: Props) {
  const recent = qualities.slice(-60);

  const chartData = useMemo<ChartPoint[]>(() => {
    return recent.map((q, i) => {
      const window = recent.slice(Math.max(0, i - 6), i + 1);
      const avg = window.reduce((s, w) => s + w.score, 0) / window.length;
      return { ...q, rolling_avg: Math.round(avg * 10) / 10 };
    });
  }, [recent]);

  const avgScore =
    recent.length > 0
      ? (recent.reduce((sum, q) => sum + q.score, 0) / recent.length).toFixed(1)
      : '—';

  const avgNum = parseFloat(avgScore);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
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
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
