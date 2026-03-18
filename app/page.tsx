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
  computeMuscleReadiness,
  computeOverloadSuggestions,
  computeOneRMSeries,
  computeConsistencyScore,
} from '@/lib/analytics';
import { summarizeWorkouts } from '@/lib/summarize';
import { readNutritionLogServer, summarizeNutrition } from '@/lib/nutrition-server';
import { readProfileServer, summarizeProfile } from '@/lib/profile-server';
import { ConsistencyHeatmap } from '@/components/ConsistencyHeatmap';
import { MuscleReadinessChart } from '@/components/MuscleReadinessChart';
import { PlateauCards } from '@/components/PlateauCards';
import { BalanceAnalyzer } from '@/components/BalanceAnalyzer';
import { SessionQuality } from '@/components/SessionQuality';
import { WeeklyVolume } from '@/components/WeeklyVolume';
import { PersonalRecords } from '@/components/PersonalRecords';
import { OneRMChart } from '@/components/OneRMChart';
import { OverloadSuggestions } from '@/components/OverloadSuggestions';
import { NutritionDashboardWidget } from '@/components/NutritionDashboardWidget';
import { VolumeStatCard } from '@/components/VolumeStatCard';
import { ChatPanel } from '@/components/ChatPanel';
import { WhoopRecoveryCard } from '@/components/WhoopRecoveryCard';
import { getCachedWhoopRecovery, getCachedWhoopWorkouts, deduplicateAndEnrich, summarizeWhoopRecovery } from '@/lib/whoop-server';

function DashSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-4 mb-6">
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text-3)',
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        <div className="flex-1" style={{ height: 1, background: 'var(--border)' }} />
      </div>
      {children}
    </section>
  );
}

