import { estimateSeconds, utteranceFor } from './engine.js';

// Web Speech API engine (the system / browser voices).
//
// Progress comes from word-boundary events when the voice reports them; many
// voices (Google's network voices among them) do not, so it falls back to an
// estimate from elapsed time, held just short of the end until onend fires.
// Utterances cannot start mid-way, so `from` is ignored.
export function createBrowserEngine() {
  const live = []; // keeps utterances referenced so Chrome doesn't GC them before onend

  return {
    kind: 'browser',
    unlock() {},
    prefetch() {},
    speak({ turn, text, voice, speed, onStart, onProgress, onEnd, onError }) {
      const u = utteranceFor(turn, text, { voice, speed });
      const estimate = (estimateSeconds(text, u.rate) * 1000) || 1;
      let done = false;
      let started = 0;
      let boundary = -1;
      let raf = 0;

      const tick = () => {
        if (done) return;
        const timed = Math.min(0.96, (performance.now() - started) / estimate);
        onProgress(boundary >= 0 ? boundary : timed);
        raf = requestAnimationFrame(tick);
      };

      u.onstart = () => {
        started = performance.now();
        onStart();
        tick();
      };
      u.onboundary = (e) => {
        if (e.name !== 'word') return;
        const end = e.charIndex + (e.charLength || (text.slice(e.charIndex).match(/^\S+/)?.[0].length ?? 0));
        boundary = Math.min(1, end / text.length);
      };
      u.onend = () => {
        if (done) return;
        done = true;
        cancelAnimationFrame(raf);
        onProgress(1);
        onEnd();
      };
      u.onerror = (e) => {
        if (done || e.error === 'canceled' || e.error === 'interrupted') return;
        done = true;
        cancelAnimationFrame(raf);
        onError(`Speech synthesis failed (${e.error}). Try another voice in Voice settings.`);
      };

      live.push(u);
      if (live.length > 8) live.shift();
      window.speechSynthesis.resume(); // Chrome can get stuck in a paused state
      window.speechSynthesis.speak(u);

      return () => {
        done = true;
        cancelAnimationFrame(raf);
        window.speechSynthesis.cancel();
      };
    },
  };
}
