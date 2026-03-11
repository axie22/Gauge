import { getCachedWorkouts, getCachedTemplates, buildTemplateMap, enrichWorkouts } from '@/lib/hevy';
import {
  calculateAcwr,
  detectPlateaus,
  analyzeBalance,
  scoreAllSessions,
  buildHeatmapData,
  computeStreakStats,
} from '@/lib/analytics';
import { summarizeWorkouts } from '@/lib/summarize';
import { ConsistencyHeatmap } from '@/components/ConsistencyHeatmap';
import { AcwrChart } from '@/components/AcwrChart';
import { PlateauCards } from '@/components/PlateauCards';
import { BalanceAnalyzer } from '@/components/BalanceAnalyzer';
import { SessionQuality } from '@/components/SessionQuality';
import { ChatPanel } from '@/components/ChatPanel';

export default async function DashboardPage() {
  const [rawWorkouts, templates] = await Promise.all([
    getCachedWorkouts(),
    getCachedTemplates(),
  ]);

  const templateMap = buildTemplateMap(templates);
  const workouts = enrichWorkouts(rawWorkouts, templateMap);

  const acwr = calculateAcwr(workouts, new Date());
  const plateaus = detectPlateaus(workouts);
  const balance = analyzeBalance(workouts, 30);
  const qualities = scoreAllSessions(workouts);
  const heatmap = buildHeatmapData(workouts);
  const streaks = computeStreakStats(heatmap);
  const summary = summarizeWorkouts(workouts, acwr, plateaus, balance);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100">Training Intelligence</h1>
          <p className="mt-1 text-zinc-400">
            {workouts.length} workouts analyzed
            {workouts.length > 0 && (
              <> · Last session {workouts[workouts.length - 1]?.date}</>
            )}
          </p>
        </div>

        {workouts.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-500">
            <div className="text-4xl">🏋️</div>
            <div className="text-lg font-medium text-zinc-400">No workouts found</div>
            <p className="text-sm">Make sure your HEVY_API_KEY is set correctly in .env</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Row 1: Full-width heatmap */}
            <ConsistencyHeatmap
              days={heatmap}
              currentStreak={streaks.current_streak}
              longestStreak={streaks.longest_streak}
              avgGapDays={streaks.avg_gap_days}
            />

            {/* Row 2: ACWR (2/3) + Balance (1/3) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <AcwrChart results={acwr} />
              </div>
              <div className="lg:col-span-1">
                <BalanceAnalyzer workouts={workouts} initialBalance={balance} />
              </div>
            </div>

            {/* Row 3: Plateaus (1/3) + Quality (2/3) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <PlateauCards plateaus={plateaus} />
              </div>
              <div className="lg:col-span-2">
                <SessionQuality qualities={qualities} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat panel — always rendered so it can slide in */}
      <ChatPanel
        summary={summary}
        acwr={acwr}
        plateaus={plateaus}
        balance={balance}
      />
    </main>
  );
}
