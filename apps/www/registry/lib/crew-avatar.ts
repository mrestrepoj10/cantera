/**
 * Deterministic crew avatars — the same name always draws the same worker.
 *
 * The seed name is hashed once and every decision after that is a slice of the
 * hash: palette entry, face offset, which safety gear this person wears. No
 * `Math.random`, no `Date`, no dependency — server and client produce the same
 * markup, so an avatar never flickers on hydration.
 *
 * Everything is drawn in a 36-unit square and clipped to a circle. Shapes are
 * deliberately blunt: these are read at 24-32px in a crew list, where a
 * one-unit detail is mud. The rule of thumb is that nothing narrower than two
 * units carries meaning on its own.
 */

/** The user-space square every coordinate below lives in. */
export const CREW_AVATAR_VIEWBOX = 36

const S = CREW_AVATAR_VIEWBOX

const FNV_OFFSET_BASIS = 0x811c9dc5
const FNV_PRIME = 0x01000193

/** 32-bit FNV-1a. `basis` doubles as a salt so one name yields many streams. */
function fnv1a(value: string, basis: number): number {
  let hash = basis
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, FNV_PRIME)
  }
  return hash >>> 0
}

/**
 * Case and surrounding space are not identity — "Maria Renteria" and
 * "maria renteria " are the same person on a crew list, so they get the same
 * face.
 */
function seedFromName(name: string): number {
  return fnv1a(name.trim().toLowerCase(), FNV_OFFSET_BASIS)
}

/** One independent 32-bit stream per named trait. */
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

/** Magnitude from the low bits, sign from the high bits, so they stay independent. */
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

/**
 * Mix toward white (positive) or black (negative). Consumer-supplied colors
 * reach this, so an unparseable value passes through untouched rather than
 * collapsing the whole avatar to black.
 */
