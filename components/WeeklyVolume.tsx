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
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-xs shadow-xl">
        <div className="font-medium text-zinc-200 mb-1">
          {fmt(start)} – {fmt(end)}
          {d.is_current && <span className="ml-1.5 text-indigo-400">(this week)</span>}
        </div>
        <div className="text-zinc-400">
          Volume:{' '}
          <span className="text-zinc-200 font-medium">{fmtVolume(d.volume_kg)}</span>
        </div>
        <div className="text-zinc-400">
          Sessions: <span className="text-zinc-200">{d.workout_count}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 h-full">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Weekly Volume</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Last 16 weeks · indigo = current week
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-zinc-100 tabular-nums">{avgLabel}</div>
          <div className="text-xs text-zinc-500">avg {unit}/week</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 8, right: 24, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: '#71717a', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            tickFormatter={(v: string) =>
              new Date(v + 'T12:00:00Z').toLocaleString('default', {
                month: 'short',
                day: 'numeric',
                timeZone: 'UTC',
              })
            }
          />
          <YAxis
            tick={{ fill: '#71717a', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
            }
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#27272a' }} />
          {avgDisplay > 0 && (
            <ReferenceLine
              y={avgDisplay}
              stroke="#52525b"
              strokeDasharray="4 2"
              label={{
                value: `avg ${avgLabel}`,
                fill: '#71717a',
                fontSize: 10,
                position: 'right',
              }}
            />
          )}
          <Bar dataKey="display" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.is_current ? '#6366f1' : '#22c55e'}
                fillOpacity={entry.volume_kg === 0 ? 0.12 : entry.is_current ? 0.9 : 0.7}
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
