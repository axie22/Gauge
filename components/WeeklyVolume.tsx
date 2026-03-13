'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { WeeklyVolumePoint } from '@/lib/hevy';
import { useUnits } from '@/lib/units';

interface Props {
  data: WeeklyVolumePoint[];
}

type TooltipProps = {
  active?: boolean;
  payload?: { payload: WeeklyVolumePoint }[];
};

function WeeklyVolumeInner({ data }: Props) {
  const { toDisplay, fmtVolume, unit } = useUnits();

  const avgVolumeKg = useMemo(() => {
    const completed = data.filter((d) => !d.is_current && d.volume_kg > 0);
    if (completed.length === 0) return 0;
    return completed.reduce((s, d) => s + d.volume_kg, 0) / completed.length;
  }, [data]);

  const chartData = useMemo(
    () => data.map((d) => ({ ...d, display: toDisplay(d.volume_kg) })),
    [data, toDisplay]
  );

  const avgDisplay = toDisplay(avgVolumeKg);
  const avgLabel = avgDisplay >= 1000
    ? `${(avgDisplay / 1000).toFixed(1)}k`
    : Math.round(avgDisplay).toString();

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const start = new Date(d.week + 'T12:00:00Z');
    const end = new Date(d.week + 'T12:00:00Z');
    end.setUTCDate(end.getUTCDate() + 6);
    const fmt = (date: Date) =>
      date.toLocaleString('default', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    return (
      <div style={{ background: 'var(--surface-up)', border: '1px solid var(--border-up)', borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em', marginBottom: 6 }}>
          {fmt(start).toUpperCase()} – {fmt(end).toUpperCase()}
          {d.is_current && <span style={{ color: 'var(--accent)', marginLeft: 6 }}>THIS WEEK</span>}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>
          {fmtVolume(d.volume_kg)}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
          {d.workout_count} session{d.workout_count !== 1 ? 's' : ''}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="font-semibold" style={{ fontSize: 14, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
            Weekly Volume
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em', marginTop: 3 }}>
            LAST 16 WEEKS
          </p>
        </div>
        <div className="text-right">
          <div
            className="tabular-nums leading-none"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: 'var(--text-1)' }}
          >
            {avgLabel}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em', marginTop: 3 }}>
            AVG {unit.toUpperCase()}/WEEK
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="week"
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
            tick={{ fill: '#464646', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          {avgDisplay > 0 && (
            <ReferenceLine
              y={avgDisplay}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="4 2"
              label={{ value: `avg ${avgLabel}`, fill: '#464646', fontSize: 10, fontFamily: 'var(--font-mono)', position: 'right' }}
            />
          )}
          <Bar dataKey="display" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.volume_kg === 0
                    ? 'rgba(255,255,255,0.04)'
                    : entry.is_current
                    ? '#00B4FF'
                    : 'rgba(0,180,255,0.35)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeeklyVolume({ data }: Props) {
  return <WeeklyVolumeInner data={data} />;
}
