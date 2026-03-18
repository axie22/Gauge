export const dynamic = 'force-dynamic';

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
} from '@/lib/analytics';
import { summarizeWorkouts } from '@/lib/summarize';
import { readNutritionLogServer, summarizeNutrition } from '@/lib/nutrition-server';
import { readProfileServer, summarizeProfile } from '@/lib/profile-server';
import { getCachedWhoopRecovery, getCachedWhoopWorkouts, deduplicateAndEnrich, summarizeWhoopRecovery } from '@/lib/whoop-server';
import { ConsistencyHeatmap } from '@/components/ConsistencyHeatmap';
import { WeeklyVolume } from '@/components/WeeklyVolume';
import { PersonalRecords } from '@/components/PersonalRecords';
import { OneRMChart } from '@/components/OneRMChart';
import { OverloadSuggestions } from '@/components/OverloadSuggestions';
import { PlateauCards } from '@/components/PlateauCards';
import { SessionQuality } from '@/components/SessionQuality';
import { ChatPanel } from '@/components/ChatPanel';
import { DashSection } from '@/components/DashSection';

export default async function TrainingPage() {
  const [rawWorkouts, templates] = await Promise.all([
    getCachedWorkouts(),
    getCachedTemplates(),
  ]);

  const templateMap = buildTemplateMap(templates);
  const workouts = enrichWorkouts(rawWorkouts, templateMap);

  const acwr      = calculateAcwr(workouts, new Date());
  const readiness = computeMuscleReadiness(workouts);
  const plateaus  = detectPlateaus(workouts);
  const balance   = analyzeBalance(workouts, 30);
  const qualities = scoreAllSessions(workouts);
  const heatmap   = buildHeatmapData(workouts);
  const streaks   = computeStreakStats(heatmap);
  const weeklyVolume    = computeWeeklyVolume(workouts);
  const personalRecords = findPersonalRecords(workouts);
  const overload        = computeOverloadSuggestions(workouts);
  const oneRMSeries     = computeOneRMSeries(workouts);

  const [nutritionLog, profile, whoopRecovery, whoopWorkoutsData] = await Promise.all([
    readNutritionLogServer(),
    readProfileServer(),
    getCachedWhoopRecovery(),
    getCachedWhoopWorkouts(),
  ]);

  const whoopEnrichedWorkouts = whoopWorkoutsData
    ? deduplicateAndEnrich(workouts, whoopWorkoutsData.workouts)
    : workouts;

  const nutritionSummary = summarizeNutrition(nutritionLog);
  const profileSummary   = summarizeProfile(profile);
  const whoopSummary     = whoopRecovery ? summarizeWhoopRecovery(whoopRecovery) : null;
  const summary = summarizeWorkouts(whoopEnrichedWorkouts, acwr, plateaus, balance, nutritionSummary, profileSummary, readiness, whoopSummary);

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
              Training
            </h1>
            <p
              className="mt-1"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.04em' }}
            >
              {workouts.length.toLocaleString()} workouts · analytics &amp; progression
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

        {/* ── SECTIONS ── */}
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

        </div>
      </div>

      <ChatPanel
        summary={summary}
        readiness={readiness}
        plateaus={plateaus}
        balance={balance}
        nutritionSummary={nutritionSummary}
        profileSummary={profileSummary}
        whoopSummary={whoopSummary}
      />
    </main>
  );
}
