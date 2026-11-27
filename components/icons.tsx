// One icon family: 24px grid, 2px rounded strokes, matching the weight of bold UI text.
type P = { className?: string };
const base = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const IconHome = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v9.5h13V10" />
    <path d="M10 19.5v-5h4v5" />
  </svg>
);
export const IconLearn = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z" />
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z" />
  </svg>
);
export const IconPlay = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <rect x="2.5" y="7" width="19" height="11" rx="5.5" />
    <path d="M7.5 10.5v4M5.5 12.5h4" />
    <circle cx="15.5" cy="11.5" r="0.6" fill="currentColor" />
    <circle cx="17.5" cy="13.5" r="0.6" fill="currentColor" />
  </svg>
);
export const IconCompanies = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M4 20.5V5.5L12 3v17.5" />
    <path d="M12 9.5l8 2.5v8.5" />
    <path d="M2.5 20.5h19M7.5 8v.01M7.5 12v.01M7.5 16v.01M16 14v.01M16 17.5v.01" />
  </svg>
);
export const IconUpload = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
    <path d="M4 14.5v4A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-4" />
  </svg>
);
export const IconFlame = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="M12 21c3.6 0 6-2.4 6-5.8 0-3.7-3-5.7-3.6-9.2-2 1.2-3.2 3.3-3.1 5.4-1.2-.8-1.9-2-2-3.4C7.4 9.6 6 12 6 15.2 6 18.6 8.4 21 12 21z" />
  </svg>
);
export const IconLock = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </svg>
);
export const IconCheck = ({ className }: P) => (
  <svg {...base} className={className} aria-hidden>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
