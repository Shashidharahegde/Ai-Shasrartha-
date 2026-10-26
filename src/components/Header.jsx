import { useMemo, useRef, useState } from 'react';
import { GLOSSARY } from '../data/glossary.js';
import { SPEAKERS } from '../data/structure.js';
import { Emblem, MoonIcon, SearchIcon, SunIcon } from './Icons.jsx';
import { RichText, SPEAKER_TEXT } from './common.jsx';

const NAV = [
  { id: 'debate', label: 'Debate' },
  { id: 'study', label: 'Study Path' },
  { id: 'sources', label: 'Sources' },
  { id: 'glossary', label: 'Glossary' },
];

const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function searchTurns(turns, query) {
  const q = fold(query.trim());
  if (q.length < 2) return [];
  // "vyapti" should also find turns that write the term as ವ್ಯಾಪ್ತಿ.
  const scripts = GLOSSARY.filter((g) => fold(g.iast).replace(/-/g, '').includes(q.replace(/-/g, ''))).map((g) => g.kn);
  return turns
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => {
      const hay = fold([t.title, t.type, t.en, t.enAfter, t.speech, t.quote?.en].filter(Boolean).join(' '));
      return hay.includes(q) || scripts.some((kn) => t.en.includes(kn)) || t.sa.includes(query.trim());
    })
    .slice(0, 8);
}

export default function Header({ turns, onNavigate, active, dark, onToggleDark, onSeek, onAbout }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const results = useMemo(() => searchTurns(turns, query), [turns, query]);

  return (
    <header className="relative z-30 mx-auto flex w-full max-w-[1360px] items-center gap-4 px-4 py-5 sm:px-6 lg:gap-8 lg:px-10">
      <a href="#" onClick={(e) => (e.preventDefault(), onNavigate('debate'))} className="flex min-w-0 items-center gap-3">
        <Emblem className="h-10 w-10 shrink-0 text-bronze sm:h-14 sm:w-14" />
        <div className="min-w-0 leading-tight">
          <div className="truncate font-display text-lg font-semibold tracking-[0.05em] whitespace-nowrap text-ink sm:text-2xl xl:text-[27px]">THE ETERNAL SHASTRARTHA</div>
          <div className="hidden text-[11px] tracking-[0.16em] whitespace-nowrap text-ink-soft uppercase sm:block">
            AI-generated dialogues on Indian philosophy
          </div>
        </div>
      </a>

      <nav className="mx-auto hidden items-center gap-6 whitespace-nowrap lg:flex xl:gap-8" aria-label="Primary">
        {NAV.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => onNavigate(n.id)}
            className={`border-b-2 pb-1 text-[15px] transition-colors ${
              active === n.id ? 'border-bronze text-bronze' : 'border-transparent text-ink hover:text-bronze'
            }`}
          >
            {n.label}
          </button>
        ))}
      </nav>

      <div ref={box} className="relative ml-auto hidden md:block lg:hidden xl:ml-0 xl:block">
        <label className="flex w-56 items-center gap-3 rounded-lg border border-line bg-card-strong/80 px-4 py-2.5 xl:w-[250px]">
          <SearchIcon className="h-[18px] w-[18px] shrink-0 text-ink" />
          <input
            value={query}
            onChange={(e) => (setQuery(e.target.value), setOpen(true))}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => e.key === 'Escape' && (setQuery(''), e.currentTarget.blur())}
            placeholder="Search concepts…"
            aria-label="Search the dialogue"
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
        </label>
        {open && query.trim().length >= 2 && (
          <div className="absolute right-0 mt-2 w-96 overflow-hidden rounded-xl border border-line bg-card-strong shadow-xl">
            {results.length === 0 ? (
              <div className="px-4 py-3 text-sm text-ink-faint">No turns mention “{query}”.</div>
            ) : (
              <ul className="scroll-warm max-h-96 overflow-y-auto py-1">
                {results.map(({ t, i }) => (
                  <li key={i}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => (onSeek(i), setOpen(false))}
                      className="block w-full px-4 py-2.5 text-left hover:bg-paper-2"
                    >
                      <div className="flex items-baseline justify-between gap-3 text-[11px] tracking-wider uppercase">
                        <span className={SPEAKER_TEXT[t.speaker]}>{SPEAKERS[t.speaker].name}</span>
                        <span className="text-ink-faint">Turn {String(i + 1).padStart(2, '0')}</span>
                      </div>
                      <div className="font-display text-base font-semibold text-ink">{t.title}</div>
                      <div className="line-clamp-1 text-sm text-ink-soft">
                        <RichText text={t.en} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <button type="button" onClick={onAbout} className="hidden text-[15px] text-ink hover:text-bronze md:block">
        About
      </button>

      <button
        type="button"
        onClick={onToggleDark}
        role="switch"
        aria-checked={dark}
        className="flex items-center gap-3 text-ink-soft"
        aria-label="Dark theme"
      >
        <SunIcon className={`h-5 w-5 ${dark ? 'text-ink-faint' : 'text-gold'}`} />
        <span className="relative h-7 w-12 rounded-full border border-line bg-card-strong/80">
          <span
            className={`absolute top-[3px] grid h-5 w-5 place-items-center rounded-full transition-all ${
              dark ? 'left-[24px] bg-gold text-paper' : 'left-[3px] bg-paper-2 text-bronze'
            }`}
          >
            <MoonIcon className="h-3.5 w-3.5" />
          </span>
        </span>
      </button>
    </header>
  );
}
