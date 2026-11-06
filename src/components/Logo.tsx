/** Jaiye "Tick j": a j whose tail is a check mark. */
const DOT = { cx: 64, cy: 18, r: 10.5 };
const TAIL = 'M64 40V80L36 58';

type MarkProps = { size?: number; color?: string; dot?: string };

export function Mark({ size = 28, color = 'var(--text)', dot = 'var(--accent)' }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle {...DOT} fill={dot} />
      <path d={TAIL} stroke={color} strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AppIcon({ size = 56, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <span className={'app-icon' + (animate ? ' app-icon--draw' : '')} style={{ width: size, height: size, borderRadius: size * 0.225 }} aria-hidden="true">
      <svg width={size * 0.64} height={size * 0.64} viewBox="0 0 100 100" fill="none">
        <circle className="ai-dot" {...DOT} fill="#fff" />
        <path className="ai-tail" d={TAIL} stroke="#fff" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
      </svg>
    </span>
  );
}

export function Lockup({ light = false }: { light?: boolean }) {
  return (
    <span className="lockup" style={{ color: light ? '#fff' : 'var(--text)' }}>
      <Mark size={28} color={light ? '#fff' : 'var(--text)'} dot={light ? '#fff' : 'var(--accent)'} />
      <span>jaiye</span>
    </span>
  );
}
