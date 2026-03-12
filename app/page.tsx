import { getCachedWorkouts, getCachedTemplates, buildTemplateMap, enrichWorkouts } from '@/lib/hevy';
import {
  calculateAcwr,
  detectPlateaus,
  analyzeBalance,
  scoreAllSessions,
  buildHeatmapData,
  computeStreakStats,
  computeWeeklyVolume,
  findPersonalRecords,
} from '@/lib/analytics';
import { summarizeWorkouts } from '@/lib/summarize';
import { ConsistencyHeatmap } from '@/components/ConsistencyHeatmap';
import { AcwrChart } from '@/components/AcwrChart';
import { PlateauCards } from '@/components/PlateauCards';
import { BalanceAnalyzer } from '@/components/BalanceAnalyzer';
import { SessionQuality } from '@/components/SessionQuality';
import { WeeklyVolume } from '@/components/WeeklyVolume';
import { PersonalRecords } from '@/components/PersonalRecords';
import { NutritionDashboardWidget } from '@/components/NutritionDashboardWidget';
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
  const weeklyVolume = computeWeeklyVolume(workouts);
  const personalRecords = findPersonalRecords(workouts);
  const summary = summarizeWorkouts(workouts, acwr, plateaus, balance);

  // Stats bar computation — UTC date strings to stay consistent with w.date
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(todayStr + 'T12:00:00Z');
  const dow = todayDate.getUTCDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const weekMondayDate = new Date(todayDate);
  weekMondayDate.setUTCDate(todayDate.getUTCDate() + mondayOffset);
  const weekMondayStr = weekMondayDate.toISOString().slice(0, 10);
  const monthStartStr = todayStr.slice(0, 7) + '-01';
  const thisWeekSessions = workouts.filter((w) => w.date >= weekMondayStr).length;
  const thisMonthVolume = workouts
    .filter((w) => w.date >= monthStartStr)
    .reduce((s, w) => s + w.total_volume_kg, 0);

  const statCards = [
    {
      label: 'This week',
      value: thisWeekSessions,
      unit: thisWeekSessions === 1 ? 'session' : 'sessions',
    },
    {
      label: 'This month',
      value: Math.round(thisMonthVolume).toLocaleString(),
      unit: 'kg lifted',
    },
    {
      label: 'Current streak',
      value: streaks.current_streak,
      unit: streaks.current_streak === 1 ? 'day' : 'days',
    },
    {
      label: 'All-time',
      value: workouts.length.toLocaleString(),
      unit: 'workouts',
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="text-3xl font-bold text-zinc-100">Training Intelligence</h1>
            <span className="text-sm text-zinc-500 tabular-nums hidden sm:block">
              {new Date().toLocaleDateString('default', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <p className="mt-1 text-zinc-400 text-sm">
            {workouts.length.toLocaleString()} workouts analyzed
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
            {/* Stats bar */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {statCards.map(({ label, value, unit }) => (
                <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4">
                  <div className="text-xs text-zinc-500 font-medium uppercase tracking-wide">{label}</div>
                  <div className="mt-1 text-2xl font-bold text-zinc-100 tabular-nums">{value}</div>
                  <div className="text-xs text-zinc-400 mt-0.5">{unit}</div>
                </div>
              ))}
            </div>

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

            {/* Row 3: Weekly Volume (2/3) + Personal Records (1/3) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <WeeklyVolume data={weeklyVolume} />
              </div>
              <div className="lg:col-span-1">
                <PersonalRecords records={personalRecords} />
              </div>
            </div>

            {/* Row 4: Plateaus (1/3) + Session Quality (2/3) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <PlateauCards plateaus={plateaus} />
              </div>
              <div className="lg:col-span-2">
                <SessionQuality qualities={qualities} />
              </div>
            </div>

            {/* Row 5: Nutrition (full width, client-side from localStorage) */}
            <NutritionDashboardWidget />
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
