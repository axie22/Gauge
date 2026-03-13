'use client';

import { useState, useMemo } from 'react';
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
import { OneRMSeries } from '@/lib/hevy';
import { useUnits } from '@/lib/units';

interface Props {
  series: OneRMSeries[];
}

type TooltipProps = {
  active?: boolean;
  payload?: { payload: { date: string; estimated_1rm_kg: number } }[];
};

export function OneRMChart({ series }: Props) {
  const { toDisplay, unit, fmtWeight } = useUnits();
  const [selectedId, setSelectedId] = useState<string>(series[0]?.exercise_template_id ?? '');

  const selected = useMemo(
    () => series.find((s) => s.exercise_template_id === selectedId) ?? series[0],
    [series, selectedId]
  );

  const chartData = useMemo(() => {
    if (!selected) return [];
    return selected.points.map((p) => ({
      date: p.date,
      estimated_1rm_kg: p.estimated_1rm_kg,
      display: toDisplay(p.estimated_1rm_kg),
    }));
  }, [selected, toDisplay]);

  const peak = useMemo(() => {
    if (!chartData.length) return null;
    return chartData.reduce((best, d) => d.display > best.display ? d : best);
  }, [chartData]);

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: 'var(--surface-up)', border: '1px solid var(--border-up)', borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em', marginBottom: 5 }}>
          {d.date}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>
          {fmtWeight(d.estimated_1rm_kg)}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
          Est. 1RM
        </div>
      </div>
    );
  };

  if (series.length === 0) {
    return (
      <div
        className="h-full flex items-center justify-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}
      >
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No compound lift data found</p>
      </div>
    );
  }

  const yMin = chartData.length ? Math.floor(Math.min(...chartData.map((d) => d.display)) * 0.92) : 0;
  const yMax = chartData.length ? Math.ceil(Math.max(...chartData.map((d) => d.display)) * 1.05) : 100;

  return (
    <div
      className="h-full"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-semibold" style={{ fontSize: 14, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
            Estimated 1RM
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em', marginTop: 3 }}>
            EPLEY FORMULA
          </p>
        </div>
        {peak && (
          <div className="text-right">
            <div
              className="tabular-nums leading-none"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}
            >
              {fmtWeight(peak.estimated_1rm_kg)}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>
              PEAK · {peak.date}
            </div>
          </div>
        )}
      </div>

      {/* Exercise selector pills */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {series.map((s) => {
          const active = selectedId === s.exercise_template_id;
          return (
            <button
              key={s.exercise_template_id}
              onClick={() => setSelectedId(s.exercise_template_id)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.06em',
                fontWeight: 600,
                padding: '5px 10px',
                borderRadius: 6,
                border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
                background: active ? 'var(--accent-dim)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-3)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {s.exercise_title.replace(/\s*\(.*?\)\s*/g, '').trim().toUpperCase()}
            </button>
          );
        })}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
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
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fill: '#464646', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => Math.round(v).toString()}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
          {peak && (
            <ReferenceLine
              y={peak.display}
              stroke="rgba(0,180,255,0.25)"
              strokeDasharray="4 2"
              label={{ value: `PR ${fmtWeight(peak.estimated_1rm_kg)}`, fill: '#464646', fontSize: 10, fontFamily: 'var(--font-mono)', position: 'right' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="display"
            stroke="#00B4FF"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#00B4FF', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', textAlign: 'right', marginTop: 6, letterSpacing: '0.06em' }}>
        Y AXIS IN {unit.toUpperCase()}
      </div>
    </div>
  );
}
