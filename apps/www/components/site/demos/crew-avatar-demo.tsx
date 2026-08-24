'use client'

import { useState } from 'react'

import { CrewAvatar } from '@/components/ui/crew-avatar'
import { Input } from '@/components/ui/input'
import { crewAvatarSpec } from '@/lib/crew-avatar'

const crew = [
  'Maria Renteria',
  'Sam Ito',
  'Luis Romero',
  'Dana Okafor',
  'Priya Raghunathan',
  'Tomas Bergqvist',
  'Aisha Bell',
  'Ken Nakamura',
  'Carla Mendes',
  'Ibrahim Toure',
  'Yuki Tanaka',
  'Hank Molloy',
]

/** Type any name: the same name always produces the same worker. */
export function CrewAvatarDemo() {
  const [name, setName] = useState('Maria Renteria')
  // The hat color codes a trade. Reading it back as text is the point: the
  // color is never the only place the fact lives.
  const { role } = crewAvatarSpec(name)

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center gap-3">
        <CrewAvatar name={name} size={64} title={`Avatar for ${name || 'nobody'}`} />
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-label="Avatar seed name"
          placeholder="Type a name"
        />
      </div>
      <p className="text-muted-foreground text-xs">
        Hard hat: <span className="text-foreground">{role}</span>
      </p>
      <ul className="flex flex-wrap gap-2">
        {crew.map((member) => (
          <li key={member}>
            <button
              type="button"
              aria-label={`Use ${member}`}
              className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              onClick={() => setName(member)}
            >
              <CrewAvatar name={member} size={40} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
