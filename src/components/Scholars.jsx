import { PORTRAITS } from './common.jsx';

// The two scholars sit facing each other across the subtitles: Śaṅkara on the
// left looks right, Madhva on the right looks left. The speaker is lit with a
// soft glow; the listener settles back slightly.
const SIZE = {
  advaita: { height: '70vh', width: '30vw' },
  dvaita: { height: '61vh', width: '30vw' },
};

function Figure({ speaker, current, live, side, className = '', style }) {
  const active = current === speaker;
  const other = current !== speaker && current !== 'moderator';
  return (
    <div className={`pointer-events-none ${className}`} style={style} aria-hidden>
      <div
        className={`absolute inset-x-[10%] top-[4%] bottom-[18%] rounded-full blur-3xl transition-opacity duration-700 ${
          active ? (live ? 'halo opacity-60' : 'opacity-35') : 'opacity-0'
        }`}
        style={{ background: 'radial-gradient(closest-side, rgb(255 196 110 / 0.9), rgb(255 170 80 / 0.25), transparent)' }}
      />
      <img
        src={PORTRAITS[speaker].src}
        alt=""
        draggable="false"
        className={`relative h-full w-auto max-w-full object-contain object-bottom transition-all duration-700 ease-out ${
          active ? 'scale-[1.015] opacity-100 saturate-100' : other ? 'opacity-80 saturate-75' : 'opacity-95'
        }`}
        style={{
          filter: active ? 'drop-shadow(0 0 26px rgb(255 190 110 / 0.5))' : 'drop-shadow(0 14px 22px rgb(60 35 10 / 0.25))',
          transformOrigin: side === 'left' ? 'bottom left' : 'bottom right',
        }}
      />
    </div>
  );
}

// Full-size figures flanking the subtitles (wide screens).
export function ScholarPortrait({ speaker, side, current, live }) {
  return (
    <Figure
      speaker={speaker}
      side={side}
      current={current}
      live={live}
      className={`fixed bottom-[7vh] z-10 hidden lg:block ${side === 'left' ? 'left-0' : 'right-0'}`}
      style={{ height: SIZE[speaker].height, maxWidth: SIZE[speaker].width }}
    />
  );
}

// Narrow screens: the same two figures, facing each other above the subtitles.
export function Stage({ current, live }) {
  return (
    <div className="flex items-end justify-between px-2 lg:hidden">
      <Figure speaker="advaita" side="left" current={current} live={live} className="relative h-40 sm:h-52" />
      <Figure speaker="dvaita" side="right" current={current} live={live} className="relative h-36 sm:h-48" />
    </div>
  );
}
