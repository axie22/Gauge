export const dynamic = 'force-dynamic';

import { getCachedWorkouts, getCachedTemplates, buildTemplateMap, enrichWorkouts } from '@/lib/hevy';
import {
  calculateAcwr,
  detectPlateaus,
  analyzeBalance,
  computeMuscleReadiness,
} from '@/lib/analytics';
import { summarizeWorkouts } from '@/lib/summarize';
import { readNutritionLogServer, summarizeNutrition } from '@/lib/nutrition-server';
import { readProfileServer, summarizeProfile } from '@/lib/profile-server';
import { getCachedWhoopRecovery, getCachedWhoopWorkouts, deduplicateAndEnrich, summarizeWhoopRecovery } from '@/lib/whoop-server';
import { ChatInterface } from '@/components/ChatInterface';

export default async function CoachPage() {
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
    <main
      style={{ background: 'var(--bg)', minHeight: '100vh', paddingTop: 48, display: 'flex', flexDirection: 'column' }}
    >
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 flex flex-col flex-1">

        {/* ── PAGE HEADER ── */}
        <div
          className="flex items-baseline justify-between py-6"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h1
              className="font-bold"
              style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--text-1)', letterSpacing: '-0.02em' }}
            >
              Coach
            </h1>
            <p
              className="mt-1"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.04em' }}
            >
              AI coaching · powered by Ollama
            </p>
          </div>
        </div>

        {/* ── FULL-PAGE CHAT ── */}
        <div
          className="flex-1 flex flex-col rounded-xl mt-4 mb-6 overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', minHeight: 600 }}
        >
          <ChatInterface
            summary={summary}
            readiness={readiness}
            plateaus={plateaus}
            balance={balance}
            nutritionSummary={nutritionSummary}
            profileSummary={profileSummary}
            whoopSummary={whoopSummary}
            fullPage
          />
        </div>

      </div>
    </main>
  );
}
