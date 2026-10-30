// Shared speech helpers. A turn is spoken sentence by sentence: this gives the
// moderator deliberate pauses, keeps synthesis chunks short, and lets the
// subtitle reveal follow each sentence's real playback position.

export const isSpeechSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

export const VOICE_PROFILES = {
  // Calm, contemplative: slightly lower and slower.
  advaita: { rate: 0.88, neuralRate: 0.92, pitch: 0.84, sentencePause: 280, questionLift: 0.04 },
  // Firm and analytical: natural rate, a clear rise on questions.
  dvaita: { rate: 1.0, neuralRate: 1.0, pitch: 1.0, sentencePause: 170, questionLift: 0.14 },
  // Formal and neutral: measured, with deliberate pauses.
  moderator: { rate: 0.9, neuralRate: 0.95, pitch: 0.95, sentencePause: 450, questionLift: 0.05 },
};

export const GAP_SAME_SPEAKER = 230;
export const GAP_SPEAKER_CHANGE = 500;

// Neural voices (Kokoro-82M). Male voices only; grades are from the model card.
export const NEURAL_VOICES = [
  { id: 'bm_george', label: 'George', accent: 'British', grade: 'C' },
  { id: 'bm_fable', label: 'Fable', accent: 'British', grade: 'C' },
  { id: 'bm_lewis', label: 'Lewis', accent: 'British', grade: 'D+' },
  { id: 'bm_daniel', label: 'Daniel', accent: 'British', grade: 'D' },
  { id: 'am_michael', label: 'Michael', accent: 'American', grade: 'C+' },
  { id: 'am_fenrir', label: 'Fenrir', accent: 'American', grade: 'C+' },
  { id: 'am_puck', label: 'Puck', accent: 'American', grade: 'C+' },
  { id: 'am_onyx', label: 'Onyx', accent: 'American', grade: 'D' },
];

export const DEFAULT_NEURAL_VOICES = { moderator: 'bm_fable', advaita: 'bm_george', dvaita: 'am_michael' };

// Indic Parler-TTS speakers in the recordings (public/audio/ep001/manifest.json).
export const STUDIO_VOICES = { moderator: 'Dinesh', advaita: 'Dinesh', dvaita: 'Chetan' };

export function splitSentences(text) {
  const parts = text.match(/[^.!?]+[.!?]+["”’]?|[^.!?]+$/g) || [text];
  return parts.map((s) => s.trim()).filter(Boolean);
}

// Rough speaking time, used for the clock and ±15 s skips before real audio
// durations are known.
const CHARS_PER_SECOND = 14.5;
export const estimateSeconds = (text, rate) => text.length / (CHARS_PER_SECOND * rate);

export const speakingRate = (speaker, engine, speed) =>
  (engine === 'neural' ? VOICE_PROFILES[speaker].neuralRate : VOICE_PROFILES[speaker].rate) * speed;

// Flattens the episode into sentences on one estimated clock.
//   items[k] = { turn, sentence, text, start, dur, chars, charsBefore }
//   firstOf[i] = index of turn i's first sentence
//
// `durations` (sentence text -> seconds at 1×) replaces the estimate when the
// speech is pre-recorded.
export function buildTimeline(turns, { engine, speed, durations }) {
  const items = [];
  const firstOf = [];
  const turnChars = [];
  let t = 0;
  turns.forEach((turn, i) => {
    if (i > 0) t += (turns[i - 1].speaker === turn.speaker ? GAP_SAME_SPEAKER : GAP_SPEAKER_CHANGE) / 1000;
    firstOf[i] = items.length;
    const rate = speakingRate(turn.speaker, engine, speed);
    let before = 0;
    splitSentences(turn.speech).forEach((text, s, all) => {
      const recorded = durations?.get(text);
      const dur = recorded ? recorded / speed : estimateSeconds(text, rate);
      items.push({ turn: i, sentence: s, text, start: t, dur, chars: text.length, charsBefore: before });
      before += text.length + 1;
      t += dur;
      if (s < all.length - 1) t += VOICE_PROFILES[turn.speaker].sentencePause / 1000 / speed;
    });
    turnChars[i] = before;
  });
  return { items, firstOf, turnChars, total: t };
}

// The share of a turn that has been spoken, 0..1.
export function turnFraction(timeline, k, frac) {
  const item = timeline.items[k];
  if (!item) return 0;
  return Math.min(1, (item.charsBefore + frac * item.chars) / timeline.turnChars[item.turn]);
}

export function utteranceFor(turn, sentence, { voice, speed = 1 }) {
  const profile = VOICE_PROFILES[turn.speaker];
  const utterance = new SpeechSynthesisUtterance(sentence);
  const isQuestion = sentence.trim().endsWith('?');
  utterance.rate = clamp(profile.rate * speed, 0.5, 2);
  utterance.pitch = clamp(profile.pitch + (isQuestion ? profile.questionLift : 0), 0, 2);
  utterance.volume = 1;
  utterance.lang = 'en-IN';
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang || 'en-IN';
  }
  return utterance;
}

// English voices only: the speech track is English-oriented text.
export const usableVoices = (voices) => voices.filter((v) => /^en([-_]|$)/i.test(v.lang));

// Prefer en-IN, then Microsoft natural voices, then other English voices, and
// give each role a different voice when the system has enough of them.
// Google network voices rank last.
export function pickDefaultVoices(voices) {
  const english = usableVoices(voices);
  const rank = (v) =>
    (/^en[-_]IN/i.test(v.lang) ? 0 : /^en[-_]GB/i.test(v.lang) ? 1 : 2) +
    (/natural|online/i.test(v.name) ? -0.5 : 0) +
    (/google/i.test(v.name) ? 3 : 0);
  const ordered = [...english].sort((a, b) => rank(a) - rank(b));
  const pick = (n) => (ordered.length ? ordered[Math.min(n, ordered.length - 1)].voiceURI : '');
  return { moderator: pick(0), advaita: pick(1), dvaita: pick(2) };
}

export function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

export function formatClock(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
