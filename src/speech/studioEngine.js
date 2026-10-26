// Plays the episode's pre-rendered neural speech (see scripts/render-audio.mjs).
// Each sentence is its own file; progress is the element's real playback
// position, and playbackRate keeps pitch, so the speed control still works.
const BASE = `${import.meta.env.BASE_URL}audio/ep001/`;

export function createStudioEngine({ onStatus }) {
  let loading = null;
  const byText = new Map(); // sentence text -> manifest item
  const elements = new Map(); // file -> preloaded <audio>

  function load() {
    if (!loading) {
      loading = fetch(`${BASE}manifest.json`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`manifest ${r.status}`))))
        .then((manifest) => {
          manifest.items.forEach((it) => byText.set(it.text, it));
          onStatus({ state: 'ready', durations: new Map(manifest.items.map((it) => [it.text, it.duration])) });
        })
        .catch((e) => onStatus({ state: 'missing', error: e.message }));
    }
    return loading;
  }

  function element(file) {
    let el = elements.get(file);
    if (!el) {
      el = new Audio(BASE + file);
      el.preload = 'auto';
      elements.set(file, el);
      if (elements.size > 24) elements.delete(elements.keys().next().value);
    }
    return el;
  }

  return {
    kind: 'studio',
    load,
    unlock() {},
    has: (text) => byText.has(text),
    prefetch(items) {
      items.forEach(({ text }) => byText.has(text) && element(byText.get(text).file));
    },
    speak({ text, speed, from = 0, onStart, onProgress, onEnd, onError }) {
      let cancelled = false;
      let raf = 0;
      let el = null;
      load().then(() => {
        if (cancelled) return;
        const item = byText.get(text);
        if (!item) {
          onError('This line has no recording yet. Run "npm run render-audio", or pick other voices in Voice settings.');
          return;
        }
        el = element(item.file);
        el.currentTime = from * item.duration;
        el.playbackRate = speed;
        el.preservesPitch = true;
        el.onended = () => {
          if (cancelled) return;
          cancelAnimationFrame(raf);
          onProgress(1);
          onEnd();
        };
        el.onerror = () => !cancelled && onError('Could not play the recorded speech.');
        el.play().then(
          () => {
            if (cancelled) return;
            onStart();
            const tick = () => {
              if (cancelled) return;
              onProgress(Math.min(1, el.currentTime / (el.duration || item.duration)));
              raf = requestAnimationFrame(tick);
            };
            tick();
          },
          (e) => !cancelled && e.name !== 'AbortError' && onError(`Playback was blocked (${e.message}). Press play again.`),
        );
      });
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
        if (el) {
          el.onended = null;
          el.pause();
        }
      };
    },
  };
}
