import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/*
 * Intro for the auth page: a man walks in carrying a briefcase, crouches and
 * sets it down where the form belongs, the case opens and the form grows out
 * of it. He then steps aside and waits next to the form (or walks off screen
 * when there is no room). Everything is driven from one requestAnimationFrame
 * loop so the walk, crouch and hand-offs blend smoothly into each other.
 */

// ---- Character geometry (SVG user units, figure faces right) ----
const SCALE = 0.95 // css px per SVG unit
const W = 120
const H = 220
const HIP = { x: 60, y: 124 }
const KNEE_Y = 166
const ANKLE_Y = 204
const THIGH = KNEE_Y - HIP.y
const SHIN = ANKLE_Y - KNEE_Y
const SHOULDER = { x: 60, y: 86 }
const ELBOW_Y = 116
const NECK = { x: 62, y: 70 }
const CYCLE_PX = 128 * SCALE // ground covered by one full stride (two steps)
const WALK_SPEED = 210 // px per second at full pace
const GROUND_BELOW_FORM_CENTER = 120

// The briefcase occupies this box in the hand; the dropped case reuses it.
const CASE_BOX = { x: 42, y: 140, w: 38, h: 38 }

interface Pose {
  lean: number
  head: number
  thighA: number
  shinA: number
  thighB: number
  shinB: number
  armF: number
  foreF: number
  armB: number
  foreB: number
}

const STAND: Pose = { lean: 0, head: 0, thighA: 0, shinA: 4, thighB: 0, shinB: 4, armF: 2, foreF: -4, armB: -2, foreB: -6 }
// Back against the form: he turns around (faces away from it), shoulders and back resting on its edge,
// feet a little out in front, arms folded.
const LEAN: Pose = { lean: -8, head: 3, thighA: -13, shinA: 9, thighB: -7, shinB: 6, armF: -26, foreF: -104, armB: 10, foreB: -76 }
const BACK_TO_FORM = 25 // px from the middle of his body to the form's left edge when leaning
const CROUCH: Pose = { lean: 24, head: 14, thighA: -64, shinA: 114, thighB: -56, shinB: 104, armF: -46, foreF: -12, armB: -20, foreB: -30 }

const rad = (d: number) => (d * Math.PI) / 180
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t))
const easeOutBack = (t: number) => {
  const c = 1.4
  const u = clamp01(t) - 1
  return 1 + (c + 1) * u * u * u + c * u * u
}
const mix = (a: Pose, b: Pose, t: number): Pose => {
  const out = {} as Pose
  for (const k of Object.keys(a) as (keyof Pose)[]) out[k] = lerp(a[k], b[k], t)
  return out
}

/** Walk pose at stride phase p (0..1) with amplitude m (0 = standing still). */
function walkPose(p: number, m: number): Pose {
  const leg = (q: number) => {
    const a = 2 * Math.PI * q
    const thigh = -24 * Math.sin(a)
    // Knee bends most while the leg swings forward.
    const shin = 6 + 34 * Math.pow(Math.max(0, Math.cos(a)), 1.6)
    return { thigh, shin }
  }
  const A = leg(p)
  const B = leg(p + 0.5)
  return {
    lean: 4 * m,
    head: -2 * m,
    thighA: A.thigh * m,
    shinA: lerp(STAND.shinA, A.shin, m),
    thighB: B.thigh * m,
    shinB: lerp(STAND.shinB, B.shin, m),
    armF: lerp(STAND.armF, B.thigh * 0.25, m), // carrying the case: small swing
    foreF: STAND.foreF,
    armB: lerp(STAND.armB, A.thigh * 0.9, m),
    foreB: lerp(STAND.foreB, -10 - 12 * Math.max(0, -Math.sin(2 * Math.PI * p)), m),
  }
}

/** Lift the body so the lower foot always touches the ground. */
function bodyDrop(pose: Pose): number {
  const foot = (t: number, s: number) => THIGH * Math.cos(rad(t)) + SHIN * Math.cos(rad(t + s))
  return THIGH + SHIN - Math.max(foot(pose.thighA, pose.shinA), foot(pose.thighB, pose.shinB))
}

/** Constant pace that eases to a stop over the last quarter. Returns [progress, speed 0..1]. */
function cruiseThenStop(u: number): [number, number] {
  const r = 0.72
  const c = 1 / (r + (1 - r) / 2)
  u = clamp01(u)
  if (u < r) return [c * u, 1]
  const d = u - r
  return [c * r + c * (d - (d * d) / (2 * (1 - r))), 1 - d / (1 - r)]
}

