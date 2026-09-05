/**
 * Authored icons, one stroke weight, one geometry language. Drafting marks
 * rather than a downloaded set: every one of these is a shape a surveyor's
 * legend would carry.
 */

const base = {
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const DrawIcon = () => (
  <svg {...base} aria-hidden>
    <path d="M2.6 6.2 8 2.2l5.4 3.4-1.7 6.2H4.5z" />
    <circle cx="2.6" cy="6.2" r="1.25" fill="currentColor" stroke="none" />
    <circle cx="8" cy="2.2" r="1.25" fill="currentColor" stroke="none" />
    <circle cx="13.4" cy="5.6" r="1.25" fill="currentColor" stroke="none" />
  </svg>
);

export const ClearIcon = () => (
  <svg {...base} aria-hidden>
    <path d="M3 4h10M6.2 4V2.8h3.6V4M4.4 4l.6 9h6l.6-9" />
  </svg>
);

export const ShareIcon = () => (
  <svg {...base} aria-hidden>
    <path d="M8 10.4V2.6M5.2 5.2 8 2.4l2.8 2.8" />
    <path d="M3.2 9.2v3.6h9.6V9.2" />
  </svg>
);

export const CloseIcon = () => (
  <svg {...base} aria-hidden>
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);

export const AlertIcon = () => (
  <svg {...base} aria-hidden>
    <path d="M8 2.6 14.4 13.4H1.6z" />
    <path d="M8 6.6v3M8 11.4v.6" />
  </svg>
);
