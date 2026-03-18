'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { WhoopRecoveryData } from '@/lib/whoop-server';

interface Props {
  data: WhoopRecoveryData;
}

function recoveryColor(score: number): string {
  if (score >= 67) return 'rgba(52,211,153,0.75)';
  if (score >= 34) return 'rgba(251,191,36,0.75)';
  return 'rgba(248,113,113,0.75)';
}

type TooltipPayload = {
  date: string;
  recovery_score: number;
  hrv: number;
  rhr: number;
};

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: TooltipPayload }[];
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: 'var(--surface-up)', border: '1px solid var(--border-up)', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em', marginBottom: 6 }}>
        {d.date}
      </div>
      <div className="space-y-1">
        {[
          { label: 'Recovery', value: `${d.recovery_score}%`, color: recoveryColor(d.recovery_score) },
          { label: 'HRV', value: `${d.hrv.toFixed(1)}ms`, color: '#00B4FF' },
          { label: 'RHR', value: `${d.rhr}bpm`, color: 'var(--text-2)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex justify-between gap-5">
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function WhoopRecoveryTrend({ data }: Props) {
  const chartData = useMemo(() => {
    return data.recent
      .filter((r) => r.score_state === 'SCORED' && r.score)
      .map((r) => ({
        date: r.created_at.slice(0, 10),
        recovery_score: r.score!.recovery_score,
        hrv: r.score!.hrv_rmssd_milli,
        rhr: r.score!.resting_heart_rate,
      }));
  }, [data]);

  const [hrvMin, hrvMax] = useMemo(() => {
    if (!chartData.length) return [0, 100];
    const vals = chartData.map((d) => d.hrv);
    const min = Math.floor(Math.min(...vals) * 0.9);
    const max = Math.ceil(Math.max(...vals) * 1.05);
    return [min, max];
  }, [chartData]);

  if (chartData.length < 2) {
    return (
      <div
        className="h-full flex items-center justify-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, minHeight: 220 }}
      >
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Not enough recovery data yet</p>
      </div>
    );
  }

  const latest = chartData[chartData.length - 1];
  const prevWeek = chartData.slice(-8, -1);
  const avgHrv7d = prevWeek.length
    ? prevWeek.reduce((s, d) => s + d.hrv, 0) / prevWeek.length
    : null;
  const hrvDelta = avgHrv7d !== null ? latest.hrv - avgHrv7d : null;

  return (
    <div
      className="h-full"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="font-semibold" style={{ fontSize: 14, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
            Recovery Trend
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em', marginTop: 3 }}>
            {chartData.length} DAYS
          </p>
        </div>

        {/* HRV delta */}
        {hrvDelta !== null && (
          <div className="text-right">
            <div
              className="tabular-nums leading-none"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 22,
                fontWeight: 700,
                color: hrvDelta >= 0 ? 'var(--green)' : 'var(--red)',
              }}
            >
              {hrvDelta >= 0 ? '+' : ''}{hrvDelta.toFixed(1)}
              <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-3)', marginLeft: 3 }}>ms</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 3, letterSpacing: '0.08em' }}>
              HRV VS 7D AVG
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4">
        {[
          { color: 'rgba(52,211,153,0.75)', label: 'Recovery score' },
          { color: '#00B4FF', label: 'HRV (right axis)', line: true },
        ].map(({ color, label, line }) => (
          <div key={label} className="flex items-center gap-1.5">
            {line ? (
              <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke={color} strokeWidth="1.5" /></svg>
            ) : (
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
            )}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.08em' }}>
              {label.toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 40, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#464646', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            tickFormatter={(v: string) =>
              new Date(v + 'T12:00:00Z').toLocaleString('default', {
                month: 'short', day: 'numeric', timeZone: 'UTC',
              })
            }
          />
          {/* Left Y: recovery score 0-100 */}
          <YAxis
            yAxisId="left"
            domain={[0, 100]}
            tick={{ fill: '#464646', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
          />
          {/* Right Y: HRV in ms */}
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[hrvMin, hrvMax]}
            tick={{ fill: '#464646', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${Math.round(v)}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar yAxisId="left" dataKey="recovery_score" radius={[2, 2, 0, 0]}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={recoveryColor(d.recovery_score)} />
            ))}
          </Bar>
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="hrv"
            stroke="#00B4FF"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: '#00B4FF', strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
