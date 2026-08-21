'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useAPSViewerStore } from '@/components/ui/aps-viewer/context'
import { ViewerStore } from '@/components/ui/aps-viewer/store'
import type { APSCameraState, APSPropertyResult, APSViewer3D, Vec3 } from '@/lib/viewer-types'

/**
 * The live viewer instance (or null until ready). Re-renders when the viewer
 * mounts, attaches, or is torn down.
 */
export function useAPSViewer(): { viewer: APSViewer3D | null; isReady: boolean } {
  const store = useAPSViewerStore()
  const viewer = useSyncExternalStore(store.subscribe, store.getViewer, ViewerStore.getServerViewer)
  return { viewer, isReady: viewer !== null }
}

/** True once the current model's geometry has streamed in. */
export function useAPSModelLoaded(): boolean {
  const store = useAPSViewerStore()
  return useSyncExternalStore(
    store.subscribe,
    store.isModelLoaded,
    ViewerStore.getServerModelLoaded,
  )
}

export interface APSSelection {
  /** Currently selected dbIds (stable reference between selection events) */
  dbIds: readonly number[]
  select: (dbIds: number[] | number) => void
  clear: () => void
  isolate: (dbIds?: number[] | number) => void
  fitToView: (dbIds?: number[]) => void
}

/** Event-driven selection state plus the common selection verbs. */
export function useAPSSelection(): APSSelection {
  const store = useAPSViewerStore()
  const dbIds = useSyncExternalStore(
    store.subscribe,
    store.getSelection,
    ViewerStore.getServerSelection,
  )

  return useMemo(
    () => ({
      dbIds,
      select: (ids: number[] | number) => store.getViewer()?.select(ids),
      clear: () => store.getViewer()?.clearSelection(),
      isolate: (ids?: number[] | number) => store.getViewer()?.isolate(ids),
      fitToView: (ids?: number[]) => store.getViewer()?.fitToView(ids ?? null),
    }),
    [dbIds, store],
  )
}

export interface APSCamera {
  /** rAF-coalesced camera state (null until the first frame after load) */
  camera: APSCameraState | null
  setView: (position: Vec3, target: Vec3, up?: Vec3) => void
  fitToView: () => void
}

/** Camera state, updated at most once per animation frame while orbiting. */
export function useAPSCamera(): APSCamera {
  const store = useAPSViewerStore()
  const camera = useSyncExternalStore(store.subscribe, store.getCamera, ViewerStore.getServerCamera)

  return useMemo(
    () => ({
      camera,
      setView: (position: Vec3, target: Vec3, up?: Vec3) => {
        const viewer = store.getViewer()
        if (!viewer) return
        viewer.navigation.setView(position, target)
        if (up) viewer.navigation.setCameraUpVector(up)
      },
      fitToView: () => store.getViewer()?.fitToView(null),
    }),
    [camera, store],
  )
}

/**
 * Subscribes a handler to any raw viewer event (e.g.
 * `Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT`) with automatic cleanup.
 * The handler is kept in a ref, so inline closures are fine.
 */
export function useAPSViewerEvent(eventType: string, handler: (event: any) => void): void {
  const { viewer } = useAPSViewer()
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!viewer) return
    const listener = (event: any) => handlerRef.current(event)
    viewer.addEventListener(eventType, listener)
    return () => viewer.removeEventListener(eventType, listener)
  }, [viewer, eventType])
}

export interface APSPropertiesResult {
  data: APSPropertyResult[]
  isLoading: boolean
  error: Error | null
}

/**
 * Async property fetch for a set of dbIds. Pass `useAPSSelection().dbIds`
 * to get live properties-of-selection. Results are cancelled on change,
 * so stale responses never overwrite fresh ones.
 */
export function useAPSProperties(dbIds: readonly number[]): APSPropertiesResult {
  const { viewer } = useAPSViewer()
  const [state, setState] = useState<APSPropertiesResult>({
    data: [],
    isLoading: false,
    error: null,
  })
  const key = dbIds.join(',')

  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` is the serialized identity of dbIds — depending on the array itself would refetch on every render
  useEffect(() => {
    if (!viewer || dbIds.length === 0) {
      setState({ data: [], isLoading: false, error: null })
      return
    }
    let cancelled = false
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    Promise.all(
      dbIds.map(
        (dbId) =>
          new Promise<APSPropertyResult>((resolve, reject) =>
            viewer.getProperties(dbId, resolve, reject),
          ),
      ),
    )
      .then((data) => {
        if (!cancelled) setState({ data, isLoading: false, error: null })
      })
      .catch((error) => {
        if (!cancelled)
          setState({
            data: [],
            isLoading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          })
      })

    return () => {
      cancelled = true
    }
  }, [viewer, key])

  return state
}

let contextMenuCallbackId = 0

export type BuildContextMenu = (
  items: import('@/lib/viewer-types').APSContextMenuItem[],
  status: import('@/lib/viewer-types').APSContextMenuStatus,
) => import('@/lib/viewer-types').APSContextMenuItem[]

/**
 * Customizes the viewer's right-click menu. The builder receives the SDK's
 * default items and the menu status (what's under the cursor) and returns
 * the items to show — add, remove, or replace freely. Unregisters on unmount.
 */
export function useAPSContextMenu(build: BuildContextMenu): void {
  const { viewer } = useAPSViewer()
  const buildRef = useRef(build)
  buildRef.current = build

  useEffect(() => {
    if (!viewer) return
    const id = `cantera-aps-viewer-menu-${++contextMenuCallbackId}`
    viewer.registerContextMenuCallback(id, (menu, status) => {
      const next = buildRef.current(menu.slice(), status)
      menu.length = 0
      menu.push(...next)
    })
    return () => {
      viewer.unregisterContextMenuCallback(id)
    }
  }, [viewer])
}

/** Imperative escape hatch: load any viewer extension while mounted. */
export function useAPSExtension(id: string, options?: Record<string, unknown>): void {
  const { viewer } = useAPSViewer()
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    if (!viewer) return
    let cancelled = false
    viewer.loadExtension(id, optionsRef.current).catch((error) => {
      if (!cancelled) console.error(`cantera aps-viewer: failed to load extension "${id}"`, error)
    })
    return () => {
      cancelled = true
      try {
        viewer.unloadExtension(id)
      } catch {
        // viewer may already be finished
      }
    }
  }, [viewer, id])
}

/** Convenience: viewer resize bound to a ResizeObserver on its container. */
export function useAPSAutoResize(): void {
  const { viewer } = useAPSViewer()
  useEffect(() => {
    if (!viewer || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => viewer.resize())
    observer.observe(viewer.container)
    return () => observer.disconnect()
  }, [viewer])
}
