import { useState } from 'react';
import { GLOSSARY } from '../data/glossary.js';
import { PROVENANCE, SOURCES } from '../data/sources.js';
import { FUNCTIONS, PHASES, SPEAKERS } from '../data/structure.js';
import { NEURAL_VOICES, STUDIO_VOICES, usableVoices } from '../speech/engine.js';
import { ExternalIcon } from './Icons.jsx';
import { Avatar, Modal, RichText, SPEAKER_TEXT } from './common.jsx';

const ROLE_NOTES = {
  advaita: 'Calm and contemplative — a little slower.',
  dvaita: 'Firm and analytical — natural pace.',
  moderator: 'Formal and neutral — measured, with deliberate pauses.',
};

const ENGINES = [
  {
    id: 'studio',
    label: 'Recorded neural',
    note: 'The episode pre-rendered with Kokoro-82M, an open-weight neural voice model. Starts instantly; voices are fixed.',
  },
  {
    id: 'neural',
    label: 'Live neural',
    note: 'Kokoro-82M running in this browser, with your choice of voices. Downloaded once, then cached. Needs a fast machine.',
  },
  {
    id: 'browser',
    label: 'Browser voices',
    note: 'Voices supplied by the browser and operating system (Microsoft, Google, Apple…). Quality varies.',
  },
];

function neuralStatusText(status) {
  if (status.state === 'ready') return `Ready · running on ${status.device === 'webgpu' ? 'the GPU (WebGPU)' : 'the CPU (WebAssembly)'}`;
  if (status.state === 'loading') return `Downloading model · ${Math.round(status.progress * 100)}%`;
  if (status.state === 'error') return `Unavailable · ${status.error}`;
  return 'Not loaded yet';
}

