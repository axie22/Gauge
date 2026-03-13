'use client';

import { useState } from 'react';
import { PersonalRecord } from '@/lib/hevy';
import { useUnits } from '@/lib/units';

interface Props {
  records: PersonalRecord[];
}

type SortMode = 'weight' | 'recent';

const PAGE_SIZE = 5;

export function PersonalRecords({ records }: Props) {
  const [sort, setSort] = useState<SortMode>('weight');
  const [page, setPage] = useState(0);
  const { fmtWeight } = useUnits();

  const recentCount = records.filter((r) => r.is_recent).length;

  const sorted =
    sort === 'weight'
      ? [...records].sort((a, b) => b.best_weight_kg - a.best_weight_kg)
      : [...records].sort((a, b) => b.best_date.localeCompare(a.best_date));

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSort(mode: SortMode) {
    setSort(mode);
    setPage(0);
  }

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}
    >
      <div className="flex items-start justify-between mb-5 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h2 className="font-semibold" style={{ fontSize: 14, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
              Personal Records
            </h2>
            {recentCount > 0 && (
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.08em',
                background: 'var(--green-dim)',
                color: 'var(--green)',
                border: '1px solid rgba(52,211,153,0.25)',
                padding: '2px 7px',
                borderRadius: 4,
              }}>
                {recentCount} NEW
              </span>
            )}
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em', marginTop: 3 }}>
            TOP {Math.min(records.length, 20)} EXERCISES
          </p>
        </div>

        {/* Sort toggle */}
        <div
          className="flex overflow-hidden shrink-0"
          style={{ border: '1px solid var(--border-up)', borderRadius: 6 }}
        >
          {(['weight', 'recent'] as SortMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleSort(mode)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.06em',
                padding: '5px 10px',
                background: sort === mode ? 'var(--surface-up)' : 'transparent',
                color: sort === mode ? 'var(--text-1)' : 'var(--text-3)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {mode === 'weight' ? 'HEAVIEST' : 'RECENT'}
            </button>
          ))}
        </div>
      </div>

      {records.length === 0 ? (
        <div className="flex flex-1 items-center justify-center" style={{ color: 'var(--text-3)', fontSize: 13 }}>
          No weighted exercises found
        </div>
      ) : (
        <>
          <div className="space-y-1.5 flex-1">
            {paginated.map((pr) => (
              <div
                key={pr.exercise_template_id}
                className="flex items-center gap-3"
                style={{
                  background: 'var(--surface-up)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '9px 12px',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div
                    className="truncate"
                    style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)' }}
                  >
                    {pr.exercise_title}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                    {pr.best_date}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {pr.is_recent && (
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      background: 'var(--green-dim)',
                      color: 'var(--green)',
                      border: '1px solid rgba(52,211,153,0.25)',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}>
                      PR
                    </span>
                  )}
                  <span
                    className="tabular-nums"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}
                  >
                    {fmtWeight(pr.best_weight_kg)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <span
              className="tabular-nums"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em' }}
            >
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} OF {sorted.length}
            </span>
            <div className="flex gap-1">
              {['←', '→'].map((arrow, idx) => (
                <button
                  key={arrow}
                  onClick={() => setPage((p) => p + (idx === 0 ? -1 : 1))}
                  disabled={idx === 0 ? page === 0 : page >= totalPages - 1}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border-up)',
                    background: 'transparent',
                    color: 'var(--text-2)',
                    cursor: 'pointer',
                    opacity: (idx === 0 ? page === 0 : page >= totalPages - 1) ? 0.25 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {arrow}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
