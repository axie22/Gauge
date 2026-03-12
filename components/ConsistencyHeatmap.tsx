'use client';

import { useMemo, useState } from 'react';
import { HeatmapDay, EnrichedWorkout } from '@/lib/hevy';
import { useUnits } from '@/lib/units';

interface Props {
  days: HeatmapDay[];
  workouts: EnrichedWorkout[];
  currentStreak: number;
  longestStreak: number;
  avgGapDays: number;
}

function getVolumeLevel(vol: number, max: number): number {
  if (vol === 0 || max === 0) return 0;
  const ratio = vol / max;
  if (ratio < 0.2) return 1;
  if (ratio < 0.4) return 2;
  if (ratio < 0.65) return 3;
  if (ratio < 0.85) return 4;
  return 5;
}

const levelColors: Record<number, string> = {
  0: 'bg-zinc-800',
  1: 'bg-emerald-900',
  2: 'bg-emerald-800',
  3: 'bg-emerald-700',
  4: 'bg-emerald-600',
  5: 'bg-emerald-500',
};

function WorkoutDetail({
  date,
  workouts,
  onClose,
}: {
  date: string;
  workouts: EnrichedWorkout[];
  onClose: () => void;
}) {
  const { fmtWeight, fmtVolume } = useUnits();
  const formatted = new Date(date + 'T12:00:00Z').toLocaleDateString('default', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });

  if (workouts.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-400">{formatted}</p>
          <p className="text-sm text-zinc-600 mt-1">Rest day — no workout logged</p>
        </div>
        <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 text-lg leading-none">×</button>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-zinc-700 bg-zinc-950/80 overflow-hidden">
      {workouts.map((w) => (
        <div key={w.id}>
          {/* Workout header */}
          <div className="flex items-start justify-between px-4 py-3 border-b border-zinc-800">
            <div>
              <p className="text-xs text-zinc-500">{formatted}</p>
              <p className="text-sm font-semibold text-zinc-100 mt-0.5">{w.title}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                <span>{w.duration_minutes} min</span>
                <span>{fmtVolume(w.total_volume_kg)} total</span>
                <span>{w.exercises.length} exercises</span>
              </div>
            </div>
            <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 text-lg leading-none mt-0.5">×</button>
          </div>

          {/* Exercise list */}
          <div className="divide-y divide-zinc-800/60 max-h-72 overflow-y-auto">
            {w.exercises.map((ex) => {
              const working = ex.sets.filter((s) => s.is_working_set);
              if (working.length === 0) return null;
              return (
                <div key={ex.exercise_template_id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-zinc-200">{ex.title}</span>
                    {ex.top_set_weight_kg > 0 && (
                      <span className="text-[10px] text-zinc-500 tabular-nums">
                        top {fmtWeight(ex.top_set_weight_kg)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {working.map((s, i) => {
                      const isTop = s.weight_kg === ex.top_set_weight_kg && ex.top_set_weight_kg > 0;
                      return (
                        <span
                          key={i}
                          className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded ${
                            isTop
                              ? 'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {s.weight_kg != null && s.weight_kg > 0
                            ? `${fmtWeight(s.weight_kg)} × ${s.reps ?? '—'}`
                            : `${s.reps ?? '—'} reps`}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConsistencyHeatmap({ days, workouts, currentStreak, longestStreak, avgGapDays }: Props) {
  const [tooltip, setTooltip] = useState<{ date: string; volume: number; x: number; y: number } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { fmtVolume } = useUnits();

  const workoutsByDate = useMemo(() => {
    const map = new Map<string, EnrichedWorkout[]>();
    for (const w of workouts) {
      const list = map.get(w.date) ?? [];
      list.push(w);
      map.set(w.date, list);
    }
    return map;
  }, [workouts]);

  const { grid, maxVolume } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(today.getDate() - 364);
    start.setDate(start.getDate() - start.getDay());

    const volumeMap = new Map(days.map((d) => [d.date, d.volume_kg]));
    const maxVolume = Math.max(0, ...days.map((d) => d.volume_kg));

    const grid: { date: string; volume: number; level: number; col: number; row: number }[] = [];

    const cursor = new Date(start);
    let col = 0;
    while (cursor <= today) {
      const row = cursor.getDay();
      const dateStr = cursor.toISOString().slice(0, 10);
      const volume = volumeMap.get(dateStr) ?? 0;
      grid.push({
        date: dateStr,
        volume,
        level: getVolumeLevel(volume, maxVolume),
        col,
        row,
      });
      if (row === 6) col++;
      cursor.setDate(cursor.getDate() + 1);
    }

    return { grid, maxVolume };
  }, [days]);

  const totalCols = Math.max(...grid.map((c) => c.col)) + 1;

  const monthLabels = useMemo(() => {
    const seen = new Set<string>();
    const labels: { col: number; label: string }[] = [];
    for (const cell of grid) {
      if (cell.row === 0) {
        const month = cell.date.slice(0, 7);
        if (!seen.has(month)) {
          seen.add(month);
          const d = new Date(cell.date);
          labels.push({
            col: cell.col,
            label: d.toLocaleString('default', { month: 'short' }),
          });
        }
      }
    }
    return labels;
  }, [grid]);

  const CELL = 14;
  const GAP = 2;

  function handleCellClick(dateStr: string) {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
    setTooltip(null);
  }

  const selectedWorkouts = selectedDate ? (workoutsByDate.get(selectedDate) ?? []) : null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-100">Workout Consistency</h2>
        <div className="flex gap-5 text-sm text-zinc-400">
          <span><span className="text-zinc-200 font-semibold">{currentStreak}</span> day streak</span>
          <span>Longest <span className="text-zinc-200 font-semibold">{longestStreak}</span> days</span>
          <span>Avg gap <span className="text-zinc-200 font-semibold">{avgGapDays}d</span></span>
        </div>
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div
          className="flex-shrink-0 flex flex-col"
          style={{ paddingTop: 24, gap: GAP, width: 28 }}
        >
          {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
            <div
              key={i}
              className="flex items-center justify-end text-[10px] text-zinc-600 pr-1.5"
              style={{ height: CELL }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Scrollable grid */}
        <div className="overflow-x-auto flex-1">
          <div className="relative" style={{ minWidth: totalCols * (CELL + GAP) }}>
            {/* Month labels */}
            <div className="relative h-5 mb-1">
              {monthLabels.map(({ col, label }) => (
                <span
                  key={`${col}-${label}`}
                  className="absolute text-xs text-zinc-500"
                  style={{ left: col * (CELL + GAP) }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Grid */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${totalCols}, ${CELL}px)`,
                gridTemplateRows: `repeat(7, ${CELL}px)`,
                gap: GAP,
              }}
            >
              {grid.map((cell) => {
                const hasWorkout = workoutsByDate.has(cell.date);
                const isSelected = selectedDate === cell.date;
                return (
                  <div
                    key={cell.date}
                    onClick={() => handleCellClick(cell.date)}
                    className={`rounded-sm transition-all ${
                      hasWorkout ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                    } ${levelColors[cell.level]} ${
                      isSelected ? 'ring-2 ring-white/60 ring-offset-1 ring-offset-zinc-900' : ''
                    }`}
                    style={{ gridColumn: cell.col + 1, gridRow: cell.row + 1, width: CELL, height: CELL }}
                    onMouseEnter={(e) => {
                      if (isSelected) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({ date: cell.date, volume: cell.volume, x: rect.left, y: rect.top });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1 mt-3 justify-end">
              <span className="text-xs text-zinc-500 mr-1">Less</span>
              {[0, 1, 2, 3, 4, 5].map((l) => (
                <div key={l} className={`w-3 h-3 rounded-sm ${levelColors[l]}`} />
              ))}
              <span className="text-xs text-zinc-500 ml-1">More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Workout detail panel */}
      {selectedDate !== null && selectedWorkouts !== null && (
        <WorkoutDetail
          date={selectedDate}
          workouts={selectedWorkouts}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {/* Hover tooltip */}
      {tooltip && !selectedDate && (
        <div
          className="fixed z-50 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl pointer-events-none"
          style={{ top: tooltip.y - 60, left: tooltip.x - 60 }}
        >
          <div className="font-medium text-zinc-200">{tooltip.date}</div>
          {tooltip.volume > 0 ? (
            <div className="text-zinc-400">{fmtVolume(tooltip.volume)} volume</div>
          ) : (
            <div className="text-zinc-500">Rest day</div>
          )}
        </div>
      )}
    </div>
  );
}
