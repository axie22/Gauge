'use client';

import { useUnits } from '@/lib/units';

interface Props {
  volumeKg: number;
}

export function VolumeStatCard({ volumeKg }: Props) {
  const { toDisplay, unit } = useUnits();
  const v = toDisplay(volumeKg);
  const display =
    v >= 1_000_000
      ? `${(v / 1_000_000).toFixed(1)}M`
      : v >= 1000
      ? `${(v / 1000).toFixed(1)}k`
      : Math.round(v).toLocaleString();

  return (
    <div className="px-6 py-7" style={{ borderRight: '1px solid var(--border)' }}>
      <div
        className="mb-3"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--text-3)',
          fontWeight: 500,
        }}
      >
        Volume
      </div>
      <div
        className="tabular-nums leading-none"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 48,
          fontWeight: 700,
          color: 'var(--text-1)',
          letterSpacing: '-0.02em',
        }}
      >
        {display}
      </div>
      <div
        className="mt-2"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-3)',
        }}
      >
        {unit} this month
      </div>
    </div>
  );
}
