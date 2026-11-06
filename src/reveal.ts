// On phones, show [data-reveal] blocks as soon as any part scrolls into view.
// The landing's own observer waits for a share of a block to be visible, which tall
// blocks on a narrow screen never reach, leaving blank gaps.
export function watchReveals() {
  if (!('IntersectionObserver' in window) || !matchMedia('(max-width: 960px)').matches) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
  const scan = () => document.querySelectorAll('[data-reveal]:not(.is-in)').forEach(el => io.observe(el));
  scan();
  new MutationObserver(scan).observe(document.getElementById('root')!, { childList: true, subtree: true });
}
