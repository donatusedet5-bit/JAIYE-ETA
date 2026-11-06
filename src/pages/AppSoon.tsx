import { Link } from 'react-router-dom';
import { AppIcon } from '../components/Logo';

/** Placeholder for /app until Stage 2 ships the real app shell. */
export default function AppSoon() {
  return (
    <main style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <AppIcon size={84} animate />
        <h1 style={{ margin: 0, fontSize: 34, letterSpacing: '-.04em', fontWeight: 600 }}>The app is on its way</h1>
        <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 17 }}>Home, Money and Calendar land in the next stage.</p>
        <Link to="/" className="btn" style={{ marginTop: 8 }}>Back to the home page</Link>
      </div>
    </main>
  );
}
