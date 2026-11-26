import type { SVGProps } from "react";

/**
 * Набор линейных иконок 24×24 в одном стиле. Свои SVG вместо библиотеки:
 * нужно меньше двадцати знаков, а сборка остаётся лёгкой.
 */
const paths = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5V5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2Z" />
      <path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H19" />
      <path d="M9 7h6" />
    </>
  ),
  puzzle: (
    <path d="M10 3.5a2 2 0 0 1 4 0V5h3a1 1 0 0 1 1 1v3h1.5a2 2 0 0 1 0 4H18v4a1 1 0 0 1-1 1h-3v-1.5a2 2 0 0 0-4 0V18H6a1 1 0 0 1-1-1v-4h1.5a2 2 0 0 0 0-4H5V6a1 1 0 0 1 1-1h4Z" />
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  flame: (
    <path d="M12 3c.5 3.5 4.5 5.5 4.5 10a4.5 4.5 0 0 1-9 0c0-2 1-3.5 2-4.5.3 1.6 1.2 2.6 2.3 3 .2-3.4-.8-5.8.2-8.5Z" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  chevronRight: <path d="m9 6 6 6-6 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  vibration: (
    <>
      <rect x="8" y="3" width="8" height="18" rx="2" />
      <path d="M4 8v8M20 8v8" />
    </>
  ),
  motion: (
    <>
      <path d="M4 12h3l2-5 4 10 2-5h5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  scale: (
    <>
      <path d="M12 3v18M7 21h10" />
      <path d="M5 7h14" />
      <path d="m5 7-3 7a3 3 0 0 0 6 0L5 7ZM19 7l-3 7a3 3 0 0 0 6 0l-3-7Z" />
    </>
  ),
  cards: (
    <>
      <rect x="3" y="6" width="13" height="15" rx="2" />
      <path d="M8 3h11a2 2 0 0 1 2 2v12" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5M9.5 2h5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  cloud: <path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5a4.25 4.25 0 0 1-.5 8.5H7Z" />,
  phone: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M11 18h2" />
    </>
  ),
  tag: (
    <>
      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  cross: <path d="M7 7l10 10M17 7 7 17" />,
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </>
  ),
  play: <path d="M8 5.5v13l10.5-6.5L8 5.5Z" />,
  stop: <rect x="7" y="7" width="10" height="10" rx="1.5" />,
  rewind: (
    <>
      <path d="M11 6.5v11L4 12l7-5.5Z" />
      <path d="M20 6.5v11L13 12l7-5.5Z" />
    </>
  ),
  heart: (
    <path d="M12 20s-7.5-4.6-9-9.3C2 7.4 4.3 4.5 7.4 4.5c1.9 0 3.6 1.1 4.6 2.7 1-1.6 2.7-2.7 4.6-2.7 3.1 0 5.4 2.9 4.4 6.2C19.5 15.4 12 20 12 20Z" />
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  list: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  shuffle: (
    <>
      <path d="M3 7h3.5c2.5 0 3.8 1.3 5.2 4.5S14.5 17 17 17h4M17.5 13.5 21 17l-3.5 3.5" />
      <path d="M3 17h3.5c1.4 0 2.4-.4 3.2-1.2M14.3 8.2c.8-.8 1.8-1.2 3.2-1.2H21M17.5 3.5 21 7l-3.5 3.5" />
    </>
  ),
  target2: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  duel: (
    <>
      <path d="M4 4l8.5 8.5M20 4l-8.5 8.5" />
      <path d="m4 14 3 3M20 14l-3 3M6.5 19.5 9 17M17.5 19.5 15 17" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4" />
    </>
  ),
} as const;

export type IconName = keyof typeof paths;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 24, strokeWidth = 2, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
