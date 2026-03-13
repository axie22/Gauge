'use client';

import { OverloadSuggestion } from '@/lib/hevy';
import { useUnits } from '@/lib/units';

interface Props {
  suggestions: OverloadSuggestion[];
}

const ACTION_CONFIG: Record<OverloadSuggestion['suggestion'], {
  verb: string; accent: string; prefix: string;
}> = {
  add_weight: { verb: 'Add weight',  accent: 'var(--green)',  prefix: '+' },
  add_rep:    { verb: 'Add a rep',   accent: 'var(--accent)', prefix: '+' },
  deload:     { verb: 'Deload',      accent: 'var(--amber)',  prefix: '↓' },
  maintain:   { verb: 'Maintain',    accent: 'var(--text-3)', prefix: '→' },
};

export function OverloadSuggestions({ suggestions }: Props) {
  const { fmtWeight } = useUnits();

  const actionable = suggestions.filter((s) => s.suggestion !== 'maintain');
  const display = (actionable.length > 0 ? actionable : suggestions).slice(0, 6);

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}
    >
      {/* Header */}
      <div className="mb-5">
        <h2 className="font-semibold" style={{ fontSize: 14, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
          Next Session
        </h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em', marginTop: 3 }}>
          PROGRESSIVE OVERLOAD
        </p>
      </div>

      {display.length === 0 ? (
        <div className="flex flex-1 items-center justify-center" style={{ color: 'var(--text-3)', fontSize: 13 }}>
          Need 3+ sessions per exercise
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {display.map((s, i) => {
            const { verb, accent, prefix } = ACTION_CONFIG[s.suggestion];
            const isLast = i === display.length - 1;

            // Format the action text
            let actionText = verb;
            if (s.suggestion === 'add_weight' && s.suggested_weight_kg) {
              const diff = s.suggested_weight_kg - s.last_weight_kg;
              actionText = `${prefix}${fmtWeight(Math.abs(diff))}`;
            } else if (s.suggestion === 'add_rep') {
              actionText = `${prefix}1 rep`;
            }

            return (
              <div
                key={s.exercise_template_id}
                className="py-3.5"
                style={!isLast ? { borderBottom: '1px solid var(--border)' } : {}}
              >
                {/* Action + exercise */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-medium truncate"
                      style={{ fontSize: 13, color: 'var(--text-1)', marginBottom: 3 }}
                    >
                      {s.exercise_title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                      {s.rationale}
                    </div>
                  </div>

                  {/* Action badge */}
                  <div className="shrink-0 text-right">
                    <div
                      className="tabular-nums font-bold"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 16,
                        color: accent,
                        lineHeight: 1,
                        marginBottom: 2,
                      }}
                    >
                      {actionText}
                    </div>
                    {s.suggested_weight_kg ? (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>
                        {fmtWeight(s.last_weight_kg)} → {fmtWeight(s.suggested_weight_kg)}
                      </div>
                    ) : (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>
                        {fmtWeight(s.last_weight_kg)} current
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