/** Start from rest, walk, ease to a stop. Returns [progress, speed 0..1]. */
function startAndStop(u: number): [number, number] {
  u = clamp01(u)
  return [easeInOut(u), Math.sin(Math.PI * u)]
}

// ---- Drawing ----
function Defs() {
  return (
    <defs>
      <linearGradient id="ml-skin" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffd9b8" />
        <stop offset="1" stopColor="#e7a77c" />
      </linearGradient>
      <linearGradient id="ml-hair" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffd77a" />
        <stop offset="0.6" stopColor="#f0b443" />
        <stop offset="1" stopColor="#c98a24" />
      </linearGradient>
      <linearGradient id="ml-beard" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e9ac45" />
        <stop offset="1" stopColor="#c1832a" />
      </linearGradient>
      <linearGradient id="ml-blazer" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#9f9c97" />
        <stop offset="0.55" stopColor="#c9c6c0" />
        <stop offset="1" stopColor="#b3b0aa" />
      </linearGradient>
      <linearGradient id="ml-blazer-dark" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#85827d" />
        <stop offset="1" stopColor="#a19e98" />
      </linearGradient>
      <linearGradient id="ml-pants" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#14141a" />
        <stop offset="0.6" stopColor="#2c2c35" />
        <stop offset="1" stopColor="#1b1b22" />
      </linearGradient>
      <linearGradient id="ml-pants-dark" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#0c0c10" />
        <stop offset="1" stopColor="#1c1c23" />
      </linearGradient>
      <linearGradient id="ml-shoe" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#dcdde3" />
      </linearGradient>
      <linearGradient id="ml-leather" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#a8643a" />
        <stop offset="0.6" stopColor="#87472a" />
        <stop offset="1" stopColor="#5f2f1b" />
      </linearGradient>
      <radialGradient id="ml-glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff7d6" stopOpacity="1" />
        <stop offset="1" stopColor="#fff7d6" stopOpacity="0" />
      </radialGradient>
    </defs>
  )
}

function Shoe() {
  return (
    <g>
      <path d="M50 198 h18 q14 0 16 10 v3 q0 3 -3 3 h-31 q-3 0 -3 -3z" fill="url(#ml-shoe)" />
      <rect x="47" y="210" width="38" height="4" rx="2" fill="#c4c6ce" />
      <path d="M62 201 l4 4 M66 200 l4 4" stroke="#b9bcc6" strokeWidth="1.2" />
    </g>
  )
}

function Leg({ side }: { side: 'A' | 'B' }) {
  const dark = side === 'B'
  const fill = dark ? 'url(#ml-pants-dark)' : 'url(#ml-pants)'
  return (
    <g data-part={'thigh' + side}>
      <rect x="51" y="118" width="18" height="52" rx="9" fill={fill} />
      <g data-part={'shin' + side}>
        <rect x="52.5" y="160" width="15" height="46" rx="7" fill={fill} />
        <g data-part={'foot' + side}><Shoe /></g>
      </g>
    </g>
  )
}

function CaseShape({ ground }: { ground?: boolean }) {
  return (
    <g>
      {ground && <ellipse data-part="glow" cx="61" cy="156" rx="34" ry="22" fill="url(#ml-glow)" opacity="0" />}
      <rect x="44" y="153" width="34" height="24" rx="4" fill="url(#ml-leather)" />
      <rect x="44" y="153" width="34" height="3" fill="#000" opacity="0.18" />
      <g data-part={ground ? 'lid' : undefined}>
        <rect x="43" y="148" width="36" height="8" rx="3" fill="url(#ml-leather)" />
        <path d="M54 148 q0 -6 7 -6 q7 0 7 6" fill="none" stroke="#4a2414" strokeWidth="2.6" strokeLinecap="round" />
        <rect x="58.5" y="153" width="5" height="5" rx="1" fill="#e9c069" />
      </g>
      <path d="M46 170 h30" stroke="#000" strokeOpacity="0.12" strokeWidth="1" />
    </g>
  )
}

