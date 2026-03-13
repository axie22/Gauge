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

const LEVEL_BG: Record<number, string> = {
  0: 'rgba(255,255,255,0.04)',
  1: 'rgba(0,180,255,0.12)',
  2: 'rgba(0,180,255,0.25)',
  3: 'rgba(0,180,255,0.45)',
  4: 'rgba(0,180,255,0.68)',
  5: 'rgba(0,180,255,0.92)',
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
      <div
        className="mt-4 flex items-center justify-between"
        style={{ background: 'var(--surface-up)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}
      >
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em' }}>
            {formatted.toUpperCase()}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Rest day — no workout logged</p>
        </div>
        <button
          onClick={onClose}
          style={{ fontSize: 18, lineHeight: 1, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}
        >×</button>
      </div>
    );
  }

  return (
    <div
      className="mt-4 overflow-hidden"
      style={{ background: 'var(--surface-up)', border: '1px solid var(--border-up)', borderRadius: 10 }}
    >
      {workouts.map((w) => (
        <div key={w.id}>
          {/* Workout header */}
          <div
            className="flex items-start justify-between"
            style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}
          >
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em' }}>
                {formatted.toUpperCase()}
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginTop: 3 }}>{w.title}</p>
              <div
                className="flex items-center gap-3 mt-1"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}
              >
                <span>{w.duration_minutes} MIN</span>
                <span>{fmtVolume(w.total_volume_kg)} TOTAL</span>
                <span>{w.exercises.length} EXERCISES</span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ fontSize: 18, lineHeight: 1, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2 }}
            >×</button>
          </div>

          {/* Exercise list */}
          <div style={{ maxHeight: 272, overflowY: 'auto' }}>
            {w.exercises.map((ex) => {
              const working = ex.sets.filter((s) => s.is_working_set);
              if (working.length === 0) return null;
              return (
                <div
                  key={ex.exercise_template_id}
                  style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)' }}>{ex.title}</span>
                    {ex.top_set_weight_kg > 0 && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>
                        TOP {fmtWeight(ex.top_set_weight_kg)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {working.map((s, i) => {
                      const isTop = s.weight_kg === ex.top_set_weight_kg && ex.top_set_weight_kg > 0;
                      return (
                        <span
                          key={i}
                          className="tabular-nums"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: isTop ? 'var(--accent-dim)' : 'var(--surface)',
                            color: isTop ? 'var(--accent)' : 'var(--text-2)',
                            border: `1px solid ${isTop ? 'var(--accent-border)' : 'var(--border)'}`,
                          }}
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
      grid.push({ date: dateStr, volume, level: getVolumeLevel(volume, maxVolume), col, row });
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
          labels.push({ col: cell.col, label: d.toLocaleString('default', { month: 'short' }) });
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
    <div
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold" style={{ fontSize: 14, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
          Workout Consistency
        </h2>
        <div className="flex gap-5">
          {[
            { label: 'streak', value: currentStreak, suffix: 'd' },
            { label: 'longest', value: longestStreak, suffix: 'd' },
            { label: 'avg gap', value: avgGapDays, suffix: 'd' },
          ].map(({ label, value, suffix }) => (
            <span key={label} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em' }}>
              {label.toUpperCase()} <span style={{ color: 'var(--text-1)', fontWeight: 700 }}>{value}{suffix}</span>
            </span>
          ))}
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
              className="flex items-center justify-end pr-1.5"
              style={{
                height: CELL,
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--text-3)',
                letterSpacing: '0.06em',
              }}
            >
              {label.toUpperCase()}
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
                  className="absolute"
                  style={{
                    left: col * (CELL + GAP),
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--text-3)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
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
                    style={{
                      gridColumn: cell.col + 1,
                      gridRow: cell.row + 1,
                      width: CELL,
                      height: CELL,
                      borderRadius: 3,
                      background: LEVEL_BG[cell.level],
                      cursor: hasWorkout ? 'pointer' : 'default',
                      outline: isSelected ? '2px solid rgba(0,180,255,0.7)' : 'none',
                      outlineOffset: 1,
                      transition: 'opacity 0.1s',
                    }}
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
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', marginRight: 4, letterSpacing: '0.06em' }}>
                LESS
              </span>
              {[0, 1, 2, 3, 4, 5].map((l) => (
                <div
                  key={l}
                  style={{ width: 12, height: 12, borderRadius: 3, background: LEVEL_BG[l] }}
                />
              ))}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', marginLeft: 4, letterSpacing: '0.06em' }}>
                MORE
              </span>
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
          className="fixed z-50 pointer-events-none"
          style={{
            top: tooltip.y - 64,
            left: tooltip.x - 64,
            background: 'var(--surface-up)',
            border: '1px solid var(--border-up)',
            borderRadius: 8,
            padding: '8px 12px',
          }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-2)', fontWeight: 600 }}>
            {tooltip.date}
          </div>
          {tooltip.volume > 0 ? (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
              {fmtVolume(tooltip.volume)} volume
            </div>
          ) : (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
              Rest day
            </div>
          )}
        </div>
      )}
    </div>
  );
}
