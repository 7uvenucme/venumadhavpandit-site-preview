import Lenis from 'lenis';
import '../styles/smooth-scroll.css';

// One initializer shared by the site layout and the standalone calculator.
// Keep touch-enabled controls and nested artwork scrolling native.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let lenis: Lenis | undefined;
let frame = 0;

function destroy() {
  cancelAnimationFrame(frame);
  lenis?.destroy();
  lenis = undefined;
}

function start() {
  if (lenis || reducedMotion.matches || /\/admin(?:\/|$)/.test(location.pathname)) return;
  lenis = new Lenis({
    anchors: true,
    syncTouch: true,
    syncTouchLerp: 0.075,
    prevent: (node) => node.matches('dialog, .art-track'),
  });
  syncDialog();
  const raf = (time: number) => {
    lenis?.raf(time);
    frame = requestAnimationFrame(raf);
  };
  frame = requestAnimationFrame(raf);
}

function syncDialog() {
  if (document.querySelector('dialog[open]')) lenis?.stop();
  else lenis?.start();
}
const dialogs = new MutationObserver(syncDialog);
document.querySelectorAll('dialog').forEach((dialog) => {
  dialogs.observe(dialog, { attributes: true, attributeFilter: ['open'] });
});

reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) destroy();
  else start();
});
// Stop loops on departure, but restore them when returning from the back/forward cache.
window.addEventListener('pagehide', destroy);
window.addEventListener('pageshow', start);
start();
