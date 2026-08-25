'use client'

import { useCallback, useEffect, useState } from 'react'

import type { FinderEntry } from '@/components/ui/finder'
import { relativeTime } from '@/components/ui/hub-browser'
import type { BrowsePathSegment, Item } from '@/lib/project-types'

export interface RecentOpen {
  item: Item
  path: BrowsePathSegment[]
  openedAt: number
}

const STORAGE_KEY = 'cantera-demo-recent-opens'
const RECENTS_CAP = 6

function readRecents(): RecentOpen[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentOpen[]
    return Array.isArray(parsed)
      ? parsed.filter((entry) => entry?.item?.id && Array.isArray(entry.path)).slice(0, RECENTS_CAP)
      : []
  } catch {
    return []
  }
}

/** Loaded in an effect so the server and hydration renders agree. */
export function useRecentOpens() {
  const [recents, setRecents] = useState<RecentOpen[]>([])

  useEffect(() => {
    setRecents(readRecents())
  }, [])

  const remember = useCallback((open: RecentOpen) => {
    setRecents((previous) => {
      const next = [open, ...previous.filter((entry) => entry.item.id !== open.item.id)].slice(
        0,
        RECENTS_CAP,
      )
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Private windows and blocked storage keep working, just without memory.
      }
      return next
    })
  }, [])

  return { recents, remember }
}

export function recentFinderEntries(recents: RecentOpen[]): FinderEntry[] {
  return recents.map((recent) => ({
    item: recent.item,
    path: recent.path,
    caption: `opened ${relativeTime(recent.openedAt) ?? 'just now'}`,
  }))
}
