import type { ReactNode } from 'react'

function Man() {
  return (
    <svg viewBox="0 0 80 140" className="intro-man" aria-hidden>
      <g className="bob">
        <g className="leg-a"><rect x="30" y="80" width="9" height="52" rx="4" fill="#2b2420" /><rect x="28" y="128" width="16" height="7" rx="3" fill="#15110e" /></g>
        <g className="leg-b"><rect x="42" y="80" width="9" height="52" rx="4" fill="#2b2420" /><rect x="40" y="128" width="16" height="7" rx="3" fill="#15110e" /></g>
        <g className="arm-back"><rect x="26" y="36" width="8" height="40" rx="4" fill="#3a302a" /></g>
        <rect x="26" y="30" width="28" height="54" rx="9" fill="#3a302a" />
        <path d="M40 32 l4 6 -4 22 -4 -22z" fill="var(--primary)" />
        <circle cx="40" cy="16" r="12" fill="#a9714f" />
        <path d="M28 14 a12 12 0 0 1 24 0 c-6 -5 -16 -5 -24 0z" fill="#15110e" />
        <rect x="50" y="36" width="8" height="46" rx="4" fill="#3a302a" />
        <g className="hand-case">
          <rect x="44" y="84" width="34" height="24" rx="4" fill="var(--primary)" />
          <path d="M53 84 v-5 h16 v5" fill="none" stroke="#15110e" strokeWidth="2.5" />
        </g>
      </g>
    </svg>
  )
}

function Briefcase() {
  return (
    <svg viewBox="0 0 80 60" className="intro-case" aria-hidden>
      <rect x="2" y="22" width="76" height="36" rx="5" fill="var(--primary)" />
      <rect x="2" y="22" width="76" height="9" fill="#15110e" opacity="0.25" />
      <rect x="35" y="30" width="10" height="8" rx="2" fill="var(--warning)" />
      <g className="lid">
        <rect x="2" y="8" width="76" height="14" rx="4" fill="var(--primary)" />
        <path d="M30 8 v-5 h20 v5" fill="none" stroke="#15110e" strokeWidth="3" />
      </g>
    </svg>
  )
}

export default function AuthIntro({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div className="intro-scene" aria-hidden>
        <Man />
        <Briefcase />
      </div>
      <div className="intro-form">{children}</div>
    </div>
  )
}
