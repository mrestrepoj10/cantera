// Every decision is a slice of the name's hash — no Math.random, no Date — so
// server and client render identical markup and avatars never flicker on hydration.

export const CREW_AVATAR_VIEWBOX = 36

const S = CREW_AVATAR_VIEWBOX

const FNV_OFFSET_BASIS = 0x811c9dc5
const FNV_PRIME = 0x01000193

// `basis` doubles as a salt so one name yields many independent streams.
function fnv1a(value: string, basis: number): number {
  let hash = basis
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, FNV_PRIME)
  }
  return hash >>> 0
}

function seedFromName(name: string): number {
  return fnv1a(name.trim().toLowerCase(), FNV_OFFSET_BASIS)
}

function trait(seed: number, key: string): number {
  return fnv1a(key, seed)
}

function unit(seed: number, key: string, range: number): number {
  return trait(seed, key) % range
}

function chance(seed: number, key: string, percent: number): boolean {
  return trait(seed, key) % 100 < percent
}

function pick<T>(seed: number, key: string, list: readonly T[]): T {
  return list[trait(seed, key) % list.length]
}

// Magnitude from the low bits, sign from the high bits, so they stay independent.
function signed(seed: number, key: string, steps: number, step: number): number {
  const value = trait(seed, key)
  const magnitude = (value % (steps + 1)) * step
  return (value >>> 16) % 2 === 0 ? -magnitude : magnitude
}

function pickWeighted<T extends { weight: number }>(
  seed: number,
  key: string,
  table: readonly T[],
): T {
  const total = table.reduce((sum, entry) => sum + entry.weight, 0)
  let cursor = trait(seed, key) % total
  for (const entry of table) {
    cursor -= entry.weight
    if (cursor < 0) return entry
  }
  return table[table.length - 1]
}

function channels(hex: string): [number, number, number] | null {
  const raw = hex.trim().replace('#', '')
  const full =
    raw.length === 3
      ? `${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`
      : raw.length === 6
        ? raw
        : null
  if (!full || !/^[0-9a-fA-F]{6}$/.test(full)) return null
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ]
}

