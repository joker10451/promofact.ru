import type { ReactNode } from "react";

const base = {
  width: 28,
  height: 28,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconCalendar(): ReactNode {
  return (
    <svg {...base} aria-hidden="true">
      <rect x="3" y="4" width="18" height="17" rx="2.5" />
      <path d="M3 9h18M8 2v4M16 2v4" />
      <path d="M8.5 14h.01M12 14h.01M15.5 14h.01M8.5 17h.01M12 17h.01M15.5 17h.01" />
    </svg>
  );
}

export function IconCard(): ReactNode {
  return (
    <svg {...base} aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19M6 15h4" />
      <circle cx="17" cy="15" r="1.3" />
    </svg>
  );
}

export function IconGift(): ReactNode {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M4 10h16v3H4zM5 13v7h14v-7M12 10v10" />
      <path d="M12 10S10 4 7.5 5.5 9.5 10 12 10zM12 10s2-6 4.5-4.5S14.5 10 12 10z" />
    </svg>
  );
}

export function IconZero(): ReactNode {
  return (
    <svg {...base} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9.5a3 3 0 1 1 4.2 2.7c-.9.4-1.2.9-1.2 1.8M12 16.5h.01" />
    </svg>
  );
}

export function IconShield(): ReactNode {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.4-3 7.3-7 9-4-1.7-7-4.6-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function IconLicense(): ReactNode {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16l-6-2-6 2z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  );
}

export function IconBolt(): ReactNode {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
    </svg>
  );
}