export function VoiceSettings({ player, onClose }) {
  const { voices, neuralVoices, neuralDevice, browserVoices, engineKind, studioStatus, neuralStatus, setVoiceSettings, previewVoice, browserSupported, language, setLanguage } = player;
  const [engine, setEngine] = useState(engineKind);
  const [device, setDevice] = useState(neuralDevice);
  const [neural, setNeural] = useState(neuralVoices);
  const [browser, setBrowser] = useState(browserVoices);
  const english = usableVoices(voices);
  const draft = engine === 'neural' ? neural : browser;
  const setDraft = engine === 'neural' ? setNeural : setBrowser;

  return (
    <Modal title="Voice & subtitles" kicker="Settings" onClose={onClose}>
      <div className="text-[11px] tracking-[0.18em] text-ink-faint uppercase">Subtitles</div>
      <div role="group" aria-label="Subtitle language" className="mt-2 inline-flex rounded-full border border-line bg-card p-0.5 text-sm">
        {[
          ['en', 'English'],
          ['sa', 'संस्कृतम्'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setLanguage(id)}
            aria-pressed={language === id}
            className={`rounded-full px-3 py-1 transition-colors ${id === 'sa' ? 'deva' : ''} ${
              language === id ? 'bg-bronze text-paper' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[13px] text-ink-faint">
        Subtitles appear as each line is spoken. The Sanskrit is a composed rendering for this prototype; audio stays in English.
      </p>

      <div className="mt-5 text-[11px] tracking-[0.18em] text-ink-faint uppercase">Voice engine</div>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {ENGINES.map((e) => {
          const disabled = (e.id === 'browser' && !browserSupported) || (e.id === 'studio' && studioStatus.state === 'missing');
          return (
            <button
              key={e.id}
              type="button"
              disabled={disabled}
              onClick={() => setEngine(e.id)}
              aria-pressed={engine === e.id}
              className={`rounded-xl border p-3 text-left transition-colors disabled:opacity-40 ${
                engine === e.id ? 'border-bronze bg-bronze/8' : 'border-line bg-card hover:border-gold'
              }`}
            >
              <div className="font-display text-lg font-semibold text-ink">{e.label}</div>
              <div className="text-[13px] leading-snug text-ink-soft">{e.note}</div>
              {e.id === 'studio' && (
                <div className="mt-1.5 text-[12px] text-bronze">{studioStatus.state === 'missing' ? 'No recordings found' : 'Ready'}</div>
              )}
              {e.id === 'neural' && <div className="mt-1.5 text-[12px] text-bronze">{neuralStatusText(neuralStatus)}</div>}
              {e.id === 'browser' && (
                <div className="mt-1.5 text-[12px] text-bronze">
                  {browserSupported ? `${english.length} English voice${english.length === 1 ? '' : 's'} on this device` : 'Not supported in this browser'}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {engine === 'neural' && (
        <label className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
          <span>Run the model on</span>
          <select
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            className="rounded-lg border border-line bg-card-strong px-2 py-1 text-sm text-ink"
          >
            <option value="wasm">CPU · compact model (~92 MB)</option>
            <option value="webgpu" disabled={!('gpu' in navigator)}>GPU · full model (~326 MB, faster)</option>
          </select>
        </label>
      )}

      <div className="mt-4 space-y-3">
        {engine !== 'studio' && ['moderator', 'advaita', 'dvaita'].map((role) => (
          <div key={role} className="flex items-center gap-3 rounded-xl border border-line bg-card p-3">
            <Avatar speaker={role} size={40} />
            <div className="min-w-0 flex-1">
              <div className={`font-display text-lg leading-tight font-semibold ${SPEAKER_TEXT[role]}`}>{SPEAKERS[role].name}</div>
              <div className="text-[12.5px] text-ink-faint">{ROLE_NOTES[role]}</div>
              <div className="mt-2 flex gap-2">
                <select
                  value={draft[role]}
                  onChange={(e) => setDraft({ ...draft, [role]: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-line bg-card-strong px-2 py-1.5 text-sm text-ink"
                  aria-label={`${SPEAKERS[role].name} voice`}
                >
                  {engine === 'neural' ? (
                    NEURAL_VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label} · {v.accent} male · grade {v.grade}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="">Browser default</option>
                      {english.map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => previewVoice(role, engine, draft[role])}
                  className="rounded-lg border border-line px-3 text-sm text-ink-soft hover:border-bronze hover:text-bronze"
                >
                  Preview
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {engine === 'studio' && (
        <p className="mt-3 text-[13px] text-ink-faint">
          Recorded voices (Indic Parler-TTS): {['advaita', 'dvaita', 'moderator'].map((r) => `${SPEAKERS[r].name} — ${STUDIO_VOICES[r]}`).join(' · ')}.
          Choose Live neural to pick different voices.
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-ink-soft hover:bg-paper-2">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => (setVoiceSettings({ engine, device, neural, browser }), onClose())}
          className="rounded-lg bg-bronze px-4 py-2 font-semibold text-paper hover:opacity-90"
        >
          Save voices
        </button>
      </div>
    </Modal>
  );
}

export function StudyPath({ turns, index, onJump, onClose }) {
  const members = ['pratijna', 'hetu', 'udaharana', 'upanaya', 'nigamana'];
  return (
    <Modal title="Study path" kicker="The structure of the argument" onClose={onClose} wide>
      <h3 className="font-display text-xl font-semibold text-ink">The Advaitin’s five-membered inference</h3>
      <p className="mt-1 text-[15px] text-ink-soft">
        Tarkaśāstra sets out an inference in five members (pañcāvayava). Every objection in the episode attacks one of them.
      </p>
      <ol className="mt-3 grid gap-2 sm:grid-cols-5">
        {members.map((m, n) => {
          const i = turns.findIndex((t) => t.phase === 'inference' && t.func === m);
          return (
            <li key={m}>
              <button
                type="button"
                onClick={() => (onJump(i), onClose())}
                className="h-full w-full rounded-xl border border-line bg-card p-3 text-left hover:border-gold"
              >
                <div className="text-[11px] text-ink-faint">{n + 1}</div>
                <div className="kn text-bronze">{FUNCTIONS[m].kn}</div>
                <div className="font-display font-semibold text-ink">{FUNCTIONS[m].en}</div>
                <div className="mt-1 line-clamp-3 text-[13px] text-ink-soft">
                  <RichText text={turns[i].en} />
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      <h3 className="mt-6 font-display text-xl font-semibold text-ink">Phases of the debate</h3>
      <ol className="mt-2 space-y-2">
        {PHASES.map((p, n) => {
          const idx = turns.map((t, i) => (t.phase === p.id ? i : -1)).filter((i) => i >= 0);
          const here = idx.includes(index);
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => (onJump(idx[0]), onClose())}
                className={`flex w-full items-start gap-4 rounded-xl border p-3 text-left hover:border-gold ${here ? 'border-gold bg-card-strong' : 'border-line bg-card'}`}
              >
                <span className="font-display text-2xl text-gold tabular-nums">{String(n + 1).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-2">
                    <span className="font-display text-lg font-semibold text-ink">{p.label}</span>
                    <span className="kn text-sm text-bronze">{p.kn}</span>
                    <span className="ml-auto text-xs text-ink-faint">
                      Turns {idx[0] + 1}–{idx[idx.length - 1] + 1}
                    </span>
                  </span>
                  <span className="block text-[14.5px] text-ink-soft">{p.blurb}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </Modal>
  );
}

export function SourcesPanel({ onClose }) {
  return (
    <Modal title="Sources" kicker="Source registry" onClose={onClose} wide>
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(SOURCES).map(([id, s]) => (
          <a
            key={id}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border border-line bg-card p-4 hover:border-gold"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-display text-xl font-semibold text-ink group-hover:text-bronze">{s.title}</div>
                <div className="text-[13px] text-ink-faint">{s.author}</div>
              </div>
              <ExternalIcon className="mt-1 h-4 w-4 shrink-0 text-ink-faint group-hover:text-bronze" />
            </div>
            <div className="mt-2 text-[14.5px] text-ink-soft">{s.locator}</div>
            <div className="mt-1 text-[12.5px] text-ink-faint">
              {s.kind === 'quotation' ? 'Quoted verbatim' : 'Paraphrased'} · {s.note} · {s.site}
            </div>
          </a>
        ))}
      </div>
      <h3 className="mt-6 font-display text-xl font-semibold text-ink">How each turn is labelled</h3>
      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
        {Object.entries(PROVENANCE).map(([k, p]) => (
          <div key={k} className="rounded-xl border border-line bg-card p-3">
            <dt className="font-semibold text-ink">{p.label}</dt>
            <dd className="text-[14px] text-ink-soft">{p.description}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}

export function GlossaryPanel({ onClose }) {
  return (
    <Modal title="Glossary" kicker="Technical terms" onClose={onClose} wide>
      <dl className="divide-y divide-line">
        {GLOSSARY.map((g) => (
          <div key={g.iast} className="grid gap-1 py-2.5 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-4">
            <dt>
              <span lang="kn" className="kn text-lg text-bronze">{g.kn}</span>
              <span className="ml-2 text-ink italic">{g.iast}</span>
              <span lang="sa" className="deva ml-2 text-sm text-ink-faint">{g.sa}</span>
            </dt>
            <dd className="text-[15px] text-ink-soft">{g.meaning}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}

export function AboutPanel({ onClose }) {
  return (
    <Modal title="About this prototype" kicker="The Eternal Shastrartha" onClose={onClose}>
      <div className="space-y-3 text-[15.5px] leading-relaxed text-ink-soft">
        <p>
          This is a demonstration of the listening experience for a future platform of Sanskrit philosophical debates. Episode 001 stages an
          exchange on <span className="kn text-bronze">ಮಿಥ್ಯಾತ್ವ</span> — whether the empirical world is ultimately real — between an Advaita and a
          Dvaita scholar, with a neutral moderator.
        </p>
        <p>
          <strong className="text-ink">Nothing here is generated by AI.</strong> The dialogue is prewritten and is spoken by your browser’s built-in
          speech synthesis. There is no server, database or paid API.
        </p>
        <p>
          The arguments are reconstructed in new words, inspired by Vyāsatīrtha’s <em>Nyāyāmṛta</em> and Madhusūdana Sarasvatī’s{' '}
          <em>Advaitasiddhi</em>. Only the passages marked “Śruti · verbatim quotation” are actual scripture (Chāndogya 6.2.1, 6.1.4; Kaṭha 2.2.13).
          The Sanskrit transcript is a composed rendering for this prototype, not a historical text.
        </p>
        <p>
          The two portraits are artistic illustrations of the traditions. The speakers are unnamed scholars of each school, not the historical
          authors. The progress bar counts dialogue turns; it is not an audio timeline.
        </p>
        <p className="text-[13.5px] text-ink-faint">Shortcuts: Space play/pause · ← → previous/next turn · Esc closes panels.</p>
      </div>
    </Modal>
  );
}
