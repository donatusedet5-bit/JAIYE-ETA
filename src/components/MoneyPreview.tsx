import { Trend } from './Icons';
import { useCurrency } from '../currency';

/** Money card with income / spent / saved boxes and a daily spend line. */
export function MoneyPreview() {
  const { money } = useCurrency();
  return (
    <div className="mp">
      <div className="mp__top">
        <small>Left to spend</small>
        <b className="mp__big">{money(437700)}</b>
        <span className="mp__ok"><Trend width={13} height={13} /> on track</span>
      </div>
      <div className="mp__boxes">
        <div className="mp__box is-in"><small>Income</small><b>{money(850000)}</b></div>
        <div className="mp__box"><small>Spent</small><b>{money(412300)}</b></div>
        <div className="mp__box"><small>Saved</small><b>{money(120000)}</b></div>
      </div>
      <svg className="mp__chart" viewBox="0 0 322 90" preserveAspectRatio="none" aria-hidden="true">
        <path className="mp__area" d="M0 76 C22 72 34 58 54 61 C74 64 84 46 106 48 C128 50 136 33 160 36 C184 40 192 54 214 49 C236 44 246 25 268 28 C290 31 300 18 322 15 L322 90 L0 90 Z" />
        <path className="mp__line" pathLength={1} d="M0 76 C22 72 34 58 54 61 C74 64 84 46 106 48 C128 50 136 33 160 36 C184 40 192 54 214 49 C236 44 246 25 268 28 C290 31 300 18 322 15" />
      </svg>
    </div>
  );
}
