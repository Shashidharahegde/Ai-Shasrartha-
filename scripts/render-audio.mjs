// Pre-renders the episode's speech with Kokoro-82M so the site can play it
// without synthesising in the browser.
//
//   npm run render-audio            (full-precision model, ~326 MB download once)
//   npm run render-audio -- --q8    (quantised model, ~92 MB)
//
// Writes one MP3 per sentence to public/audio/ep001/ and a manifest with each
// sentence's text and duration. Sentences whose text, voice and speed are
// unchanged are skipped, so editing a line only re-renders that line.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { KokoroTTS } from 'kokoro-js';
import { TURNS } from '../src/data/episode1.js';
import { DEFAULT_NEURAL_VOICES, speakingRate, splitSentences } from '../src/speech/engine.js';

const OUT = 'public/audio/ep001';
const MANIFEST = join(OUT, 'manifest.json');
const dtype = process.argv.includes('--q8') ? 'q8' : 'fp32';

mkdirSync(OUT, { recursive: true });
const previous = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { items: [] };
const known = new Map(previous.items.map((it) => [it.file, it]));

console.log(`Loading Kokoro (${dtype})…`);
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype, device: 'cpu' });

const items = [];
const wav = join(tmpdir(), 'shastrartha-sentence.wav');
let rendered = 0;
for (const [i, turn] of TURNS.entries()) {
  const voice = DEFAULT_NEURAL_VOICES[turn.speaker];
  const speed = Number(speakingRate(turn.speaker, 'neural', 1).toFixed(2));
  for (const [s, text] of splitSentences(turn.speech).entries()) {
    const file = `${String(i).padStart(2, '0')}-${String(s).padStart(2, '0')}.mp3`;
    const old = known.get(file);
    if (old && old.text === text && old.voice === voice && old.speed === speed && old.dtype === dtype && existsSync(join(OUT, file))) {
      items.push(old);
      continue;
    }
    const audio = await tts.generate(text, { voice, speed });
    await audio.save(wav);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '64k', join(OUT, file)]);
    const duration = Number((audio.audio.length / audio.sampling_rate).toFixed(3));
    items.push({ turn: i, sentence: s, file, text, voice, speed, dtype, duration });
    rendered += 1;
    console.log(`${file}  ${duration.toFixed(1)}s  ${text.slice(0, 60)}`);
  }
}
rmSync(wav, { force: true });
const current = new Set(items.map((it) => it.file));
for (const it of previous.items) if (!current.has(it.file)) rmSync(join(OUT, it.file), { force: true });

const total = items.reduce((n, it) => n + it.duration, 0);
writeFileSync(MANIFEST, JSON.stringify({ model: 'Kokoro-82M-v1.0', items }, null, 1));
console.log(`Done: ${rendered} rendered, ${items.length - rendered} unchanged, ${(total / 60).toFixed(1)} min of speech.`);
