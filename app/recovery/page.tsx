export const dynamic = 'force-dynamic';

import { getCachedWorkouts, getCachedTemplates, buildTemplateMap, enrichWorkouts } from '@/lib/hevy';
import { analyzeBalance, computeMuscleReadiness } from '@/lib/analytics';
import { getCachedWhoopRecovery, getCachedWhoopWorkouts, getCachedWhoopSleep } from '@/lib/whoop-server';
import { MuscleReadinessChart } from '@/components/MuscleReadinessChart';
import { BalanceAnalyzer } from '@/components/BalanceAnalyzer';
import { WhoopRecoveryCard } from '@/components/WhoopRecoveryCard';
import { WhoopRecoveryTrend } from '@/components/WhoopRecoveryTrend';
import { WhoopSleepBreakdown } from '@/components/WhoopSleepBreakdown';
import { WhoopActivitiesLog } from '@/components/WhoopActivitiesLog';
import { WhoopConnectButton } from '@/components/WhoopConnectButton';
import { DashSection } from '@/components/DashSection';

export default async function RecoveryPage() {
  const [rawWorkouts, templates] = await Promise.all([
    getCachedWorkouts(),
    getCachedTemplates(),
  ]);

  const templateMap = buildTemplateMap(templates);
  const workouts = enrichWorkouts(rawWorkouts, templateMap);
  const readiness = computeMuscleReadiness(workouts);
  const balance   = analyzeBalance(workouts, 30);

  const [whoopRecovery, whoopWorkoutsData, whoopSleepRecords] = await Promise.all([
    getCachedWhoopRecovery(),
    getCachedWhoopWorkouts(),
    getCachedWhoopSleep(),
  ]);

  const hasWhoop = !!(whoopRecovery || whoopWorkoutsData);

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
              Recovery
            </h1>
            <p
              className="mt-1"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.04em' }}
            >
              muscle readiness · biometrics · balance
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

          <DashSection label="Readiness">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <MuscleReadinessChart results={readiness} />
              </div>
              <div className="lg:col-span-1">
                <BalanceAnalyzer workouts={workouts} initialBalance={balance} />
              </div>
            </div>
          </DashSection>

          <DashSection label="Biometrics">
            {hasWhoop ? (
              <>
                {whoopRecovery && (
                  <>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      <WhoopRecoveryCard data={whoopRecovery} />
                      <div className="lg:col-span-2">
                        <WhoopRecoveryTrend data={whoopRecovery} />
                      </div>
                    </div>
                    {whoopSleepRecords.length > 0 && (
                      <div className="mt-4">
                        <WhoopSleepBreakdown records={whoopSleepRecords} />
                      </div>
                    )}
                  </>
                )}
                {whoopWorkoutsData && whoopWorkoutsData.workouts.length > 0 && (
                  <div className="mt-4">
                    <WhoopActivitiesLog workouts={whoopWorkoutsData.workouts} />
                  </div>
                )}
              </>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-4 py-12 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <p style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
                  Connect Whoop to unlock biometric data
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em' }}>
                  Recovery scores, HRV, sleep breakdown, and activity enrichment
                </p>
                <div className="mt-2">
                  <WhoopConnectButton />
                </div>
              </div>
            )}
          </DashSection>

        </div>
      </div>
    </main>
  );
}
