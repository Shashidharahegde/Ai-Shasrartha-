import shankara from '../../assets/Shankara.png';
import madhva from '../../assets/Madhva.png';
import { Emblem } from './Icons.jsx';

export const PORTRAITS = {
  advaita: { src: shankara, w: 1095, h: 1437, cx: 612, cy: 228, side: 390 },
  dvaita: { src: madhva, w: 887, h: 887, cx: 470, cy: 178, side: 300 },
};

export const SPEAKER_TEXT = {
  advaita: 'text-advaita',
  dvaita: 'text-dvaita',
  moderator: 'text-moderator',
};

export const SPEAKER_BORDER = {
  advaita: 'border-advaita',
  dvaita: 'border-dvaita',
  moderator: 'border-moderator',
};

// Circular face crop from the full portrait image.
export function Avatar({ speaker, size = 56, active = false }) {
  const ring = active ? 'ring-2 ring-gold ring-offset-2 ring-offset-paper' : 'ring-1 ring-line';
  if (speaker === 'moderator') {
    return (
      <div
        className={`grid shrink-0 place-items-center rounded-full bg-paper-2 text-moderator ${ring}`}
        style={{ width: size, height: size }}
      >
        <Emblem style={{ width: size * 0.7, height: size * 0.7 }} />
      </div>
    );
  }
  const p = PORTRAITS[speaker];
  const k = size / p.side;
  return (
    <div
      role="img"
      aria-label={speaker === 'advaita' ? 'Advaita scholar' : 'Dvaita scholar'}
      className={`shrink-0 rounded-full bg-paper-2 bg-no-repeat ${ring}`}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${p.src})`,
        backgroundSize: `${p.w * k}px ${p.h * k}px`,
        backgroundPosition: `${size / 2 - p.cx * k}px ${size / 2 - p.cy * k}px`,
      }}
    />
  );
}

const KANNADA_RUN = /([ಀ-೿]+(?:[\s‌‍]+[ಀ-೿]+)*)/;

// Renders English text with Kannada-script technical terms set in their own face.
export function RichText({ text, termClass = 'text-gold' }) {
  return text.split(KANNADA_RUN).map((part, i) =>
    i % 2 ? (
      <span key={i} lang="kn" className={`kn font-medium ${termClass}`}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export function Modal({ title, kicker, onClose, children, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={`flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl border border-line bg-card-strong shadow-2xl ${wide ? 'max-w-4xl' : 'max-w-xl'}`}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div>
            {kicker && <div className="text-[11px] tracking-[0.2em] text-ink-faint uppercase">{kicker}</div>}
            <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-ink-soft hover:bg-paper-2 hover:text-ink"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="scroll-warm overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
