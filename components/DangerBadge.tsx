interface DangerBadgeProps {
  level: 'danger' | 'warning' | 'ok' | 'info';
  label: string;
}

const styles: Record<DangerBadgeProps['level'], React.CSSProperties> = {
  danger:  { background: 'var(--red-dim)',   color: 'var(--red)',   border: '1px solid rgba(248,113,113,0.25)' },
  warning: { background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid rgba(251,191,36,0.25)' },
  ok:      { background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(52,211,153,0.25)' },
  info:    { background: 'var(--surface-up)', color: 'var(--text-2)', border: '1px solid var(--border-up)' },
};

export function DangerBadge({ level, label }: DangerBadgeProps) {
  return (
    <span
      style={{
        ...styles[level],
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.08em',
        padding: '3px 7px',
        borderRadius: 4,
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      {label.toUpperCase()}
    </span>
  );
}
