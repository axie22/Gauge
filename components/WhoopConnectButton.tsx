'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export function WhoopConnectButton() {
  const [connected, setConnected] = useState<boolean | null>(null); // null = loading
  const [disconnecting, setDisconnecting] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/whoop/status')
      .then((r) => r.json())
      .then(({ connected }: { connected: boolean }) => setConnected(connected))
      .catch(() => setConnected(false));
  }, []);

  // Handle redirect back from OAuth with ?whoop=connected
  useEffect(() => {
    const whoopParam = searchParams.get('whoop');
    if (whoopParam === 'connected') {
      setConnected(true);
      router.replace('/profile');
    }
  }, [searchParams, router]);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch('/api/auth/whoop', { method: 'DELETE' });
      setConnected(false);
    } finally {
      setDisconnecting(false);
    }
  }

  // Loading state
  if (connected === null) {
    return (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em' }}>
        CHECKING…
      </div>
    );
  }

  if (connected) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500 }}>
            Whoop connected
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.08em',
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid var(--border-up)',
            background: 'transparent',
            color: 'var(--text-3)',
            cursor: disconnecting ? 'not-allowed' : 'pointer',
            opacity: disconnecting ? 0.5 : 1,
            transition: 'all 0.15s',
          }}
        >
          {disconnecting ? 'DISCONNECTING…' : 'DISCONNECT'}
        </button>
      </div>
    );
  }

  return (
    <div>
      <a
        href="/api/auth/whoop"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.08em',
          fontWeight: 700,
          padding: '10px 16px',
          borderRadius: 8,
          border: '1px solid var(--accent-border)',
          background: 'var(--accent-dim)',
          color: 'var(--accent)',
          textDecoration: 'none',
          transition: 'all 0.15s',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="7" cy="7" r="2.5" fill="currentColor" />
        </svg>
        CONNECT WHOOP
      </a>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em', marginTop: 8 }}>
        Unlocks recovery scores, HRV, and biometric enrichment for your workouts
      </p>
    </div>
  );
}
