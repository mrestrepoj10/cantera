import type * as React from 'react'

import {
  CREW_AVATAR_VIEWBOX,
  type CrewAvatarShape,
  crewAvatarShapes,
  crewAvatarSpec,
} from '@/lib/crew-avatar-spec'

export interface CrewAvatarProps
  extends Omit<React.ComponentPropsWithoutRef<'svg'>, 'children' | 'height' | 'title' | 'width'> {
  /** The seed. The same name always draws the same worker. */
  name: string
  size?: number
  colors?: readonly string[]
  /** Pass the accessible name when the avatar is the only thing identifying
   * the person; leave it off next to a visible name. */
  title?: string
}

// The clip id comes from the seed hash rather than `useId`, which keeps this
// renderable from a server component and identical across hydration.
export function CrewAvatar({
  name,
  size = 32,
  colors,
  title,
  className,
  ...props
}: CrewAvatarProps) {
  const spec = crewAvatarSpec(name, { colors })
  const clipId = `crew-avatar-${spec.id}`
  const half = CREW_AVATAR_VIEWBOX / 2

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${CREW_AVATAR_VIEWBOX} ${CREW_AVATAR_VIEWBOX}`}
      width={size}
      height={size}
      fill="none"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <clipPath id={clipId}>
        <circle cx={half} cy={half} r={half} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>{renderShapes(crewAvatarShapes(spec))}</g>
    </svg>
  )
}

/** `shape.id` is a React key only — emitting it as a DOM id would collide the
 * moment two avatars share a page. */
function renderShapes(shapes: CrewAvatarShape[]): React.ReactNode {
  return shapes.map((shape) => {
    switch (shape.kind) {
      case 'group':
        return (
          <g key={shape.id} transform={shape.transform}>
            {renderShapes(shape.children)}
          </g>
        )
      case 'circle':
        return (
          <circle
            key={shape.id}
            cx={shape.cx}
            cy={shape.cy}
            r={shape.r}
            fill={shape.fill ?? 'none'}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
          />
        )
      case 'rect':
        return (
          <rect
            key={shape.id}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            rx={shape.rx}
            fill={shape.fill}
          />
        )
      default:
        return (
          <path
            key={shape.id}
            d={shape.d}
            fill={shape.fill ?? 'none'}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            strokeLinecap={shape.round ? 'round' : undefined}
          />
        )
    }
  })
}
