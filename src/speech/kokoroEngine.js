import { clamp } from './engine.js';

const CACHE_LIMIT = 48;

// Neural engine backed by Kokoro in a Web Worker.
//
// Sentences are synthesised one at a time in the worker. The sentence about to
// be spoken jumps the queue; the next few are prefetched while the current one
// plays, so turns follow each other without synthesis gaps. Progress is the
// real playback position of the decoded audio.
export function createKokoroEngine({ onStatus }) {
  let worker = null;
  let device = null;
  let ready = false;
  let ctx = null;
  let busy = null; // key of the job in the worker
  let seq = 0;
  const jobs = new Map(); // key -> { id, text, voice, speed, promise, resolve, reject, buffer }
  const queue = []; // keys waiting for the worker

  const keyOf = (text, voice, speed) => `${voice}|${speed.toFixed(2)}|${text}`;

  function audioContext() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function pump() {
    if (!ready || busy || !queue.length) return;
    busy = queue.shift();
    const job = jobs.get(busy);
    if (!job) {
      busy = null;
      pump();
      return;
    }
    worker.postMessage({ type: 'generate', id: busy, text: job.text, voice: job.voice, speed: job.speed });
  }

  function trim() {
    if (jobs.size <= CACHE_LIMIT) return;
    for (const [key, job] of jobs) {
      if (jobs.size <= CACHE_LIMIT) break;
      if (job.buffer && key !== busy) jobs.delete(key);
    }
  }

  // `wanted`: 'wasm' (quantised, ~92 MB) or 'webgpu' (full precision, ~326 MB).
  function load(wanted = 'wasm') {
    if (worker && device === wanted) return;
    if (worker) {
      worker.terminate();
      for (const job of jobs.values()) job.reject(new Error('voice engine restarted'));
      jobs.clear();
      queue.length = 0;
      busy = null;
      ready = false;
    }
    device = wanted;
    onStatus({ state: 'loading', progress: 0, bytes: 0, error: '' });
    worker = new Worker(new URL('./kokoro.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (data.type === 'progress') {
        onStatus({ state: 'loading', progress: data.total ? data.loaded / data.total : 0, bytes: data.total });
      } else if (data.type === 'ready') {
        ready = true;
        onStatus({ state: 'ready', device: data.device });
        pump();
      } else if (data.type === 'load-error') {
        onStatus({ state: 'error', error: data.message });
        for (const job of jobs.values()) job.reject(new Error(data.message));
        jobs.clear();
        queue.length = 0;
      } else if (data.type === 'audio' || data.type === 'audio-error') {
        const job = jobs.get(data.id);
        busy = null;
        if (job) {
          if (data.type === 'audio') {
            const c = audioContext();
            const buffer = c.createBuffer(1, data.audio.length, data.rate);
            buffer.copyToChannel(data.audio, 0);
            job.buffer = buffer;
            job.resolve(buffer);
          } else {
            jobs.delete(data.id);
            job.reject(new Error(data.message));
          }
        }
        trim();
        pump();
      }
    };
    worker.onerror = (e) => {
      onStatus({ state: 'error', error: e.message || 'The neural voice worker failed to start.' });
    };
    worker.postMessage({ type: 'load', device: wanted });
  }

  function request(text, voice, speed, urgent) {
    const key = keyOf(text, voice, speed);
    let job = jobs.get(key);
    if (!job) {
      job = { id: key, seq: ++seq, text, voice, speed };
      job.promise = new Promise((resolve, reject) => {
        job.resolve = resolve;
        job.reject = reject;
      });
      job.promise.catch(() => {});
      jobs.set(key, job);
      queue.push(key);
    }
    if (urgent && !job.buffer && key !== busy) {
      const at = queue.indexOf(key);
      if (at > 0) {
        queue.splice(at, 1);
        queue.unshift(key);
      }
    }
    pump();
    return job.promise;
  }

  return {
    kind: 'neural',
    load,
    // Must run inside a user gesture so the AudioContext may start.
    unlock() {
      audioContext().resume?.();
    },
    prefetch(items) {
      items.forEach(({ text, voice, speed }) => request(text, voice, clamp(speed, 0.5, 2), false));
    },
    speak({ text, voice, speed, from = 0, onStart, onProgress, onEnd, onError }) {
      let cancelled = false;
      let source = null;
      let raf = 0;
      request(text, voice, clamp(speed, 0.5, 2), true).then(
        (buffer) => {
          if (cancelled) return;
          const c = audioContext();
          source = c.createBufferSource();
          source.buffer = buffer;
          source.connect(c.destination);
          const offset = from * buffer.duration;
          const t0 = c.currentTime - offset;
          source.onended = () => {
            if (cancelled) return;
            cancelAnimationFrame(raf);
            onProgress(1);
            onEnd();
          };
          source.start(0, offset);
          onStart();
          const tick = () => {
            if (cancelled) return;
            onProgress(Math.min(1, (c.currentTime - t0) / buffer.duration));
            raf = requestAnimationFrame(tick);
          };
          tick();
        },
        (e) => !cancelled && onError(`Neural voice failed: ${e.message}`),
      );
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
        if (source) {
          source.onended = null;
          try {
            source.stop();
          } catch {
            /* already stopped */
          }
        }
      };
    },
  };
}
