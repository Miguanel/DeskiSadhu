/** Minimalny zestaw ikon (stroke, 24×24) – bez zewnętrznych zależności. */
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
}

const paths = {
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  rotate: <><path d="M20 12a8 8 0 1 1-2.34-5.66" /><path d="M20 4v5h-5" /></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  person: <><circle cx="12" cy="4.5" r="2" /><path d="M9 22v-7H7.5V10a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v5H15v7" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
  share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  home: <><path d="M3 20h18" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /><path d="M10 20v-3.5a2 2 0 0 1 4 0V20" /></>,
  leaf: <><path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15" /><path d="M5 19l7-7" /></>,
  spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" /></>,
  send: <><path d="M21 3L10 14" /><path d="M21 3l-7 18-4-7-7-4 18-7z" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  brush: <><path d="M14.5 4.5l5 5L10 19H5v-5z" /><path d="M12 7l5 5" /></>,
  undo: <><path d="M9 14L4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></>,
  redo: <><path d="M15 14l5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  plan: <><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6L6 18" opacity=".55" /></>,
  trash: <><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>,
  rotLeft: <><path d="M4 12a8 8 0 1 0 2.34-5.66" /><path d="M4 4v5h5" /></>,
  rotRight: <><path d="M20 12a8 8 0 1 1-2.34-5.66" /><path d="M20 4v5h-5" /></>,
  print: <><path d="M7 9V3h10v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M7 14h10v7H7z" /></>,
  upload: <><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></>,
  minus: <path d="M5 12h14" />,
  cart: <><path d="M3 4h2l2.4 11h10.2L20 7H6.2" /><circle cx="9" cy="19.5" r="1.4" /><circle cx="17" cy="19.5" r="1.4" /></>,
  foot: <><path d="M9 21c-2.5 0-3.5-2.5-3-5s1-4 .5-7S7 3 9.5 3 12 6 11.5 9 12 13 11.5 16 11.5 21 9 21z" /><circle cx="15" cy="4.5" r="1" /><circle cx="17.2" cy="6.4" r="0.9" /><circle cx="18.6" cy="9" r="0.8" /></>,
  boards: <><rect x="4" y="3" width="7" height="18" rx="1.5" /><rect x="13" y="3" width="7" height="18" rx="1.5" /></>,
  nails: <><rect x="3" y="14" width="18" height="5" rx="1" /><path d="M6 14V9M10 14V9M14 14V9M18 14V9" /></>,
  flip: <><path d="M4 7h13l-3-3M20 17H7l3 3" /></>,
  stack: <><rect x="3" y="4" width="18" height="5" rx="1" /><rect x="3" y="15" width="18" height="5" rx="1" /><path d="M7 9v2M12 9v2M17 9v2M7 15v-2M12 15v-2M17 15v-2" /></>,
  stand: <><rect x="5" y="3" width="6" height="18" rx="1.2" /><rect x="13" y="5" width="6" height="16" rx="1.2" /><path d="M2 21h20" /></>,
  move: <><path d="M12 3v18M3 12h18" /><path d="M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3" /></>,
}

export default function Icon({ name, size = 20, className = '' }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      {paths[name]}
    </svg>
  )
}