export default async function DashboardPage() {
  const [rawWorkouts, templates] = await Promise.all([
    getCachedWorkouts(),
    getCachedTemplates(),
  ]);

  const templateMap = buildTemplateMap(templates);
  const workouts = enrichWorkouts(rawWorkouts, templateMap);

  const acwr        = calculateAcwr(workouts, new Date());
  const readiness   = computeMuscleReadiness(workouts);
  const plateaus    = detectPlateaus(workouts);
  const balance     = analyzeBalance(workouts, 30);
  const qualities   = scoreAllSessions(workouts);
  const heatmap     = buildHeatmapData(workouts);
  const streaks     = computeStreakStats(heatmap);
  const weeklyVolume      = computeWeeklyVolume(workouts);
  const personalRecords   = findPersonalRecords(workouts);
  const overload          = computeOverloadSuggestions(workouts);
  const oneRMSeries       = computeOneRMSeries(workouts);
  const consistency       = computeConsistencyScore(workouts);
  const [nutritionLog, profile, whoopRecovery, whoopWorkoutsData] = await Promise.all([
    readNutritionLogServer(),
    readProfileServer(),
    getCachedWhoopRecovery(),
    getCachedWhoopWorkouts(),
  ]);

  // Enrich Hevy workouts with Whoop biometrics where sessions overlap in time
  const whoopEnrichedWorkouts = whoopWorkoutsData
    ? deduplicateAndEnrich(workouts, whoopWorkoutsData.workouts)
    : workouts;
  const nutritionSummary  = summarizeNutrition(nutritionLog);
  const profileSummary    = summarizeProfile(profile);
  const whoopSummary      = whoopRecovery ? summarizeWhoopRecovery(whoopRecovery) : null;
  const summary     = summarizeWorkouts(whoopEnrichedWorkouts, acwr, plateaus, balance, nutritionSummary, profileSummary, readiness, whoopSummary);

  // Stats bar computation — UTC date strings
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(todayStr + 'T12:00:00Z');
  const dow = todayDate.getUTCDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const weekMondayDate = new Date(todayDate);
  weekMondayDate.setUTCDate(todayDate.getUTCDate() + mondayOffset);
  const weekMondayStr  = weekMondayDate.toISOString().slice(0, 10);
  const monthStartStr  = todayStr.slice(0, 7) + '-01';
  const thisWeekSessions  = workouts.filter((w) => w.date >= weekMondayStr).length;
  const thisMonthVolumeKg = workouts
    .filter((w) => w.date >= monthStartStr)
    .reduce((s, w) => s + w.total_volume_kg, 0);

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', paddingTop: 48 }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* ── PAGE HEADER ── */}
        <div
          className="flex items-baseline justify-between py-8"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h1
              className="font-bold"
              style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--text-1)', letterSpacing: '-0.02em' }}
            >
              Training Intelligence
            </h1>
            <p
              className="mt-1"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.04em' }}
            >
              {workouts.length.toLocaleString()} workouts analyzed
              {workouts.length > 0 && ` · last session ${workouts[workouts.length - 1]?.date}`}
            </p>
          </div>
          <span
            className="hidden sm:block tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.04em' }}
          >
            {new Date().toLocaleDateString('default', {
              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
            }).toUpperCase()}
          </span>
        </div>

        {workouts.length === 0 ? (
          <div
            className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl mt-8"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: 'var(--text-3)' }}
            />
            <div className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>No workouts found</div>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Make sure your HEVY_API_KEY is set in .env</p>
          </div>
        ) : (
          <>
            {/* ── HERO STATS — large typographic numbers, no cards ── */}
            <div style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                <div className="px-6 py-7" style={{ borderRight: '1px solid var(--border)' }}>
                  <div className="mono-label mb-3">Sessions</div>
                  <div
                    className="tabular-nums leading-none"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 48, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}
                  >
                    {thisWeekSessions}
                  </div>
                  <div className="mono-label mt-2">this week</div>
                </div>

                <VolumeStatCard volumeKg={thisMonthVolumeKg} />

                <div className="px-6 py-7" style={{ borderRight: '1px solid var(--border)' }}>
                  <div className="mono-label mb-3">Streak</div>
                  <div
                    className="tabular-nums leading-none"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 48, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}
                  >
                    {streaks.current_streak}
                  </div>
                  <div className="mono-label mt-2">{streaks.current_streak === 1 ? 'day' : 'days'} active</div>
                </div>

                <div className="px-6 py-7" style={{ borderRight: '1px solid var(--border)' }}>
                  <div className="mono-label mb-3">All-time</div>
                  <div
                    className="tabular-nums leading-none"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 48, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}
                  >
                    {workouts.length.toLocaleString()}
                  </div>
                  <div className="mono-label mt-2">workouts</div>
                </div>

                <div className="px-6 py-7">
                  <div className="mono-label mb-3">Balance</div>
                  <div
                    className="tabular-nums leading-none"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 48, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}
                  >
                    {consistency.avg_score}
                    <span style={{ fontSize: 24, color: 'var(--text-3)' }}>%</span>
                  </div>
                  <div className="mono-label mt-2">12-wk coverage</div>
                </div>
              </div>
            </div>

            {/* ── DASHBOARD SECTIONS ── */}
            <div className="py-8 space-y-16">

              <DashSection label="Consistency">
                <ConsistencyHeatmap
                  days={heatmap}
                  workouts={whoopEnrichedWorkouts}
                  currentStreak={streaks.current_streak}
                  longestStreak={streaks.longest_streak}
                  avgGapDays={streaks.avg_gap_days}
                />
              </DashSection>

              <DashSection label="Recovery & Readiness">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <MuscleReadinessChart results={readiness} />
                  </div>
                  <div className="lg:col-span-1">
                    <BalanceAnalyzer workouts={workouts} initialBalance={balance} />
                  </div>
                </div>
              </DashSection>

              <DashSection label="Volume & Strength">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <WeeklyVolume data={weeklyVolume} />
                  </div>
                  <div className="lg:col-span-1">
                    <PersonalRecords records={personalRecords} />
                  </div>
                </div>
              </DashSection>

              <DashSection label="Progression">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <OneRMChart series={oneRMSeries} />
                  </div>
                  <div className="lg:col-span-1">
                    <OverloadSuggestions suggestions={overload} />
                  </div>
                </div>
              </DashSection>

              <DashSection label="Analysis">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-1">
                    <PlateauCards plateaus={plateaus} />
                  </div>
                  <div className="lg:col-span-2">
                    <SessionQuality
                      qualities={qualities}
                      recoveryRecords={whoopRecovery?.recent}
                    />
                  </div>
                </div>
              </DashSection>

              <DashSection label="Nutrition">
                <NutritionDashboardWidget />
              </DashSection>

              {whoopRecovery && (
                <DashSection label="Biometrics">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <WhoopRecoveryCard data={whoopRecovery} />
                  </div>
                </DashSection>
              )}

            </div>
          </>
        )}
      </div>

      <ChatPanel
        summary={summary}
        readiness={readiness}
        plateaus={plateaus}
        balance={balance}
        nutritionSummary={nutritionSummary}
        profileSummary={profileSummary}
      />
    </main>
  );
}