function Man() {
  return (
    <svg data-part="man" width={W * SCALE} height={H * SCALE} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <Defs />
      <ellipse cx="62" cy="215" rx="30" ry="4" fill="#000" opacity="0.12" />
      <g data-part="body">
        {/* far side */}
        <g data-part="upperB">
          <g data-part="armB">
            <rect x="53" y="82" width="14" height="38" rx="7" fill="url(#ml-blazer-dark)" />
            <g data-part="foreB">
              <rect x="54" y="112" width="12" height="32" rx="6" fill="url(#ml-blazer-dark)" />
              <circle cx="60" cy="146" r="6.5" fill="#e3a074" />
            </g>
          </g>
        </g>
        <Leg side="B" />
        <Leg side="A" />
        <g data-part="upperF">
          {/* torso */}
          <rect x="55" y="62" width="13" height="16" rx="5" fill="#e9ad84" />
          <path d="M38 86 q0 -12 14 -14 h18 q14 2 14 14 v42 q0 8 -8 8 h-30 q-8 0 -8 -8z" fill="url(#ml-blazer)" />
          <path d="M66 72 l12 2 l-6 30 z" fill="#fbfbfb" />
          <path d="M64 73 l6 22 l-4 6 l-4 -26z M76 75 l-4 22 l4 4 l6 -20z" fill="#a8a59f" />
          <circle cx="73" cy="112" r="1.6" fill="#6f6c67" />
          <circle cx="73" cy="122" r="1.6" fill="#6f6c67" />
          <path d="M42 126 h40" stroke="#000" strokeOpacity="0.08" strokeWidth="2" />
          {/* head */}
          <g data-part="head">
            <ellipse cx="42" cy="44" rx="5" ry="7" fill="#eab08c" />
            <ellipse cx="63" cy="40" rx="24" ry="27" fill="url(#ml-skin)" />
            <path d="M41 40 q2 26 20 30 q18 2 25 -14 q2 -8 1 -14 q-6 10 -14 10 q-12 0 -16 -6 q-8 2 -16 -6z" fill="url(#ml-beard)" />
            <path d="M70 58 q5 2 9 0" stroke="#9c5f2a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M39 32 q-2 -24 22 -28 q14 -4 26 6 q6 6 4 14 q-6 -6 -14 -6 q-6 8 -18 6 q-10 -2 -14 8 q-4 2 -6 0z" fill="url(#ml-hair)" />
            <path d="M58 6 q14 -8 30 4 q-10 -2 -18 2z" fill="#ffe39b" />
            <ellipse cx="70" cy="40" rx="2.6" ry="3.2" fill="#2a1d14" />
            <ellipse cx="81" cy="40" rx="2.4" ry="3" fill="#2a1d14" />
            <circle cx="70.8" cy="39" r="0.8" fill="#fff" />
            <circle cx="81.7" cy="39" r="0.8" fill="#fff" />
            <path d="M65 32 q5 -3 9 0 M78 32 q4 -2 7 0" stroke="#c98a24" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d="M85 44 q4 5 0 8" stroke="#d48d63" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
          {/* near arm with the briefcase */}
          <g data-part="armF">
            <rect x="53" y="82" width="14" height="38" rx="7" fill="url(#ml-blazer)" />
            <g data-part="foreF">
              <rect x="54" y="112" width="12" height="32" rx="6" fill="url(#ml-blazer)" />
              <rect x="54.5" y="138" width="11" height="4" rx="2" fill="#fbfbfb" />
              <circle cx="60" cy="146" r="6.5" fill="url(#ml-skin)" />
              <g data-part="handCase">
                <CaseShape />
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  )
}

