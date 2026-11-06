import { Mark } from './Logo';
import { useCurrency } from '../currency';
import { Bell, Search } from './Icons2';
import { Arrow, Calendar, Home, Mic, Plus, Send, Task, Trend, Video, Wallet } from './Icons';

/** A live miniature of the v2 Home screen, used in the hero. */
export function PhoneHome() {
  const { money } = useCurrency();
  const bars = [38, 62, 30, 74, 48, 18, 6];
  return (
    <div className="phone" role="img" aria-label="Jaiye Home screen: your day sorted, spending this week and your next meeting">
      <div className="phone__screen">
        <div className="ph-header" />
        <div className="ph-status"><span>9:41</span><span className="ph-ind" /></div>
        <div className="ph-greet">
          <span className="ph-avatar">J</span>
          <div className="ph-greet__text"><b>Good evening, Jaiye</b><small>4 tasks, 2 meetings today</small></div>
          <span className="ph-glass"><Search width={15} height={15} /></span>
          <span className="ph-glass"><Bell width={15} height={15} /></span>
        </div>
        <div className="ph-hero">
          <div className="ph-hero__top">
            <p className="ph-hero__title">Your day,<br /><span>sorted.</span></p>
            <span className="ph-tile"><Mark size={26} color="#fff" dot="#fff" /></span>
          </div>
          <div className="ph-capture">
            <span className="ph-cbtn"><Plus width={14} height={14} /></span>
            <span className="ph-cbtn"><Mic width={14} height={14} /></span>
            <span className="ph-ph">Tell Jaiye anything</span>
            <span className="ph-send"><Send width={13} height={13} /></span>
          </div>
        </div>
        <div className="ph-card ph-spend">
          <div className="ph-row"><div><small>Spent this week</small><b>{money(64300)}</b></div><span className="ph-trend"><Trend width={12} height={12} />12% less</span></div>
          <div className="ph-bars">{bars.map((h, i) => <span key={i} style={{ height: Math.max(5, h * 0.7), animationDelay: `${600 + i * 40}ms` }} className={i === 4 ? 'is-today' : ''} />)}</div>
        </div>
        <div className="ph-sec"><b>Up next</b><small>Google Calendar</small></div>
        <div className="ph-card ph-event">
          <div className="ph-row"><span className="tag meeting">Meeting</span><span className="ph-join"><Arrow width={13} height={13} /></span></div>
          <b>Design review with Throuly</b>
          <small><Video width={12} height={12} /> 3:00 PM, Google Meet</small>
        </div>
        <div className="ph-tabs">
          <div className="ph-bar">
            <span className="ph-tab is-on"><Home width={15} height={15} />Home</span>
            <span className="ph-tab"><Calendar width={15} height={15} /></span>
            <span className="ph-tab"><Wallet width={15} height={15} /></span>
            <span className="ph-tab"><Task width={15} height={15} /></span>
          </div>
          <span className="ph-fab"><Send width={15} height={15} /></span>
        </div>
      </div>
    </div>
  );
}
