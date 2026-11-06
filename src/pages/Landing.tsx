import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppIcon, Lockup } from '../components/Logo';
import { PhoneHome } from '../components/PhoneHome';
import { CaptureDemo } from '../components/CaptureDemo';
import { CalendarZoom } from '../components/CalendarZoom';
import { MoneyPreview } from '../components/MoneyPreview';
import { DayTimeline, Faq, FinalCta, Install, Marquee, Showcase, Stats, Steps } from '../components/Sections';
import { Calendar, Lock, Mail, Moon, Sparkle, Sun, User, Wifi } from '../components/Icons';
import { useTheme } from '../theme';
import { CurrencyPicker, useFill } from '../currency';
import { useCycle, useMagnet, useReveal, useSpotlight, useTilt } from '../motion';

const FLOATS = [
  { t: 'Bolt to Yaba, {3200}', k: 'money', l: 'Money' },
  { t: 'Design review at 3', k: 'meeting', l: 'Meeting' },
  { t: 'Egusi and eba tonight', k: 'meals', l: 'Meals' },
  { t: 'Call Ada at 5', k: 'call', l: 'Call' },
];
const WORDS = ['your money.', 'your meals.', 'your meetings.', 'your sleep.', 'your day.'];

export default function Landing() {
  useReveal(); useSpotlight(); useMagnet();
  const fill = useFill();
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [prog, setProg] = useState(0);
  const tilt = useTilt<HTMLDivElement>(9);
  const [w] = useCycle(WORDS.length, 2200);

  useEffect(() => {
    const on = () => {
      setScrolled(window.scrollY > 24);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProg(h > 0 ? window.scrollY / h : 0);
    };
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <div className="lp">
      <div className="progress" style={{ transform: `scaleX(${prog})` }} aria-hidden="true" />
      <header className={'nav' + (scrolled ? ' is-solid' : '')}>
        <div className="wrap nav__in">
          <a href="#top" aria-label="Jaiye home"><Lockup light={!scrolled} /></a>
          <nav className="nav__links" aria-label="Sections">
            <a href="#how">How it works</a><a href="#features">Features</a><a href="#day">A day</a><a href="#install">Install</a>
          </nav>
          <div className="nav__end">
            <CurrencyPicker />
            <button className="icon-btn" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{theme === 'dark' ? <Sun /> : <Moon />}</button>
            <Link to="/app" className="btn btn--sm">Open Jaiye</Link>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero__bg" aria-hidden="true"><i className="blob blob--a" /><i className="blob blob--b" /><i className="blob blob--c" /><span className="grain" /></div>
          <div className="wrap hero__in">
            <div className="hero__copy">
              <AppIcon size={64} animate />
              <h1 className="h1">Enjoy life.<br /><span>Jaiye keeps track.</span></h1>
              <p className="lead">One box for <span className="rot" aria-live="polite"><span key={w} className="rot__w">{WORDS[w]}</span></span><br />Say it once and it lands in the right place.</p>
              <div className="hero__cta">
                <Link to="/app" className="btn magnet">Get started, it's free</Link>
                <a href="#install" className="btn btn--ghost magnet">How to install</a>
              </div>
              <ul className="hero__proof">
                <li><Sparkle width={14} height={14} /> Free AI</li><li><Wifi width={14} height={14} /> Works offline</li><li><Lock width={14} height={14} /> Private</li>
              </ul>
            </div>
            <div className="hero__visual">
              <div className="tilt" ref={tilt}>
                <PhoneHome />
                {FLOATS.map((f, i) => (
                  <div key={f.t} className={'float float--' + i} style={{ animationDelay: `${900 + i * 140}ms, ${1800 + i * 400}ms` }}>
                    <span>{fill(f.t)}</span><span className={'tag ' + f.k}>{f.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <a href="#how" className="scrollcue" aria-label="Scroll down"><span /></a>
        </section>

        <Marquee />

        <section id="how" className="sec">
          <div className="wrap">
            <div className="center head" data-reveal>
              <span className="eyebrow"><Sparkle width={14} height={14} /> How it works</span>
              <h2 className="h2">Talk to it like <span>a friend.</span></h2>
            </div>
            <Steps />
            <div className="split split--demo">
              <div className="split__copy" data-reveal>
                <h3 className="h3">One sentence. <span>Two things filed.</span></h3>
                <p className="lead">Jaiye spots the meeting and the money, then puts each one where it belongs.</p>
                <ul className="chips" aria-label="Tags Jaiye uses">
                  {['Money','Meeting','Call','Meals','Tasks','Sleep','Reminder'].map((t, i) => <li key={t} className={'tag ' + t.toLowerCase()} style={{ animationDelay: `${i * 60}ms` }}>{t}</li>)}
                </ul>
              </div>
              <div data-reveal><CaptureDemo /></div>
            </div>
          </div>
        </section>

        <section className="sec sec--tight">
          <div className="wrap" data-reveal><Stats /></div>
        </section>

        <section id="features" className="sec">
          <div className="wrap">
            <div className="center head" data-reveal>
              <span className="eyebrow"><Sparkle width={14} height={14} /> Features</span>
              <h2 className="h2">Everything in one place. <span>Nothing to fill in.</span></h2>
            </div>
            <div className="bento">
              <article className="bento__card bento__money spot" data-reveal>
                <header><h3>Money</h3><p>Income, spending and savings at a glance.</p></header>
                <MoneyPreview />
              </article>
              <article className="bento__card bento__cal spot" data-reveal>
                <header><h3>Calendar</h3><p>Pinch to zoom from month to day.</p></header>
                <CalendarZoom />
              </article>
            </div>
            <div data-reveal><Showcase /></div>
          </div>
        </section>

        <section id="day" className="sec">
          <div className="wrap">
            <div className="center head" data-reveal>
              <span className="eyebrow"><Sun width={14} height={14} /> A day with Jaiye</span>
              <h2 className="h2">From wake-up <span>to wind-down.</span></h2>
            </div>
            <DayTimeline />
          </div>
        </section>

        <section className="sec sec--tight">
          <div className="wrap sync spot" data-reveal>
            <div className="sync__copy">
              <h2 className="h2">Fills itself in.</h2>
              <p className="lead">Meetings, calls and bank alerts come straight in from Google.</p>
            </div>
            <div className="sync__orbit" aria-hidden="true">
              <span className="sync__core"><AppIcon size={60} /></span>
              <span className="sync__ring" />
              <span className="sync__app sync__app--a"><Calendar /></span>
              <span className="sync__app sync__app--b"><Mail /></span>
              <span className="sync__app sync__app--c"><User /></span>
              <i className="sync__pulse sync__pulse--a" /><i className="sync__pulse sync__pulse--b" /><i className="sync__pulse sync__pulse--c" />
            </div>
            <ul className="sync__apps">
              <li><span className="bico"><Calendar /></span>Google Calendar<small>Two-way</small></li>
              <li><span className="bico"><Mail /></span>Gmail<small>Bank alerts and invites only</small></li>
              <li><span className="bico"><User /></span>Contacts<small>Names and birthdays</small></li>
            </ul>
          </div>
        </section>

        <section className="sec sec--tight">
          <div className="wrap trio">
            <div className="trio__item spot" data-reveal><span className="bico"><Lock /></span><h3>Private</h3><p>PIN lock. Hide amounts in one tap.</p></div>
            <div className="trio__item spot" data-reveal><span className="bico"><Wifi /></span><h3>Works offline</h3><p>Syncs when you're back online.</p></div>
            <div className="trio__item spot" data-reveal><span className="bico"><Sparkle /></span><h3>Free AI</h3><p>Doesn't train on what you type.</p></div>
          </div>
        </section>

        <section id="install" className="sec">
          <div className="wrap" data-reveal><Install /></div>
        </section>

        <section className="sec sec--tight">
          <div className="wrap faqwrap">
            <h2 className="h2" data-reveal>Questions, <span>answered.</span></h2>
            <Faq />
          </div>
        </section>

        <div className="wrap"><FinalCta /></div>
      </main>

      <footer className="foot">
        <div className="wrap foot__in"><Lockup /><small>Made in Lagos. © 2026 Jaiye</small></div>
      </footer>
    </div>
  );
}