function shade(hex: string, amount: number): string {
  const rgb = channels(hex)
  if (!rgb) return hex
  const target = amount < 0 ? 0 : 255
  const weight = Math.abs(amount)
  const mixed = rgb.map((channel) => Math.round(channel + (target - channel) * weight))
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Backdrop colors, mid-tone on purpose: the avatar is a self-contained disc, so
 * it has to hold its edge against a white page and a near-black one without
 * knowing which it landed on. Every entry sits in the 3:1-against-both band —
 * light enough to separate from a dark surface, dark enough to separate from a
 * light one — and each one keeps a light hard hat and a dark jacket readable
 * on top of it.
 */
export const crewAvatarColors = [
  '#3E6A88',
  '#2E6B63',
  '#4E6B34',
  '#8A6B2E',
  '#9A5236',
  '#A04F66',
  '#6D5FA0',
  '#5E6E7E',
] as const

/** Skin tones, light to deep. Face ink is derived per tone, not fixed black. */
const skinTones = [
  '#F6D5B8',
  '#EFC49C',
  '#DFA97A',
  '#C98F5E',
  '#AC7444',
  '#96613A',
  '#875634',
] as const

const hairColors = ['#241A13', '#3D2A1B', '#5C3E24', '#7A5432', '#A8622E', '#8E8B86'] as const

/** Deep tones only, so the beard never reads as a pasted-on light patch. */
const darkHairColors = ['#241A13', '#3D2A1B', '#5C3E24'] as const

/**
 * Hard hat colors carry meaning on a real site: white for supervisors and
 * engineers, yellow for general labor, orange for signalers and traffic, blue
 * for technical trades, green for safety, red for emergency response. The
 * weights approximate the mix on an actual crew rather than an even spread.
 */
const hardHatColors = [
  { color: '#F2C21B', weight: 5 },
  { color: '#EDEFF2', weight: 4 },
  { color: '#F0801E', weight: 3 },
  { color: '#2E7BC4', weight: 2 },
  { color: '#D2402F', weight: 1 },
  { color: '#3FA05A', weight: 1 },
] as const

const beanieColors = ['#C2452F', '#2E6B7A', '#3A4250', '#7A5C3E', '#4E6B34'] as const

/** Work shirts stay dark so a hi-vis vest reads as the brighter layer on top. */
const shirtColors = ['#3B4A5A', '#2F3A42', '#55604F', '#6B4535', '#44506B'] as const

/**
 * Hi-vis, each with its own tape. Retroreflective tape is grey until a light
 * hits it, and grey is what keeps it legible on the lime vest — silver-white
 * banding all but disappears against fluorescent yellow-green.
 */
const hiVisVests = [
  { fill: '#D2E32C', tape: '#8E9BA4' },
  { fill: '#F2851F', tape: '#E8EEF2' },
] as const

const earDefenderColors = ['#2B3138', '#E04A2F', '#F0871E'] as const

const LENS_DARK = '#26333D'
const LENS_GLINT = '#7E97A6'
const LENS_CLEAR = '#D5E3EC'
const FRAME = '#2B3138'

export type CrewAvatarHeadwear = 'hard-hat' | 'beanie'

export type CrewAvatarEyewear = 'none' | 'safety-glasses' | 'goggles'

export interface CrewAvatarOptions {
  /** Backdrop palette override, the way boring-avatars takes `colors`. */
  colors?: readonly string[]
}

export interface CrewAvatarSpec {
  /** Stable base36 form of the seed hash — safe as a DOM id fragment. */
  id: string
  name: string
  background: string
  backdrop: string
  backdropX: number
  backdropY: number
  backdropRadius: number
  skin: string
  ink: string
  hair: string
  shirt: string
  headwear: CrewAvatarHeadwear
  headwearColor: string
  headwearAccent: string
  eyewear: CrewAvatarEyewear
  earDefenders: boolean
  earDefenderColor: string
  vest: boolean
  vestColor: string
  reflective: string
  beard: boolean
  /** Degrees, about the base of the neck. */
  tilt: number
  faceX: number
  faceY: number
  eyeSpread: number
  mouthWidth: number
  mouthOpen: boolean
}

/**
 * Resolve a name into every visual decision. Pure and total: any string, even
 * an empty one, yields a complete spec.
 */
export function crewAvatarSpec(name: string, options: CrewAvatarOptions = {}): CrewAvatarSpec {
  const seed = seedFromName(name)
  const backgrounds =
    options.colors && options.colors.length > 0 ? options.colors : crewAvatarColors

  const skinIndex = unit(seed, 'skin', skinTones.length)
  const skin = skinTones[skinIndex]
  const background = pick(seed, 'background', backgrounds)
  const headwear: CrewAvatarHeadwear = chance(seed, 'headwear', 86) ? 'hard-hat' : 'beanie'
  const headwearColor =
    headwear === 'hard-hat'
      ? pickWeighted(seed, 'hat-color', hardHatColors).color
      : pick(seed, 'beanie-color', beanieColors)
  const eyewearRoll = unit(seed, 'eyewear', 100)
  const earDefenders = chance(seed, 'ear-defenders', 32)
  const hiVis = pick(seed, 'vest-color', hiVisVests)

  return {
    id: seed.toString(36),
    name,
    background,
    backdrop: shade(background, chance(seed, 'backdrop-tone', 55) ? 0.16 : -0.16),
    backdropX: signed(seed, 'backdrop-x', 8, 0.5),
    backdropY: signed(seed, 'backdrop-y', 8, 0.5),
    backdropRadius: 12.5 + unit(seed, 'backdrop-radius', 7) * 0.5,
    skin,
    ink: shade(skin, -0.82),
    hair: pick(seed, 'hair', skinIndex >= 4 ? darkHairColors : hairColors),
    shirt: pick(seed, 'shirt', shirtColors),
    headwear,
    headwearColor,
    headwearAccent:
      headwear === 'hard-hat' ? shade(headwearColor, -0.16) : shade(headwearColor, 0.18),
    eyewear: eyewearRoll < 26 ? 'goggles' : eyewearRoll < 52 ? 'safety-glasses' : 'none',
    earDefenders,
    earDefenderColor: pick(seed, 'ear-defender-color', earDefenderColors),
    vest: chance(seed, 'vest', 64),
    vestColor: hiVis.fill,
    reflective: hiVis.tape,
    beard: chance(seed, 'beard', 38),
    tilt: signed(seed, 'tilt', 6, 1),
    faceX: signed(seed, 'face-x', 4, 0.3),
    faceY: signed(seed, 'face-y', 4, 0.25),
    eyeSpread: unit(seed, 'eye-spread', 9) * 0.2,
    mouthWidth: 2.5 + unit(seed, 'mouth-width', 7) * 0.2,
    mouthOpen: chance(seed, 'mouth-open', 34),
  }
}

/**
 * A renderer-neutral shape list. Both the JSX component and the markup string
 * walk this, so the two can never drift apart. `id` is a React key, never a DOM
 * id — emitting it would collide the moment two avatars share a page.
 */
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
  | { id: string; kind: 'circle'; cx: number; cy: number; r: number; fill: string }
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

/** Head geometry, shared by the face, the headwear, and the ear defenders. */
const HEAD_X = 9.4
const HEAD_TOP = 6.4
const HEAD_WIDTH = 17.2
const HEAD_HEIGHT = 17.8
const SHOULDER_TOP = 25.4
const COLLAR_BOTTOM = 31.6

export function crewAvatarShapes(spec: CrewAvatarSpec): CrewAvatarShape[] {
  return [
    { id: 'ground', kind: 'rect', x: 0, y: 0, width: S, height: S, fill: spec.background },
    {
      id: 'backdrop',
      kind: 'circle',
      cx: 18 + spec.backdropX,
      cy: 13 + spec.backdropY,
      r: spec.backdropRadius,
      fill: spec.backdrop,
    },
    {
      id: 'head',
      kind: 'group',
      transform: `rotate(${spec.tilt} 18 25)`,
      children: headShapes(spec),
    },
    ...bodyShapes(spec),
  ]
}

function headShapes(spec: CrewAvatarSpec): CrewAvatarShape[] {
  const shapes: CrewAvatarShape[] = [
    {
      id: 'neck',
      kind: 'rect',
      x: 15.2,
      y: 21.4,
      width: 5.6,
      height: 6.2,
      rx: 1.6,
      fill: shade(spec.skin, -0.14),
    },
    { id: 'ear-left', kind: 'circle', cx: 9.2, cy: 17.2, r: 2.2, fill: spec.skin },
    { id: 'ear-right', kind: 'circle', cx: 26.8, cy: 17.2, r: 2.2, fill: spec.skin },
    {
      id: 'skull',
      kind: 'rect',
      x: HEAD_X,
      y: HEAD_TOP,
      width: HEAD_WIDTH,
      height: HEAD_HEIGHT,
      rx: 8,
      fill: spec.skin,
    },
  ]

  if (spec.beard) {
    shapes.push({
      id: 'beard',
      kind: 'rect',
      x: 11,
      y: 17.4,
      width: 14,
      height: 7.6,
      rx: 3.8,
      fill: spec.hair,
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
    const pad = shade(spec.earDefenderColor, 0.32)
    shapes.push(
      {
        id: 'defender-left',
        kind: 'rect',
        x: 6,
        y: 13.8,
        width: 4.8,
        height: 6.6,
        rx: 2.4,
        fill: spec.earDefenderColor,
      },
      { id: 'pad-left', kind: 'rect', x: 7.1, y: 15, width: 2.6, height: 4.2, rx: 1.3, fill: pad },
      {
        id: 'defender-right',
        kind: 'rect',
        x: 25.2,
        y: 13.8,
        width: 4.8,
        height: 6.6,
        rx: 2.4,
        fill: spec.earDefenderColor,
      },
      {
        id: 'pad-right',
        kind: 'rect',
        x: 26.3,
        y: 15,
        width: 2.6,
        height: 4.2,
        rx: 1.3,
        fill: pad,
      },
    )
  }

  return shapes
}

function faceShapes(spec: CrewAvatarSpec): CrewAvatarShape[] {
  const shapes: CrewAvatarShape[] = []
  const eyeY = 14.4
  const mouthY = 19.6
  const mouth = spec.mouthWidth
  // A dark smile vanishes into a beard. A bearded mouth is drawn a shade
  // lighter than the skin instead, which holds up even when hair and skin are
  // both deep browns.
  const mouthColor = spec.beard ? shade(spec.skin, 0.2) : spec.ink

  if (spec.eyewear === 'safety-glasses') {
    shapes.push({
      id: 'lens-clear',
      kind: 'rect',
      x: 9.6,
      y: 13.2,
      width: 16.8,
      height: 4.8,
      rx: 2.4,
      fill: LENS_CLEAR,
    })
  }

  if (spec.eyewear !== 'goggles') {
    shapes.push(
      {
        id: 'eye-left',
        kind: 'rect',
        x: round(13.6 - spec.eyeSpread),
        y: eyeY,
        width: 2,
        height: 2.8,
        rx: 1,
        fill: spec.ink,
      },
      {
        id: 'eye-right',
        kind: 'rect',
        x: round(20.4 + spec.eyeSpread),
        y: eyeY,
        width: 2,
        height: 2.8,
        rx: 1,
        fill: spec.ink,
      },
    )
  }

  shapes.push(
    spec.mouthOpen
      ? {
          id: 'mouth',
          kind: 'path',
          d: `M${round(18 - mouth)} ${mouthY}a${round(mouth)} ${round(mouth * 0.8)} 0 0 0 ${round(mouth * 2)} 0z`,
          fill: mouthColor,
        }
      : {
          id: 'mouth',
          kind: 'path',
          d: `M${round(18 - mouth)} ${mouthY}q${round(mouth)} ${round(mouth * 0.85)} ${round(mouth * 2)} 0`,
          stroke: mouthColor,
          strokeWidth: 1.4,
          round: true,
        },
  )

  if (spec.eyewear === 'safety-glasses') {
    shapes.push(
      {
        id: 'brow-bar',
        kind: 'rect',
        x: 9.6,
        y: 12.6,
        width: 16.8,
        height: 1.4,
        rx: 0.7,
        fill: FRAME,
      },
      {
        id: 'bridge',
        kind: 'rect',
        x: 16.8,
        y: 13.8,
        width: 2.4,
        height: 1.2,
        rx: 0.6,
        fill: FRAME,
      },
    )
  }

  if (spec.eyewear === 'goggles') {
    shapes.push(
      {
        id: 'strap',
        kind: 'rect',
        x: 6.6,
        y: 14.6,
        width: 22.8,
        height: 1.8,
        rx: 0.9,
        fill: FRAME,
      },
      {
        id: 'goggle-lens',
        kind: 'rect',
        x: 9.2,
        y: 12.8,
        width: 17.6,
        height: 5.6,
        rx: 2.8,
        fill: LENS_DARK,
      },
      { id: 'glint', kind: 'path', d: 'M12.6 17.9l3.4-4.6h2.2l-3.4 4.6z', fill: LENS_GLINT },
    )
  }

  return shapes
}

function headwearShapes(spec: CrewAvatarSpec): CrewAvatarShape[] {
  if (spec.headwear === 'beanie') {
    return [
      {
        id: 'beanie-dome',
        kind: 'path',
        d: 'M9.8 12.4a8.2 8.2 0 0 1 16.4 0z',
        fill: spec.headwearColor,
      },
      { id: 'bobble', kind: 'circle', cx: 18, cy: 4.6, r: 1.9, fill: spec.headwearAccent },
      {
        id: 'beanie-band',
        kind: 'rect',
        x: 9.2,
        y: 10.6,
        width: 17.6,
        height: 3.2,
        rx: 1.6,
        fill: spec.headwearAccent,
      },
    ]
  }

  return [
    {
      id: 'hat-dome',
      kind: 'path',
      d: 'M9.6 11.4a8.4 8.4 0 0 1 16.8 0z',
      fill: spec.headwearColor,
    },
    {
      id: 'hat-ridge',
      kind: 'rect',
      x: 17,
      y: 3.8,
      width: 2,
      height: 6.6,
      rx: 1,
      fill: spec.headwearAccent,
    },
    {
      id: 'hat-brim',
      kind: 'rect',
      x: 5.6,
      y: 10.2,
      width: 24.8,
      height: 3.4,
      rx: 1.7,
      fill: spec.headwearColor,
    },
    {
      id: 'brim-shadow',
      kind: 'rect',
      x: HEAD_X,
      y: 13.6,
      width: HEAD_WIDTH,
      height: 0.9,
      fill: shade(spec.skin, -0.2),
    },
  ]
}

function bodyShapes(spec: CrewAvatarSpec): CrewAvatarShape[] {
  const shoulders = { x: 3.4, y: SHOULDER_TOP, width: 29.2, height: 16.2, rx: 7.6 }
  const collar = `M13.6 ${SHOULDER_TOP}L18 ${COLLAR_BOTTOM}l4.4-${round(COLLAR_BOTTOM - SHOULDER_TOP)}z`

  if (!spec.vest) {
    return [
      { id: 'shoulders', kind: 'rect', ...shoulders, fill: spec.shirt },
      { id: 'collar', kind: 'path', d: collar, fill: shade(spec.shirt, -0.24) },
    ]
  }

  return [
    { id: 'shoulders', kind: 'rect', ...shoulders, fill: spec.shirt },
    { id: 'vest', kind: 'rect', ...shoulders, fill: spec.vestColor },
    {
      id: 'brace-left',
      kind: 'rect',
      x: 8,
      y: 26.2,
      width: 2.4,
      height: 10,
      fill: spec.reflective,
    },
    {
      id: 'brace-right',
      kind: 'rect',
      x: 25.6,
      y: 26.2,
      width: 2.4,
      height: 10,
      fill: spec.reflective,
    },
    { id: 'band', kind: 'rect', x: 5.2, y: 29, width: 25.6, height: 2.4, fill: spec.reflective },
    { id: 'collar', kind: 'path', d: collar, fill: spec.shirt },
  ]
}

/** Two decimals is under a tenth of a device pixel at 64px — plenty. */
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
      return `cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}" fill="${shape.fill}"`
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

/**
 * The same avatar as a standalone markup string, for previews, emails, and
 * anything outside React.
 */
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
