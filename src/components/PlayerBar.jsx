import { formatClock } from '../speech/engine.js';
import { Back15Icon, Forward15Icon, PauseIcon, PlayIcon, VoiceIcon } from './Icons.jsx';

const SPEEDS = [0.75, 0.9, 1, 1.15, 1.3];
const BARS = 64;
// Fixed decorative heights; the waveform does not analyse audio.
const HEIGHTS = Array.from({ length: BARS }, (_, i) => 0.22 + 0.78 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.45)));

export default function PlayerBar({ player, onVoiceSettings }) {
  const { playing, paused, speaking, waiting, currentTime, duration, speed, setSpeed, toggle, skip, engineKind, neuralStatus } = player;
  const active = playing && !paused;
  const progress = duration ? currentTime / duration : 0;
  const loading = engineKind === 'neural' && neuralStatus.state === 'loading';
  const status = loading
    ? `Loading neural voices · ${Math.round(neuralStatus.progress * 100)}%${neuralStatus.bytes > 1e6 ? ` of ${Math.round(neuralStatus.bytes / 1e6)} MB` : ''}`
    : waiting
      ? 'Preparing voice…'
      : '';

  const cycleSpeed = () => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]);

  return (
    <div className="mx-auto w-full rounded-full border border-line bg-card-strong/95 px-4 py-3 shadow-[0_18px_50px_-20px_rgb(60_35_10/0.45)] backdrop-blur sm:px-7">
      <div className="flex items-center gap-3 sm:gap-5">
        <button type="button" onClick={() => skip(-15)} aria-label="Back 15 seconds" title="Back 15 seconds (←)"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-paper-2 hover:text-ink">
          <Back15Icon className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={toggle}
          aria-label={active ? 'Pause' : paused ? 'Resume' : 'Play'}
          title={`${active ? 'Pause' : paused ? 'Resume' : 'Play'} (Space)`}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-bronze text-paper shadow-md transition-transform hover:scale-105 active:scale-95"
        >
          {active ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5 translate-x-[1px]" />}
        </button>
        <button type="button" onClick={() => skip(15)} aria-label="Forward 15 seconds" title="Forward 15 seconds (→)"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-paper-2 hover:text-ink">
          <Forward15Icon className="h-6 w-6" />
        </button>

        <span className="hidden h-7 w-px bg-line sm:block" aria-hidden />

        <div className="relative min-w-[56px] flex-1">
          <div className={`flex h-8 items-center gap-[2px] overflow-hidden ${speaking ? 'wave-live' : ''}`} aria-hidden>
            {HEIGHTS.map((h, i) => (
              <span
                key={i}
                className={`wave-bar w-[2px] shrink-0 grow rounded-full ${i / BARS < progress ? 'bg-bronze' : 'bg-ink-faint/35'}`}
                style={{ height: `${h * 100}%`, '--delay': `${(i * 67) % 900}ms`, '--dur': `${700 + ((i * 131) % 500)}ms` }}
              />
            ))}
          </div>
          {status && (
            <div className="absolute inset-x-0 -bottom-3.5 truncate text-center text-[10.5px] tracking-wider text-ink-faint uppercase" aria-live="polite">
              {status}
            </div>
          )}
        </div>

        {/* Times are estimated from the text, so the clock is approximate. */}
        <div className="shrink-0 text-[15px] text-ink tabular-nums" title="Approximate time">
          {formatClock(currentTime)} <span className="text-ink-soft">/</span> {formatClock(duration)}
        </div>

        <button type="button" onClick={cycleSpeed} aria-label={`Playback speed ${speed}×`} title="Playback speed"
          className="shrink-0 rounded-full px-2 py-1 text-[15px] text-ink tabular-nums hover:bg-paper-2">
          {speed}×
        </button>

        <button type="button" onClick={onVoiceSettings} aria-label="Voice and subtitle settings" title="Voice and subtitle settings"
          className="-ml-2 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-paper-2 hover:text-ink">
          <VoiceIcon className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  );
}
