import { memo, useEffect, useLayoutEffect, useRef } from 'react';
import { SPEAKERS } from '../data/structure.js';
import { formatClock } from '../speech/engine.js';
import { PauseIcon, PlayIcon } from './Icons.jsx';
import { RichText, SPEAKER_TEXT } from './common.jsx';

const NAME_TEXT = { advaita: 'text-ink', dvaita: 'text-dvaita', moderator: 'text-ink' };
const DOT = { advaita: 'bg-advaita', dvaita: 'bg-dvaita', moderator: 'bg-gold' };

// Live subtitles: only turns that have been reached are shown, and the turn
// being spoken reveals its words as they are heard.
export default function Transcript({ turns, timeline, index, progress, started, live, waiting, language, onPlayFrom, onPause, intro }) {
  const box = useRef(null);
  const stick = useRef(true);

  const onScroll = () => {
    const el = box.current;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  };

  // Follow the newest words unless the reader has scrolled back.
  useLayoutEffect(() => {
    const el = box.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  });

  // A seek always brings the current turn back into view.
  useEffect(() => {
    stick.current = true;
  }, [index]);

  if (!started) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-center">
        {intro}
      </div>
    );
  }

  const visible = turns.slice(0, index + 1);
  return (
    <div
      ref={box}
      onScroll={onScroll}
      className="scroll-fade scroll-warm relative min-h-0 flex-1 overflow-y-auto pr-2"
      aria-label="Subtitles"
      aria-live="polite"
    >
      <ol className="relative pt-6 pb-2">
        <span className="absolute top-[53px] bottom-14 left-[3.5px] w-px bg-gold/45" aria-hidden />
        {visible.map((turn, i) => (
          <TurnCard
            key={i}
            turn={turn}
            i={i}
            time={timeline.items[timeline.firstOf[i]].start}
            active={i === index}
            live={live && i === index}
            waiting={waiting && i === index}
            fraction={i === index ? progress : 1}
            language={language}
            onPlayFrom={onPlayFrom}
            onPause={onPause}
          />
        ))}
      </ol>
    </div>
  );
}

const TurnCard = memo(function TurnCard({ turn, i, time, active, live, waiting, fraction, language, onPlayFrom, onPause }) {
  const speaker = SPEAKERS[turn.speaker];
  const onPlay = () => (live ? onPause() : onPlayFrom(i));

  return (
    <li className="relative pl-5 sm:pl-[26px]">
      <span
        className={`absolute top-[29px] left-0 h-2 w-2 rounded-full transition-all ${DOT[turn.speaker]} ${
          active ? 'scale-150 shadow-[0_0_0_4px_rgb(168_116_42/0.18)]' : 'opacity-70'
        }`}
        aria-hidden
      />
      <div className="flex gap-4 border-b border-line py-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 pr-1">
            <span className={`text-[17px] font-semibold ${NAME_TEXT[turn.speaker]}`}>{speaker.name}</span>
            <span className="text-ink-faint">•</span>
            <span className={`text-[17px] ${SPEAKER_TEXT[turn.speaker]} ${turn.speaker === 'dvaita' ? 'italic' : ''}`}>{speaker.school}</span>
          </div>
          <Revealed turn={turn} fraction={fraction} sa={language === 'sa'} waiting={waiting} />
        </div>
        <div className="flex w-10 shrink-0 flex-col items-end gap-5 pt-1">
          <span className="text-xs text-ink-faint tabular-nums">{formatClock(time)}</span>
          <button
            type="button"
            onClick={onPlay}
            aria-label={live ? 'Pause' : `Play from ${speaker.name}, turn ${i + 1}`}
            className={`grid h-8 w-8 place-items-center rounded-full border transition-colors ${
              live ? 'border-bronze bg-bronze text-paper' : 'border-line bg-card-strong text-ink-soft hover:border-bronze hover:text-bronze'
            }`}
          >
            {live ? <PauseIcon className="h-3.5 w-3.5" /> : <PlayIcon className="h-3.5 w-3.5 translate-x-[1px]" />}
          </button>
        </div>
      </div>
    </li>
  );
});

// Cut `text` after the word containing character `n`.
function cut(text, n) {
  if (n >= text.length) return text;
  if (n <= 0) return '';
  const end = text.indexOf(' ', Math.ceil(n));
  return end < 0 ? text : text.slice(0, end);
}

// The turn's text, revealed in proportion to how much of its speech has been heard.
function Revealed({ turn, fraction, sa, waiting }) {
  const pieces = sa
    ? { main: turn.sa, qsa: turn.quote?.sa, after: turn.saAfter }
    : { main: turn.en, qsa: turn.quote?.sa, qen: turn.quote?.en, after: turn.enAfter };
  const total = Object.values(pieces).reduce((n, t) => n + (t?.length ?? 0), 0);
  let budget = fraction * total;
  const shown = {};
  for (const [key, text] of Object.entries(pieces)) {
    if (!text) continue;
    shown[key] = cut(text, budget);
    budget -= text.length;
  }

  const body = sa ? 'deva text-[16px] leading-[1.85]' : 'text-[16px] leading-[1.55]';
  return (
    <div lang={sa ? 'sa' : 'en'} className={`mt-2.5 text-ink-soft ${body}`}>
      {shown.main ? <p><RichText text={shown.main} /></p> : waiting && <Ellipsis />}
      {shown.qsa && (
        <figure className="my-3 border-l-2 border-gold py-1 pl-4">
          <blockquote lang="sa" className="deva text-[16.5px] leading-relaxed text-ink">{shown.qsa}</blockquote>
          {shown.qen && <p className="mt-1 italic">“{shown.qen}{shown.qen === turn.quote.en ? '”' : ''}</p>}
          {shown.qsa === turn.quote.sa && (!pieces.qen || shown.qen === turn.quote.en) && (
            <figcaption className="mt-1 text-sm text-ink-faint">
              — {sa ? <span className="deva">{turn.quote.refSa}</span> : <RichText text={turn.quote.ref} termClass="text-ink-soft" />}
            </figcaption>
          )}
        </figure>
      )}
      {shown.after && <p className="mt-2"><RichText text={shown.after} /></p>}
    </div>
  );
}

function Ellipsis() {
  return (
    <span className="inline-flex gap-1 py-2" aria-label="waiting for speech">
      {[0, 1, 2].map((i) => (
        <span key={i} className="pulse-dot h-1.5 w-1.5 rounded-full bg-gold" style={{ animationDelay: `${i * 160}ms` }} />
      ))}
    </span>
  );
}