function toHex(rgb: number[]): string {
  return `#${rgb
    .map((channel) =>
      Math.max(0, Math.min(255, Math.round(channel)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

// Consumer-supplied colors reach this: an unparseable value passes through untouched.
function mix(from: string, to: string, weight: number): string {
  const a = channels(from)
  const b = channels(to)
  if (!a || !b) return from
  return toHex(a.map((channel, index) => channel + (b[index] - channel) * weight))
}

function shade(hex: string, amount: number): string {
  return mix(hex, amount < 0 ? '#000000' : '#ffffff', Math.abs(amount))
}

function luminance(hex: string): number {
  const rgb = channels(hex)
  if (!rgb) return 0.5
  const [r, g, b] = rgb.map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export const crewAvatarColors = [
  '#0A0A0A',
  '#141414',
  '#1F1F1F',
  '#2E2E2E',
  '#E8E8E8',
  '#EDEDED',
  '#F2F2F2',
  '#FAFAFA',
] as const

export type CrewAvatarRole =
  | 'labor'
  | 'supervisor'
  | 'signal'
  | 'technical'
  | 'safety'
  | 'emergency'

const hardHats = [
  { role: 'labor', color: '#F5A623', weight: 5 },
  { role: 'supervisor', color: '#8F8F8F', weight: 4 },
  { role: 'signal', color: '#F97316', weight: 3 },
  { role: 'technical', color: '#0070F3', weight: 2 },
  { role: 'emergency', color: '#E5484D', weight: 1 },
  { role: 'safety', color: '#45A557', weight: 1 },
] as const satisfies readonly { role: CrewAvatarRole; color: string; weight: number }[]

export type CrewAvatarHeadwear = 'hard-hat' | 'beanie'

export type CrewAvatarEyewear = 'none' | 'safety-glasses' | 'goggles'

export interface CrewAvatarOptions {
  colors?: readonly string[]
}

export interface CrewAvatarSpec {
  /** Stable base36 form of the seed hash — safe as a DOM id fragment. */
  id: string
  name: string
  background: string
  ring: string
  ink: string
  inkMuted: string
  inkFaint: string
  accent: string
  accentDeep: string
  /** What the hat color codes for, as text. Never rely on the color alone. */
  role: CrewAvatarRole
  headwear: CrewAvatarHeadwear
  eyewear: CrewAvatarEyewear
  earDefenders: boolean
  vest: boolean
  beard: boolean
  /** Degrees, about the base of the neck. */
  tilt: number
  faceX: number
  faceY: number
  eyeSpread: number
}

/** Pure and total: any string, even an empty one, yields a complete spec. */
export function crewAvatarSpec(name: string, options: CrewAvatarOptions = {}): CrewAvatarSpec {
  const seed = seedFromName(name)
  const backgrounds =
    options.colors && options.colors.length > 0 ? options.colors : crewAvatarColors
  const background = pick(seed, 'background', backgrounds)

  const dark = luminance(background) < 0.35
  const ink = dark ? '#FAFAFA' : '#101010'

  const hat = pickWeighted(seed, 'hard-hat', hardHats)
  const accent = dark ? shade(hat.color, 0.06) : shade(hat.color, -0.34)
  const eyewearRoll = unit(seed, 'eyewear', 100)

  return {
    id: seed.toString(36),
    name,
    background,
    ring: mix(background, ink, 0.1),
    ink,
    inkMuted: mix(ink, background, 0.38),
    inkFaint: mix(ink, background, 0.66),
    accent,
    accentDeep: shade(accent, dark ? -0.22 : -0.18),
    role: hat.role,
    headwear: chance(seed, 'headwear', 86) ? 'hard-hat' : 'beanie',
    eyewear: eyewearRoll < 24 ? 'goggles' : eyewearRoll < 52 ? 'safety-glasses' : 'none',
    earDefenders: chance(seed, 'ear-defenders', 30),
    vest: chance(seed, 'vest', 66),
    beard: chance(seed, 'beard', 36),
    tilt: signed(seed, 'tilt', 5, 1),
    faceX: signed(seed, 'face-x', 4, 0.3),
    faceY: signed(seed, 'face-y', 3, 0.25),
    eyeSpread: unit(seed, 'eye-spread', 7) * 0.2,
  }
}

// `id` is a React key, never a DOM id — emitting it would collide when two
// avatars share a page.
export type CrewAvatarShape =
  | {
      id: string
      kind: 'rect'
      x: number
      y: number
      width: number
      height: number
      rx?: number
      fill: string
    }
  | {
      id: string
      kind: 'circle'
      cx: number
      cy: number
      r: number
      fill?: string
      stroke?: string
      strokeWidth?: number
    }
  | {
      id: string
      kind: 'path'
      d: string
      fill?: string
      stroke?: string
      strokeWidth?: number
      round?: boolean
    }
  | { id: string; kind: 'group'; transform: string; children: CrewAvatarShape[] }

const HEAD_X = 11.6
const HEAD_TOP = 9.2
const HEAD_WIDTH = 12.8
const HEAD_HEIGHT = 13.6
const HEAD_RADIUS = 4.6
const SHOULDER_TOP = 27.2

export function crewAvatarShapes(spec: CrewAvatarSpec): CrewAvatarShape[] {
  return [
    { id: 'ground', kind: 'rect', x: 0, y: 0, width: S, height: S, fill: spec.background },
    {
      id: 'head',
      kind: 'group',
      transform: `rotate(${spec.tilt} 18 27)`,
      children: headShapes(spec),
    },
    ...bodyShapes(spec),
    { id: 'ring', kind: 'circle', cx: 18, cy: 18, r: 17.5, stroke: spec.ring, strokeWidth: 1 },
  ]
}

function headShapes(spec: CrewAvatarSpec): CrewAvatarShape[] {
  const shapes: CrewAvatarShape[] = [
    {
      id: 'skull',
      kind: 'rect',
      x: HEAD_X,
      y: HEAD_TOP,
      width: HEAD_WIDTH,
      height: HEAD_HEIGHT,
      rx: HEAD_RADIUS,
      fill: spec.ink,
    },
  ]

  if (spec.beard) {
    shapes.push({
      id: 'beard',
      kind: 'rect',
      x: 12.2,
      y: 18.4,
      width: 11.6,
      height: 5.6,
      rx: 2.4,
      fill: spec.inkMuted,
    })
  }

  shapes.push({
    id: 'face',
    kind: 'group',
    transform: `translate(${round(spec.faceX)} ${round(spec.faceY)})`,
    children: faceShapes(spec),
  })
  shapes.push(...headwearShapes(spec))

  if (spec.earDefenders) {
    shapes.push(
      {
        id: 'defender-left',
        kind: 'rect',
        x: 7.6,
        y: 15.8,
        width: 3.8,
        height: 6,
        rx: 1.9,
        fill: spec.ink,
      },
      {
        id: 'pad-left',
        kind: 'rect',
        x: 8.6,
        y: 17,
        width: 1.8,
        height: 3.6,
        rx: 0.9,
        fill: spec.inkFaint,
      },
      {
        id: 'defender-right',
        kind: 'rect',
        x: 24.6,
        y: 15.8,
        width: 3.8,
        height: 6,
        rx: 1.9,
        fill: spec.ink,
      },
      {
        id: 'pad-right',
        kind: 'rect',
        x: 25.6,
        y: 17,
        width: 1.8,
        height: 3.6,
        rx: 0.9,
        fill: spec.inkFaint,
      },
    )
  }

  return shapes
}

function faceShapes(spec: CrewAvatarSpec): CrewAvatarShape[] {
  if (spec.eyewear === 'none') {
    return [
      {
        id: 'eye-left',
        kind: 'rect',
        x: round(14.2 - spec.eyeSpread),
        y: 16.6,
        width: 1.7,
        height: 2.4,
        rx: 0.85,
        fill: spec.background,
      },
      {
        id: 'eye-right',
        kind: 'rect',
        x: round(20.1 + spec.eyeSpread),
        y: 16.6,
        width: 1.7,
        height: 2.4,
        rx: 0.85,
        fill: spec.background,
      },
    ]
  }

  if (spec.eyewear === 'safety-glasses') {
    return [
      {
        id: 'glasses',
        kind: 'rect',
        x: 11.2,
        y: 15.6,
        width: 13.6,
        height: 4.2,
        rx: 2.1,
        fill: spec.inkFaint,
      },
      {
        id: 'lens-left',
        kind: 'rect',
        x: 12.4,
        y: 16.6,
        width: 4.2,
        height: 2.2,
        rx: 1.1,
        fill: spec.background,
      },
      {
        id: 'lens-right',
        kind: 'rect',
        x: 19.4,
        y: 16.6,
        width: 4.2,
        height: 2.2,
        rx: 1.1,
        fill: spec.background,
      },
    ]
  }

  return [
    {
      id: 'strap',
      kind: 'rect',
      x: 9.6,
      y: 16.8,
      width: 16.8,
      height: 1.6,
      rx: 0.8,
      fill: spec.inkFaint,
    },
    {
      id: 'goggle-body',
      kind: 'rect',
      x: 11.2,
      y: 15,
      width: 13.6,
      height: 5.2,
      rx: 2.6,
      fill: spec.ink,
    },
    { id: 'goggle-left', kind: 'circle', cx: 14.9, cy: 17.6, r: 1.5, fill: spec.background },
    { id: 'goggle-right', kind: 'circle', cx: 21.1, cy: 17.6, r: 1.5, fill: spec.background },
  ]
}

function headwearShapes(spec: CrewAvatarSpec): CrewAvatarShape[] {
  if (spec.headwear === 'beanie') {
    return [
      {
        id: 'beanie-dome',
        kind: 'path',
        d: 'M11.4 14.4a6.6 6.6 0 0 1 13.2 0z',
        fill: spec.accent,
      },
      {
        id: 'beanie-band',
        kind: 'rect',
        x: 11,
        y: 13.2,
        width: 14,
        height: 2.4,
        rx: 1.2,
        fill: spec.accentDeep,
      },
    ]
  }

  return [
    { id: 'hat-dome', kind: 'path', d: 'M11.8 13.4a6.2 6.2 0 0 1 12.4 0z', fill: spec.accent },
    {
      id: 'hat-ridge',
      kind: 'rect',
      x: 17.3,
      y: 8,
      width: 1.4,
      height: 5,
      rx: 0.7,
      fill: spec.accentDeep,
    },
    {
      id: 'hat-brim',
      kind: 'rect',
      x: 7.6,
      y: 12.4,
      width: 20.8,
      height: 2.4,
      rx: 1.2,
      fill: spec.accent,
    },
  ]
}

function bodyShapes(spec: CrewAvatarSpec): CrewAvatarShape[] {
  const shoulders = { x: 6.2, y: SHOULDER_TOP, width: 23.6, height: 12, rx: 5.6 }

  if (!spec.vest) {
    return [{ id: 'shoulders', kind: 'rect', ...shoulders, fill: spec.ink }]
  }

  return [
    { id: 'shoulders', kind: 'rect', ...shoulders, fill: spec.ink },
    {
      id: 'chevron',
      kind: 'path',
      d: 'M11.8 27.2h2.6L18 30.6l3.6-3.4h2.6L18 33z',
      fill: spec.background,
    },
  ]
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function attributes(shape: Exclude<CrewAvatarShape, { kind: 'group' }>): string {
  switch (shape.kind) {
    case 'rect':
      return [
        `x="${shape.x}"`,
        `y="${shape.y}"`,
        `width="${shape.width}"`,
        `height="${shape.height}"`,
        shape.rx === undefined ? '' : `rx="${shape.rx}"`,
        `fill="${shape.fill}"`,
      ]
        .filter(Boolean)
        .join(' ')
    case 'circle':
      return [
        `cx="${shape.cx}"`,
        `cy="${shape.cy}"`,
        `r="${shape.r}"`,
        shape.fill ? `fill="${shape.fill}"` : 'fill="none"',
        shape.stroke ? `stroke="${shape.stroke}"` : '',
        shape.strokeWidth ? `stroke-width="${shape.strokeWidth}"` : '',
      ]
        .filter(Boolean)
        .join(' ')
    default:
      return [
        `d="${shape.d}"`,
        shape.fill ? `fill="${shape.fill}"` : 'fill="none"',
        shape.stroke ? `stroke="${shape.stroke}"` : '',
        shape.strokeWidth ? `stroke-width="${shape.strokeWidth}"` : '',
        shape.round ? 'stroke-linecap="round"' : '',
      ]
        .filter(Boolean)
        .join(' ')
  }
}

function serialize(shapes: CrewAvatarShape[]): string {
  return shapes
    .map((shape) =>
      shape.kind === 'group'
        ? `<g transform="${shape.transform}">${serialize(shape.children)}</g>`
        : `<${shape.kind} ${attributes(shape)}/>`,
    )
    .join('')
}

export interface CrewAvatarSvgOptions extends CrewAvatarOptions {
  size?: number
  /** Present means the avatar carries meaning: it gets a name, not `aria-hidden`. */
  title?: string
}

export function crewAvatarSvg(name: string, options: CrewAvatarSvgOptions = {}): string {
  const { size = 32, title, ...rest } = options
  const spec = crewAvatarSpec(name, rest)
  const clipId = `crew-avatar-${spec.id}`
  const label = title ? `role="img" aria-label="${escapeXml(title)}"` : 'aria-hidden="true"'

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}"`,
    ` width="${size}" height="${size}" fill="none" ${label}>`,
    title ? `<title>${escapeXml(title)}</title>` : '',
    `<clipPath id="${clipId}"><circle cx="${S / 2}" cy="${S / 2}" r="${S / 2}"/></clipPath>`,
    `<g clip-path="url(#${clipId})">${serialize(crewAvatarShapes(spec))}</g>`,
    '</svg>',
  ].join('')
}
