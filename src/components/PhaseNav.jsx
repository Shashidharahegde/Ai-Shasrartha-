import { PHASES } from '../data/structure.js';

export default function PhaseNav({ turns, currentPhase, onJump }) {
  const currentIdx = PHASES.findIndex((p) => p.id === currentPhase);
  return (
    <nav aria-label="Argument phases" className="scroll-warm -mx-1 overflow-x-auto px-1 pb-1">
      <ol className="relative flex min-w-max items-start justify-between gap-1">
        <span className="absolute top-[7px] right-6 left-6 h-px bg-line" aria-hidden />
        {PHASES.map((phase, i) => {
          const first = turns.findIndex((t) => t.phase === phase.id);
          const state = i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'todo';
          return (
            <li key={phase.id} className="relative">
              <button
                type="button"
                onClick={() => onJump(first)}
                title={`${phase.label}: ${phase.blurb}`}
                aria-current={state === 'current' ? 'step' : undefined}
                className="group flex w-[78px] flex-col items-center gap-1 rounded-lg px-1 pb-1 text-center"
              >
                <span
                  className={`h-[15px] w-[15px] rounded-full border-2 transition-all ${
                    state === 'current'
                      ? 'scale-110 border-bronze bg-bronze shadow-[0_0_0_4px_rgb(168_116_42/0.2)]'
                      : state === 'done'
                        ? 'border-gold bg-gold/60'
                        : 'border-line bg-paper group-hover:border-gold'
                  }`}
                />
                <span className={`kn text-[11px] leading-none ${state === 'current' ? 'text-bronze' : 'text-ink-faint'}`}>{phase.kn}</span>
                <span
                  className={`text-[12px] leading-tight ${
                    state === 'current' ? 'font-semibold text-ink' : 'text-ink-soft group-hover:text-ink'
                  }`}
                >
                  {phase.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
