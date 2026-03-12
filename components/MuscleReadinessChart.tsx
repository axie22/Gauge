'use client';

import { MuscleReadiness } from '@/lib/hevy';

interface Props {
  results: MuscleReadiness[];
}

const STATUS_STYLES: Record<MuscleReadiness['status'], {
  bar: string; text: string; chip: string;
}> = {
  fresh:       { bar: 'bg-emerald-500', text: 'text-emerald-400', chip: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/25' },
  optimal:     { bar: 'bg-indigo-500',  text: 'text-indigo-400',  chip: 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/25' },
  fatigued:    { bar: 'bg-amber-500',   text: 'text-amber-400',   chip: 'bg-amber-500/10 text-amber-400 ring-amber-500/25' },
  overtrained: { bar: 'bg-red-500',     text: 'text-red-400',     chip: 'bg-red-500/10 text-red-400 ring-red-500/25' },
};

const STATUS_LABEL: Record<MuscleReadiness['status'], string> = {
  fresh:       'Fresh',
  optimal:     'Optimal',
  fatigued:    'Fatigued',
  overtrained: 'Overtrained',
};

function ReadinessBar({ readiness, status }: { readiness: number; status: MuscleReadiness['status'] }) {
  const { bar } = STATUS_STYLES[status];
  return (
    <div className="relative h-1.5 rounded-full bg-zinc-800">
      {/* Optimal zone: 40–70 */}
      <div
        className="absolute inset-y-0 rounded-sm bg-zinc-700/40"
        style={{ left: '40%', width: '30%' }}
      />
      <div
        className={`absolute inset-y-0 left-0 rounded-full ${bar}`}
        style={{ width: `${readiness}%` }}
      />
    </div>
  );
}

export function MuscleReadinessChart({ results }: Props) {
  const display = results.slice(0, 12);
  const fatiguedCount    = results.filter((r) => r.status === 'fatigued' || r.status === 'overtrained').length;
  const overtrainedCount = results.filter((r) => r.status === 'overtrained').length;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 h-full">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Muscle Readiness</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            SRA fitness-fatigue model · primary 1.0x, secondary 0.35x load
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {overtrainedCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded ring-1 bg-red-500/10 text-red-400 ring-red-500/25">
              {overtrainedCount} overtrained
            </span>
          )}
          {fatiguedCount > overtrainedCount && (
            <span className="text-[10px] px-1.5 py-0.5 rounded ring-1 bg-amber-500/10 text-amber-400 ring-amber-500/25">
              {fatiguedCount - overtrainedCount} fatigued
            </span>
          )}
        </div>
      </div>

      {display.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-zinc-500 text-sm">
          No data yet — start logging workouts to see readiness
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {display.map((r) => {
              const { text, chip } = STATUS_STYLES[r.status];
              return (
                <div key={r.muscle_group}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-zinc-300 capitalize font-medium">
                      {r.muscle_group.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold tabular-nums ${text}`}>
                        {r.readiness}%
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ring-1 ${chip}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </div>
                  </div>
                  <ReadinessBar readiness={r.readiness} status={r.status} />
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex justify-between text-[10px] text-zinc-700 px-0">
            <span>0%</span>
            <span>40%</span>
            <span>70%</span>
            <span>100%</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Fresh (70–100)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />Optimal (40–69)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Fatigued (15–39)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Overtrained (&lt;15)
            </span>
          </div>
        </>
      )}
    </div>
  );
}
