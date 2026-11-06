/** The "Tick j" mark. White on the blue gradient tile, or ink + blue dot. */
export function AppMark({ size = 56, draw = false }: { size?: number; draw?: boolean }) {
  return (
    <span className={'jx-appicon' + (draw ? ' jx-appicon--draw' : '')} style={{ width: size, height: size, borderRadius: size * 0.225 }} aria-hidden="true">
      <svg width={size * 0.64} height={size * 0.64} viewBox="0 0 100 100" fill="none">
        <circle className="jx-mk-dot" cx="64" cy="18" r="10.5" fill="#fff" />
        <path className="jx-mk-tail" d="M64 40V80L36 58" stroke="#fff" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
      </svg>
    </span>
  );
}

export function Lockup({ light = false }: { light?: boolean }) {
  return (
    <span className="jx-lockup" style={{ color: light ? '#fff' : 'var(--text)' }}>
      <svg width="24" height="24" viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <circle cx="64" cy="18" r="10.5" fill={light ? '#fff' : 'var(--accent)'} />
        <path d="M64 40V80L36 58" stroke="currentColor" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      jaiye
    </span>
  );
}
