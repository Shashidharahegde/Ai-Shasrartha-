import { useCallback, useEffect, useState } from 'react';
import background from '../assets/CommonBackground.png';
import { EPISODE, TURNS } from './data/episode1.js';
import { PHASES } from './data/structure.js';
import { useDebatePlayer } from './hooks/useDebatePlayer.js';
import Header from './components/Header.jsx';
import PlayerBar from './components/PlayerBar.jsx';
import Transcript from './components/Transcript.jsx';
import { PlayIcon } from './components/Icons.jsx';
import { ScholarPortrait, Stage } from './components/Scholars.jsx';
import { AboutPanel, GlossaryPanel, SourcesPanel, StudyPath, VoiceSettings } from './components/Panels.jsx';
import { RichText } from './components/common.jsx';

// Light by default, as in the design; the reader's choice is remembered.
function initialDark() {
  try {
    return localStorage.getItem('shastrartha-theme') === 'dark';
  } catch {
    return false;
  }
}

export default function App() {
  const player = useDebatePlayer(TURNS);
  const { turn, index, timeline, turnProgress, language, playing, paused, waiting, started, speaking, seek, skip, toggle, pause, error, clearError } = player;
  const [panel, setPanel] = useState(null); // 'study' | 'sources' | 'glossary' | 'about' | 'voices'
  const [dark, setDark] = useState(initialDark);
  const live = playing && !paused;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('shastrartha-theme', dark ? 'dark' : 'light');
    } catch {
      /* storage unavailable */
    }
  }, [dark]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') return setPanel(null);
      if (panel || ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement?.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'ArrowRight') skip(15);
      else if (e.key === 'ArrowLeft') skip(-15);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [panel, toggle, skip]);

  const navigate = (id) => setPanel(id === 'debate' ? null : id);
  const playFrom = useCallback((i) => seek(i, { autoplay: true }), [seek]);

  const intro = (
    <div className="max-w-md">
      <div className="text-[11px] tracking-[0.24em] text-ink-faint uppercase">Episode {EPISODE.number}</div>
      <h1 className="mt-2 font-display text-4xl leading-tight font-semibold text-ink">
        <RichText text={EPISODE.title} termClass="text-bronze" />
      </h1>
      <p className="mt-1 font-display text-xl text-ink-soft italic">{EPISODE.subtitle}</p>
      <button
        type="button"
        onClick={toggle}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-bronze px-5 py-2.5 text-paper shadow-md transition-transform hover:scale-[1.03]"
      >
        <PlayIcon className="h-4 w-4" /> Begin the dialogue
      </button>
      <p className="mt-4 text-sm text-ink-faint">Subtitles appear as each scholar speaks.</p>
    </div>
  );

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden lg:h-screen">
      {/* Backdrop: the sabhā at dawn, veiled in the centre for legibility */}
      <div className="fixed inset-0 -z-10" aria-hidden>
        <img src={background} alt="" className="h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, transparent 0%, var(--veil) 29%, var(--veil) 71%, transparent 100%)' }}
        />
        <div className="absolute inset-0 bg-paper/60 lg:bg-paper/35" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-paper/90 to-transparent" />
      </div>

      <Header
        turns={TURNS}
        active={panel ?? 'debate'}
        onNavigate={navigate}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        onSeek={(i) => seek(i)}
        onAbout={() => setPanel('about')}
      />

      <ScholarPortrait speaker="advaita" side="left" current={turn.speaker} live={speaking} />
      <ScholarPortrait speaker="dvaita" side="right" current={turn.speaker} live={speaking} />

      <main className="relative z-20 mx-auto flex min-h-0 w-full max-w-[760px] flex-1 flex-col px-3 pb-5 sm:px-5 lg:w-[40vw] lg:max-w-none lg:px-0 xl:w-[39vw]">
        <div className="mb-2 flex gap-2 lg:hidden">
          {['study', 'sources', 'glossary', 'about'].map((id) => (
            <button key={id} type="button" onClick={() => setPanel(id)}
              className="rounded-full border border-line bg-card-strong/70 px-3 py-1 text-sm text-ink-soft capitalize">
              {id === 'study' ? 'Study path' : id}
            </button>
          ))}
        </div>

        <Stage current={turn.speaker} live={speaking} />

        <div className="flex h-[52vh] min-h-0 flex-col lg:h-auto lg:flex-1">
          <Transcript
            turns={TURNS}
            timeline={timeline}
            index={index}
            progress={turnProgress}
            started={started}
            live={live}
            waiting={waiting}
            language={language}
            onPlayFrom={playFrom}
            onPause={pause}
            intro={intro}
          />
        </div>

        <PhaseDots current={turn.phase} onJump={(i) => seek(i)} />

        {error && (
          <div role="alert" className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-advaita/30 bg-advaita/10 px-4 py-2 text-sm text-advaita">
            <span>{error}</span>
            <button type="button" onClick={clearError} className="underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="lg:-mx-[2vw]">
          <PlayerBar player={player} onVoiceSettings={() => setPanel('voices')} />
        </div>
      </main>

      {panel === 'voices' && <VoiceSettings player={player} onClose={() => setPanel(null)} />}
      {panel === 'study' && <StudyPath turns={TURNS} index={index} onJump={(i) => seek(i)} onClose={() => setPanel(null)} />}
      {panel === 'sources' && <SourcesPanel onClose={() => setPanel(null)} />}
      {panel === 'glossary' && <GlossaryPanel onClose={() => setPanel(null)} />}
      {panel === 'about' && <AboutPanel onClose={() => setPanel(null)} />}
    </div>
  );
}

// One quiet dot per phase of the argument; the current phase is filled.
function PhaseDots({ current, onJump }) {
  return (
    <nav aria-label="Argument phases" className="flex justify-center gap-2.5 py-4">
      {PHASES.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onJump(TURNS.findIndex((t) => t.phase === p.id))}
          title={p.label}
          aria-label={`Jump to ${p.label}`}
          aria-current={p.id === current ? 'step' : undefined}
          className="grid h-4 w-4 place-items-center"
        >
          <span className={`h-[7px] w-[7px] rounded-full transition-colors ${p.id === current ? 'bg-bronze' : 'bg-ink-faint/35 hover:bg-gold'}`} />
        </button>
      ))}
    </nav>
  );
}
