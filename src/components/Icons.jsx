const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const icon = (paths) =>
  function Icon(props) {
    return <svg {...base} {...props}>{paths}</svg>;
  };

export const PlayIcon = (props) => (
  <svg {...base} {...props} fill="currentColor" stroke="none">
    <path d="M8 5.5v13a.8.8 0 0 0 1.2.7l10.4-6.5a.8.8 0 0 0 0-1.4L9.2 4.8A.8.8 0 0 0 8 5.5Z" />
  </svg>
);
export const PauseIcon = (props) => (
  <svg {...base} {...props} fill="currentColor" stroke="none">
    <rect x="6.5" y="5" width="3.6" height="14" rx="1" />
    <rect x="13.9" y="5" width="3.6" height="14" rx="1" />
  </svg>
);
export const PrevIcon = icon(<><path d="M18 6 10 12l8 6V6Z" /><path d="M6 6v12" /></>);
export const NextIcon = icon(<><path d="m6 6 8 6-8 6V6Z" /><path d="M18 6v12" /></>);
export const Back15Icon = (props) => (
  <svg {...base} {...props}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
    <path d="M4 3.5v3.7h3.7" />
    <text x="12.2" y="15.3" textAnchor="middle" fontSize="7" fontFamily="inherit" fill="currentColor" stroke="none" fontWeight="600">15</text>
  </svg>
);
export const Forward15Icon = (props) => (
  <svg {...base} {...props}>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
    <path d="M20 3.5v3.7h-3.7" />
    <text x="11.8" y="15.3" textAnchor="middle" fontSize="7" fontFamily="inherit" fill="currentColor" stroke="none" fontWeight="600">15</text>
  </svg>
);
export const SearchIcon = icon(<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>);
export const SunIcon = icon(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>);
export const MoonIcon = icon(<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />);
export const VoiceIcon = icon(<><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>);
export const CloseIcon = icon(<path d="M6 6l12 12M18 6 6 18" />);
export const ExternalIcon = icon(<><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>);
export const BookIcon = icon(<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" /></>);
export const InfoIcon = icon(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>);

// Lotus-mandala emblem used for the brand and the moderator.
export function Emblem({ className = '', ...props }) {
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.2" className={className} aria-hidden {...props}>
      <circle cx="32" cy="32" r="29" opacity="0.5" />
      <circle cx="32" cy="32" r="25" strokeDasharray="1.5 2.5" opacity="0.6" />
      {petals.map((deg) => (
        <path key={deg} transform={`rotate(${deg} 32 32)`} d="M32 8c5 6 5 13 0 18-5-5-5-12 0-18Z" />
      ))}
      {petals.map((deg) => (
        <path key={`s${deg}`} transform={`rotate(${deg + 22.5} 32 32)`} d="M32 13c3 4 3 8.5 0 12-3-3.5-3-8 0-12Z" opacity="0.7" />
      ))}
      <circle cx="32" cy="32" r="6" />
      <circle cx="32" cy="32" r="2" fill="currentColor" />
    </svg>
  );
}