function useReducedMotion() {
  const [reduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  return reduced
}

export default function AuthIntro({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  const [manVisible, setManVisible] = useState(!reduced)
  const [skippable, setSkippable] = useState(!reduced)
  const skipRef = useRef<(() => void) | null>(null)

  const wrapRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const caseRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (reduced) return
    const wrap = wrapRef.current
    const form = formRef.current
    const scene = sceneRef.current
    if (!wrap || !form || !scene) return
    const part = (name: string) => scene.querySelector<SVGGraphicsElement>(`[data-part="${name}"]`)
    const r = {
      man: part('man'), body: part('body'), upperB: part('upperB'), upperF: part('upperF'), head: part('head'),
      thighA: part('thighA'), shinA: part('shinA'), footA: part('footA'),
      thighB: part('thighB'), shinB: part('shinB'), footB: part('footB'),
      armF: part('armF'), foreF: part('foreF'), armB: part('armB'), foreB: part('foreB'),
      handCase: part('handCase'), lid: part('lid'), glow: part('glow'),
    }

    // ---- Layout, measured once at start ----
    const box = wrap.getBoundingClientRect()
    const centerX = box.left + box.width / 2
    const halfForm = box.width / 2
    const groundY = box.height / 2 + GROUND_BELOW_FORM_CENTER
    const manHalf = (W * SCALE) / 2
    const startX = -centerX - manHalf - 20
    // On wide layouts there is room to his spot left of the form: he walks there,
    // sets the case down and stays. Otherwise he drops it mid-form and walks off.
    const staysBeside = box.left - 2 * manHalf - 16 >= 0
    const stopX = staysBeside ? -(halfForm + manHalf + 10) : -48
    const endX = window.innerWidth - centerX + manHalf + 20
    const leanX = -(halfForm + BACK_TO_FORM)

    // ---- Timeline (seconds) ----
    const walkIn = Math.min(4.4, Math.max(3, (stopX - startX) / WALK_SPEED))
    const T = {
      crouch: walkIn,
      down: walkIn + 1.0,
      release: walkIn + 1.0,
      rise: walkIn + 1.45,
      up: walkIn + 2.35,
      lid: walkIn + 1.3,
      formStart: walkIn + 1.75,
      formEnd: walkIn + 3.05,
      leave: staysBeside ? Infinity : walkIn + 2.55,
      turn: walkIn + 2.35 + 1.3, // after standing up and shuffling in
    }
    const leaveDur = Math.max(1.4, (endX - stopX) / (WALK_SPEED * 0.8))
    const done = staysBeside ? T.turn + 2 : T.leave + leaveDur
    let skipped = false
    skipRef.current = () => { skipped = true }

    form.style.visibility = 'hidden'
    form.style.pointerEvents = 'none'
    const caseEl = caseRef.current
    if (caseEl) caseEl.style.opacity = '0'

    let caseFrom: { x: number; y: number } | null = null
    let caseCenter = { x: 0, y: groundY }
    let raf = 0
    let t0 = 0

    const setRot = (el: Element | null, a: number, cx: number, cy: number) => {
      el?.setAttribute('transform', `rotate(${a.toFixed(2)} ${cx} ${cy})`)
    }

    const frame = (now: number) => {
      if (!t0) t0 = now
      const t = skipped ? done + 1 : (now - t0) / 1000

      // Horizontal position and walking amplitude.
      let x: number
      let m: number
      if (t < T.crouch) {
        const [k, v] = cruiseThenStop(t / walkIn)
        x = lerp(startX, stopX, k)
        m = v
      } else if (t < T.leave) {
        // After standing he shuffles up to the form (only when he stays beside it).
        const k = staysBeside ? easeInOut((t - T.up) / 1.2) : 0
        x = lerp(stopX, leanX, k)
        m = 0.3 * Math.sin(Math.PI * k)
      } else {
        const [k, v] = startAndStop((t - T.leave) / leaveDur)
        x = lerp(stopX, endX, k)
        m = v
      }
      let pose = walkPose((x - startX) / CYCLE_PX, m)

      // Crouch down, then stand back up.
      const down = easeInOut((t - T.crouch) / (T.down - T.crouch))
      const up = easeInOut((t - T.rise) / (T.up - T.rise))
      const crouchAmt = t < T.rise ? down : 1 - up
      if (crouchAmt > 0) pose = mix(pose, CROUCH, crouchAmt)

      // Turn around, settle back against the form, then breathe gently.
      let facing = 1
      if (staysBeside && t > T.turn) {
        facing = Math.cos(Math.PI * easeInOut((t - T.turn) / 0.5))
        const lean = easeInOut((t - T.turn - 0.3) / 1.2)
        pose = mix(pose, LEAN, lean)
        const s = Math.sin((t - T.turn) * 1.6) * lean
        pose = { ...pose, lean: pose.lean + 0.7 * s, head: pose.head - 1.5 * s }
      }

      const man = r.man as SVGSVGElement | null
      if (man) {
        const drop = bodyDrop(pose)
        man.style.transform = `translate(${(x - manHalf).toFixed(1)}px, ${(groundY - H * SCALE).toFixed(1)}px) scaleX(${facing.toFixed(3)})`
        r.body?.setAttribute('transform', `translate(0 ${drop.toFixed(2)})`)
        setRot(r.upperB, pose.lean, HIP.x, HIP.y)
        setRot(r.upperF, pose.lean, HIP.x, HIP.y)
        setRot(r.head, pose.head, NECK.x, NECK.y)
        setRot(r.thighA, pose.thighA, HIP.x, HIP.y)
        setRot(r.shinA, pose.shinA, HIP.x, KNEE_Y)
        setRot(r.footA, -(pose.thighA + pose.shinA), HIP.x, ANKLE_Y)
        setRot(r.thighB, pose.thighB, HIP.x, HIP.y)
        setRot(r.shinB, pose.shinB, HIP.x, KNEE_Y)
        setRot(r.footB, -(pose.thighB + pose.shinB), HIP.x, ANKLE_Y)
        setRot(r.armF, pose.armF, SHOULDER.x, SHOULDER.y)
        setRot(r.foreF, pose.foreF, SHOULDER.x, ELBOW_Y)
        setRot(r.armB, pose.armB, SHOULDER.x, SHOULDER.y)
        setRot(r.foreB, pose.foreB, SHOULDER.x, ELBOW_Y)
      }

      // Hand the case over from his hand to the ground.
      if (t >= T.release && !caseFrom && r.handCase && caseEl) {
        const origin = scene.getBoundingClientRect()
        const hc = r.handCase.getBoundingClientRect()
        caseFrom = { x: hc.left - origin.left, y: hc.top - origin.top }
        r.handCase.style.opacity = '0'
        caseEl.style.opacity = '1'
      }
      if (caseFrom && caseEl) {
        const restY = groundY - CASE_BOX.h * SCALE
        const fall = clamp01((t - T.release) / 0.28)
        const bounce = t - T.release > 0.28 ? Math.sin(clamp01((t - T.release - 0.28) / 0.22) * Math.PI) * 3 : 0
        const y = lerp(caseFrom.y, restY, fall * fall) - bounce
        caseEl.style.transform = `translate(${caseFrom.x.toFixed(1)}px, ${y.toFixed(1)}px)`
        caseCenter = { x: caseFrom.x + (CASE_BOX.w * SCALE) / 2, y: restY + (CASE_BOX.h * SCALE) / 2 }

        const lid = easeInOut((t - T.lid) / 0.5)
        r.lid?.setAttribute('transform', `rotate(${(-115 * lid).toFixed(2)} 44 154)`)
        r.glow?.setAttribute('opacity', String(lid * (1 - clamp01((t - T.formEnd + 0.4) / 0.6))))
        const fade = clamp01((t - T.formEnd + 0.5) / 0.6)
        caseEl.style.opacity = String(1 - fade)
      }

      // The form grows out of the open case.
      if (t >= T.formStart) {
        const k = (t - T.formStart) / (T.formEnd - T.formStart)
        const s = easeOutBack(k)
        const pos = easeInOut(k)
        const dx = caseCenter.x * (1 - pos)
        const dy = (caseCenter.y - box.height / 2) * (1 - pos)
        form.style.visibility = 'visible'
        form.style.opacity = String(clamp01(k * 2.2))
        form.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${Math.max(0.04, s).toFixed(4)})`
        if (k >= 1) {
          form.style.transform = ''
          form.style.opacity = ''
          form.style.pointerEvents = ''
        }
      }

      if (!staysBeside && t > done + 0.1) {
        setManVisible(false)
        setSkippable(false)
        return
      }
      if (skipped || (staysBeside && t > done)) {
        if (caseEl) caseEl.style.opacity = '0'
        setSkippable(false)
        if (skipped) return
      }
      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => {
      skipRef.current = null
      cancelAnimationFrame(raf)
      form.style.visibility = ''
      form.style.opacity = ''
      form.style.transform = ''
      form.style.pointerEvents = ''
    }
  }, [reduced])

  return (
    <div className="lg:pl-36">
      {skippable && (
        <button
          type="button"
          onClick={() => skipRef.current?.()}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-full border border-border bg-card/90 px-4 py-2 text-sm font-semibold text-muted-foreground shadow-card backdrop-blur transition-colors hover:text-foreground"
        >
          Skip intro
        </button>
      )}
      <div ref={wrapRef} className="relative">
        {manVisible && (
          <div ref={sceneRef} className="intro-scene" aria-hidden>
            <svg
              ref={caseRef}
              width={CASE_BOX.w * SCALE}
              height={CASE_BOX.h * SCALE}
              viewBox={`${CASE_BOX.x} ${CASE_BOX.y} ${CASE_BOX.w} ${CASE_BOX.h}`}
            >
              <CaseShape ground />
            </svg>
            <Man />
          </div>
        )}
        <div ref={formRef} style={{ transformOrigin: '50% 50%' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
