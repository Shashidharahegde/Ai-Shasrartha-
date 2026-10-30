// Exports the episode's sentences for the Indic Parler-TTS render in
// notebooks/voice_bakeoff.ipynb ("Full render").
//
//   npm run export-speech
//
// Each turn is split exactly as the player splits it, so the manifest the
// notebook writes lines up with the timeline. `text` is the player's lookup key;
// `tts` is what gets synthesised, with romanised Sanskrit replaced by Kannada
// script (src/data/pronunciation.js).
import { writeFileSync } from 'node:fs';
import { TURNS } from '../src/data/episode1.js';
import { splitSentences } from '../src/speech/engine.js';
import { SANSKRIT_SPEECH } from '../src/data/pronunciation.js';

const OUT = 'notebooks/ep001-speech.json';

// Brahmic blocks share one layout, so any Indic script maps to Kannada by offset.
const toKannada = (s) =>
  s
    .replace(/[।॥]/g, '')
    .replace(/[ऀ-ൿ]/g, (ch) => String.fromCharCode(0x0c80 + ((ch.charCodeAt(0) - 0x0900) % 0x80)))
    .trim();

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const entries = Object.entries(SANSKRIT_SPEECH)
  .sort(([a], [b]) => b.length - a.length)
  .map(([roman, script]) => ({ roman, kn: toKannada(script), re: new RegExp(`(?<![\\w-])${escape(roman)}(?![\\w-])`, 'g'), used: 0 }));

const items = [];
TURNS.forEach((turn, i) => {
  splitSentences(turn.speech).forEach((text, s) => {
    let tts = text;
    for (const e of entries) {
      tts = tts.replace(e.re, () => {
        e.used += 1;
        return e.kn;
      });
    }
    items.push({
      turn: i,
      sentence: s,
      speaker: turn.speaker,
      file: `${String(i).padStart(2, '0')}-${String(s).padStart(2, '0')}.mp3`,
      text,
      tts,
      sanskritOnly: !/[A-Za-z]/.test(tts),
    });
  });
});

writeFileSync(OUT, `${JSON.stringify({ episode: '001', items }, null, 1)}\n`);
const unused = entries.filter((e) => !e.used).map((e) => e.roman);
console.log(`${items.length} sentences, ${items.filter((it) => it.tts !== it.text).length} with Sanskrit, ${items.filter((it) => it.sanskritOnly).length} Sanskrit-only → ${OUT}`);
if (unused.length) console.warn(`Unused pronunciation entries: ${unused.join(', ')}`);
