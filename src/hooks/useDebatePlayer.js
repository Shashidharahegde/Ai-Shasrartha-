import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createBrowserEngine } from '../speech/browserEngine.js';
import { createKokoroEngine } from '../speech/kokoroEngine.js';
import { createStudioEngine } from '../speech/studioEngine.js';
import {
  DEFAULT_NEURAL_VOICES,
  GAP_SAME_SPEAKER,
  GAP_SPEAKER_CHANGE,
  VOICE_PROFILES,
  buildTimeline,
  isSpeechSupported,
  pickDefaultVoices,
  speakingRate,
  splitSentences,
  turnFraction,
} from '../speech/engine.js';

const PREFETCH = 3;
const PREFS_KEY = 'shastrartha-voice-v2';

function stored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function store(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

// Sequential playback controller over a flat sentence timeline.
//
// Position is (k, frac): sentence k of the timeline, and how much of it has
// been heard. The subtitles, clock and waveform all derive from it.
//
// `session` guards every async callback: any skip, pause, restart or cancel
// bumps it, so a callback or timer belonging to older speech becomes a no-op.
// Pausing stops the audio and keeps the position. The neural engines resume
// mid-sentence; browser voices cannot seek, so they restart the sentence.
export function useDebatePlayer(turns) {
  const browserSupported = isSpeechSupported();
  const prefs = useMemo(() => stored(PREFS_KEY, { engine: 'studio', device: 'wasm', neural: DEFAULT_NEURAL_VOICES }), []);

  const [engineKind, setEngineKind] = useState(prefs.engine);
  const [studioStatus, setStudioStatus] = useState({ state: 'idle' });
  const [neuralDevice, setNeuralDevice] = useState(prefs.device);
  const [neuralStatus, setNeuralStatus] = useState({ state: 'idle', progress: 0 });
  const [neuralVoices, setNeuralVoices] = useState({ ...DEFAULT_NEURAL_VOICES, ...prefs.neural });
  const [voices, setVoices] = useState([]);
  const [browserVoices, setBrowserVoices] = useState({ advaita: '', dvaita: '', moderator: '' });

  const [k, setK] = useState(0);
  const [frac, setFrac] = useState(0);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [stalled, setStalled] = useState(false); // speech requested but late to start
  const [ended, setEnded] = useState(false);
  const [language, setLanguage] = useState('en');
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState('');

  const durations = engineKind === 'studio' ? studioStatus.durations : undefined;
  const timeline = useMemo(() => buildTimeline(turns, { engine: engineKind, speed, durations }), [turns, engineKind, speed, durations]);

  const engines = useRef(null);
  if (!engines.current) {
    engines.current = {
      browser: createBrowserEngine(),
      studio: createStudioEngine({ onStatus: setStudioStatus }),
      neural: createKokoroEngine({ onStatus: (s) => setNeuralStatus((cur) => ({ ...cur, ...s })) }),
    };
  }

  const session = useRef(0);
  const kRef = useRef(0);
  const fracRef = useRef(0);
  const timer = useRef(null);
  const stallTimer = useRef(null);
  const cancelSpeech = useRef(null);
  const settings = useRef(null);
  settings.current = { engineKind, neuralDevice, speed, neuralVoices, browserVoices, voices, timeline };

  const engine = () => engines.current[settings.current.engineKind];

  const halt = useCallback(() => {
    session.current += 1;
    clearTimeout(timer.current);
    clearTimeout(stallTimer.current);
    cancelSpeech.current?.();
    cancelSpeech.current = null;
    setSpeaking(false);
    setStalled(false);
    return session.current;
  }, []);

  const place = useCallback((nextK, nextFrac = 0) => {
    kRef.current = nextK;
    fracRef.current = nextFrac;
    setK(nextK);
    setFrac(nextFrac);
  }, []);

  // Voice and rate for one sentence, in the shape the active engine wants.
  const voiceFor = useCallback((item) => {
    const s = settings.current;
    const turn = turns[item.turn];
    const speed = speakingRate(turn.speaker, s.engineKind, s.speed);
    if (s.engineKind === 'studio') return { turn, text: item.text, speed: s.speed };
    if (s.engineKind === 'neural') return { turn, text: item.text, voice: s.neuralVoices[turn.speaker], speed };
    const voice = s.voices.find((v) => v.voiceURI === s.browserVoices[turn.speaker]) || null;
    return { turn, text: item.text, voice, speed: s.speed };
  }, [turns]);

  const speakAt = useCallback(
    (at, sid, from = 0) => {
      if (sid !== session.current) return;
      const { items } = settings.current.timeline;
      const item = items[at];
      if (!item) {
        setPlaying(false);
        setPaused(false);
        setEnded(true);
        return;
      }
      place(at, from);
      engine().prefetch(items.slice(at + 1, at + 1 + PREFETCH).map(voiceFor));

      let shown = from;
      clearTimeout(stallTimer.current);
      stallTimer.current = setTimeout(() => sid === session.current && setStalled(true), 500);
      cancelSpeech.current = engine().speak({
        ...voiceFor(item),
        from,
        onStart: () => {
          if (sid !== session.current) return;
          clearTimeout(stallTimer.current);
          setStalled(false);
          setSpeaking(true);
        },
        onProgress: (f) => {
          if (sid !== session.current) return;
          fracRef.current = f;
          // Re-render only when the change is visible in the subtitles.
          if (f === 1 || f - shown > 0.02) {
            shown = f;
            setFrac(f);
          }
        },
        onEnd: () => {
          if (sid !== session.current) return;
          setSpeaking(false);
          const next = items[at + 1];
          const turn = turns[item.turn];
          const gap = !next
            ? 0
            : next.turn === item.turn
              ? VOICE_PROFILES[turn.speaker].sentencePause / settings.current.speed
              : turns[next.turn].speaker === turn.speaker
                ? GAP_SAME_SPEAKER
                : GAP_SPEAKER_CHANGE;
          timer.current = setTimeout(() => speakAt(at + 1, sid), gap);
        },
        onError: (message) => {
          if (sid !== session.current) return;
          clearTimeout(stallTimer.current);
          setStalled(false);
          console.warn(message);
          setError(message);
          setSpeaking(false);
          setPlaying(false);
          setPaused(true);
        },
      });
    },
    [turns, place, voiceFor],
  );

  const canSpeak = useCallback(() => {
    if (settings.current.engineKind === 'browser' && !browserSupported) {
      setError('This browser does not provide speech synthesis. Switch to the neural voices in Voice settings.');
      return false;
    }
    return true;
  }, [browserSupported]);

  const startFrom = useCallback(
    (at, from = 0) => {
      if (!canSpeak()) return;
      engine().unlock();
      if (settings.current.engineKind === 'neural') engines.current.neural.load(settings.current.neuralDevice);
      const sid = halt();
      place(at, from);
      setError('');
      setStarted(true);
      setEnded(false);
      setPlaying(true);
      setPaused(false);
      // A short delay after cancel() avoids a Chrome race where speak() is dropped.
      timer.current = setTimeout(() => speakAt(at, sid, from), 60);
    },
    [canSpeak, halt, place, speakAt],
  );

  const play = useCallback(() => {
    if (playing && !paused) return;
    if (ended) startFrom(0);
    else startFrom(kRef.current, fracRef.current < 1 ? fracRef.current : 0);
  }, [playing, paused, ended, startFrom]);

  const pause = useCallback(() => {
    if (!playing || paused) return;
    halt();
    setPaused(true);
  }, [playing, paused, halt]);

  const toggle = useCallback(() => (playing && !paused ? pause() : play()), [playing, paused, pause, play]);

  // Move to sentence `at`. Keeps playing if already playing; `autoplay` starts playback.
  const seekSentence = useCallback(
    (at, { autoplay = false } = {}) => {
      const target = Math.max(0, Math.min(settings.current.timeline.items.length - 1, at));
      if (autoplay || (playing && !paused)) {
        startFrom(target);
      } else {
        halt();
        place(target, 0);
        setStarted(true);
        setEnded(false);
        if (playing) setPaused(true);
      }
    },
    [playing, paused, startFrom, halt, place],
  );

  const seek = useCallback(
    (i, opts) => seekSentence(settings.current.timeline.firstOf[Math.max(0, Math.min(turns.length - 1, i))], opts),
    [turns.length, seekSentence],
  );

  const currentTime = (() => {
    const item = timeline.items[k];
    return item ? item.start + frac * item.dur : 0;
  })();

  // Skip by seconds on the estimated clock, landing on a sentence start.
  const skip = useCallback(
    (seconds) => {
      const { items } = settings.current.timeline;
      const item = items[kRef.current];
      const target = item.start + fracRef.current * item.dur + seconds;
      let at = 0;
      while (at < items.length - 1 && items[at + 1].start <= target) at += 1;
      if (seconds < 0 && at === kRef.current && fracRef.current < 0.15) at -= 1;
      seekSentence(at);
    },
    [seekSentence],
  );

  const next = useCallback(() => seek(settings.current.timeline.items[kRef.current].turn + 1), [seek]);
  const prev = useCallback(() => {
    const item = settings.current.timeline.items[kRef.current];
    seek(item.sentence === 0 && fracRef.current < 0.15 ? item.turn - 1 : item.turn);
  }, [seek]);

  // Restart the current sentence so speed or voice changes are heard at once.
  const restartSentence = useCallback(() => {
    if (playing && !paused) setTimeout(() => startFrom(kRef.current), 0);
  }, [playing, paused, startFrom]);


  const changeSpeed = useCallback((value) => {
    settings.current = { ...settings.current, speed: value };
    setSpeed(value);
    restartSentence();
  }, [restartSentence]);

  const changeVoices = useCallback(({ engine: kind, device, neural, browser }) => {
    halt();
    settings.current = { ...settings.current, engineKind: kind, neuralDevice: device, neuralVoices: neural, browserVoices: browser };
    setEngineKind(kind);
    setNeuralDevice(device);
    setNeuralVoices(neural);
    setBrowserVoices(browser);
    store(PREFS_KEY, { engine: kind, device, neural });
    if (kind === 'neural') engines.current.neural.load(device);
    restartSentence();
  }, [halt, restartSentence]);

  // Preview a role's voice outside the debate.
  const previewVoice = useCallback(
    (role, kind, voiceId) => {
      if (kind === 'browser' && !browserSupported) return;
      const sid = halt();
      setPlaying(false);
      setPaused(false);
      const target = engines.current[kind];
      target.unlock();
      if (kind === 'neural') target.load(settings.current.neuralDevice);
      const sample = turns.find((t) => t.speaker === role);
      const text = splitSentences(sample.speech)[0];
      const voice = kind === 'neural' ? voiceId : settings.current.voices.find((v) => v.voiceURI === voiceId) || null;
      const rate = kind === 'neural' ? speakingRate(role, 'neural', settings.current.speed) : settings.current.speed;
      cancelSpeech.current = target.speak({
        turn: sample,
        text,
        voice,
        speed: rate,
        onStart() {},
        onProgress() {},
        onEnd() {},
        onError: (m) => sid === session.current && setError(m),
      });
    },
    [browserSupported, halt, turns],
  );

  // The recordings' manifest is small; fetch it up front for real durations.
  useEffect(() => {
    engines.current.studio.load();
  }, []);

  // Without recordings, fall back to the browser voices.
  useEffect(() => {
    if (studioStatus.state !== 'missing' || settings.current.engineKind !== 'studio') return;
    halt();
    setPlaying(false);
    setPaused(false);
    setEngineKind(browserSupported ? 'browser' : 'neural');
  }, [studioStatus, halt, browserSupported]);

  // Start fetching the neural model as soon as it is the chosen engine.
  useEffect(() => {
    if (engineKind === 'neural') engines.current.neural.load(neuralDevice);
  }, [engineKind, neuralDevice]);

  // If the neural model cannot load, fall back to the browser voices.
  useEffect(() => {
    if (neuralStatus.state !== 'error' || settings.current.engineKind !== 'neural') return;
    halt();
    setPlaying(false);
    setPaused(false);
    if (!browserSupported) {
      setError(`Neural voices could not load (${neuralStatus.error}).`);
      return;
    }
    setEngineKind('browser');
    setError(`Neural voices could not load (${neuralStatus.error}). Using the browser voices instead.`);
  }, [neuralStatus, halt, browserSupported]);

  useEffect(() => {
    if (!browserSupported) return undefined;
    const load = () => {
      const list = window.speechSynthesis.getVoices();
      if (!list.length) return;
      setVoices(list);
      setBrowserVoices((cur) => {
        const defaults = pickDefaultVoices(list);
        const valid = (uri) => uri && list.some((v) => v.voiceURI === uri);
        return {
          advaita: valid(cur.advaita) ? cur.advaita : defaults.advaita,
          dvaita: valid(cur.dvaita) ? cur.dvaita : defaults.dvaita,
          moderator: valid(cur.moderator) ? cur.moderator : defaults.moderator,
        };
      });
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      session.current += 1;
      clearTimeout(timer.current);
      cancelSpeech.current?.();
    };
  }, [browserSupported]);

  const item = timeline.items[k];
  const index = item.turn;
  const waiting = playing && !paused && stalled;

  return {
    turns,
    timeline,
    index,
    turn: turns[index],
    k,
    frac,
    turnProgress: turnFraction(timeline, k, frac),
    currentTime,
    duration: timeline.total,
    started,
    playing,
    paused,
    speaking,
    waiting,
    ended,
    language,
    setLanguage,
    speed,
    setSpeed: changeSpeed,
    engineKind,
    studioStatus,
    neuralStatus,
    neuralDevice,
    neuralVoices,
    voices,
    browserVoices,
    setVoiceSettings: changeVoices,
    browserSupported,
    error,
    clearError: () => setError(''),
    play,
    pause,
    toggle,
    seek,
    skip,
    next,
    prev,
    previewVoice,
  };
}
