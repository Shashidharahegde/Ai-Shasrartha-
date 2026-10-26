import { FUNCTIONS, PHASES } from '../data/structure.js';
import { PROVENANCE, SOURCES } from '../data/sources.js';
import { ExternalIcon } from './Icons.jsx';

const PROVENANCE_STYLE = {
  quotation: 'bg-gold/15 text-bronze',
  paraphrase: 'bg-dvaita/10 text-dvaita',
  composed: 'bg-moderator/12 text-moderator',
  unverified: 'bg-advaita/10 text-advaita',
};

// The current argument: its logical function, an explanation, and where it comes from.
export default function ArgumentPanel({ turn }) {
  const fn = FUNCTIONS[turn.func];
  const phase = PHASES.find((p) => p.id === turn.phase);
  const prov = PROVENANCE[turn.provenance];
  return (
    <section aria-live="polite" className="rounded-2xl border border-line bg-card px-5 py-4 backdrop-blur-md">
      <div className="grid gap-4 md:grid-cols-[1.25fr_1fr]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] tracking-[0.16em] text-ink-faint uppercase">
            <span>{phase.label}</span>
            <span>·</span>
            <span className="text-bronze">{turn.type}</span>
          </div>
          <h2 className="mt-1 font-display text-[22px] leading-tight font-semibold text-ink">
            <span lang="kn" className="kn mr-2 text-[0.8em] text-bronze">{fn.kn}</span>
            {turn.title}
          </h2>
          <p className="mt-1.5 text-[15px] leading-snug text-ink-soft">{turn.explain}</p>
          <div className="mt-2 flex flex-wrap items-start gap-2 text-[12.5px]">
            <span className={`shrink-0 rounded-full px-2 py-0.5 font-medium ${PROVENANCE_STYLE[turn.provenance]}`}>{prov.label}</span>
            <span className="text-ink-faint">{turn.caveat || prov.description}</span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="mb-1.5 text-[11px] tracking-[0.16em] text-ink-faint uppercase">Sources for this turn</div>
          <ul className="space-y-1.5">
            {turn.sources.map((id) => {
              const s = SOURCES[id];
              return (
                <li key={id}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-lg border border-line bg-card-strong/70 px-3 py-2 transition-colors hover:border-gold"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-[16px] font-semibold text-ink group-hover:text-bronze">{s.title}</span>
                      <ExternalIcon className="h-3.5 w-3.5 shrink-0 text-ink-faint group-hover:text-bronze" />
                    </div>
                    <div className="text-[12.5px] leading-snug text-ink-soft">{s.locator}</div>
                    <div className="text-[11.5px] text-ink-faint">
                      {s.kind === 'quotation' ? 'Quoted' : 'Paraphrased'} · {s.note}
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
