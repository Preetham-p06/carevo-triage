// Consistent SVG icon set (Lucide-style, 1.8px stroke) — no emoji icons.
import React from 'react'

type IconProps = React.SVGProps<SVGSVGElement> & { className?: string }

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24' }

export const IconMic = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8" />
  </svg>
)

export const IconSend = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)

export const IconBack = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true"><path d="M15 19l-7-7 7-7" /></svg>
)

export const IconArrowRight = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)

export const IconAlert = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01" />
  </svg>
)

export const IconHospital = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <path d="M3 21V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14M1 21h22M12 8v6M9 11h6" />
  </svg>
)

export const IconZap = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" /></svg>
)

export const IconStethoscope = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <path d="M4.5 3v6a4.5 4.5 0 0 0 9 0V3M7 3H4.5M13.5 3H11" />
    <path d="M9 13.5V16a5 5 0 0 0 10 0v-1.5" />
    <circle cx="19" cy="11" r="2.5" />
  </svg>
)

export const IconVideo = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <rect x="2" y="6" width="14" height="12" rx="2" /><path d="m22 8-6 4 6 4V8z" />
  </svg>
)

export const IconHome = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5z" />
  </svg>
)

export const IconClipboard = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 12h6M9 16h4" />
  </svg>
)

export const IconPill = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7zM8.5 8.5l7 7" />
  </svg>
)

export const IconBell = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
)

export const IconCalendar = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
)

export const IconUser = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
  </svg>
)

export const IconChat = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

export const IconShield = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

export const IconLock = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

export const IconClock = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
  </svg>
)

export const IconFileText = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6M9 13h6M9 17h6" />
  </svg>
)

export const IconCheck = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
)

export const IconPhone = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

export const IconHeart = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" />
  </svg>
)

export const IconTrendUp = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <path d="M22 7 13.5 15.5 8.5 10.5 2 17M16 7h6v6" />
  </svg>
)

export const IconSparkle = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
  </svg>
)

export const IconDollar = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

export const IconThumbsUp = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88z" />
  </svg>
)

export const IconThumbsDown = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <path d="M17 14V2M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88z" />
  </svg>
)

export const IconHelpCircle = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
  </svg>
)

export const IconTrash = ({ className = 'w-5 h-5', ...rest }: IconProps) => (
  <svg className={className} {...S} aria-hidden="true">
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
  </svg>
)

/** Care-level icon by key */
export function CareLevelIcon({ level, className = 'w-6 h-6' }: { level: string; className?: string }) {
  switch (level) {
    case 'emergency': return <IconAlert className={className} />
    case 'er': return <IconHospital className={className} />
    case 'urgent_care': return <IconZap className={className} />
    case 'primary_care': return <IconStethoscope className={className} />
    case 'telehealth': return <IconVideo className={className} />
    case 'home_care': return <IconHome className={className} />
    default: return <IconHelpCircle className={className} />
  }
}
