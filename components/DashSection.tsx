export function DashSection({ label, children }: { label: string; children: React.ReactNode }) {
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
