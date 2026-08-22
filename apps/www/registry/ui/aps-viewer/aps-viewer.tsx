'use client'

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { APSViewerContext } from '@/components/ui/aps-viewer/context'
import {
  acquireViewerRuntime,
  onViewerTokenError,
  releaseViewerRuntime,
  toDocumentId,
} from '@/components/ui/aps-viewer/loader'
import { ViewerStore } from '@/components/ui/aps-viewer/store'
import type {
  APSDocument,
  APSExtensionRequest,
  APSModel,
  APSViewer3D,
  APSViewerProfile,
  APSViewerStatus,
  GetAccessToken,
} from '@/lib/viewer-types'

export interface APSViewerProps {
  /**
   * Model Derivative URN (base64), with or without the `urn:` prefix.
   * Omit to mount an empty viewer and load models imperatively via
   * `onViewerReady` / `useAPSViewer`.
   */
  urn?: string
  /** Fetches an OAuth token from your backend. Must be referentially stable
   * or the value at first mount wins (the SDK initializer is global). */
  getAccessToken: GetAccessToken
  /** SDK version (default '7.*') */
  version?: string
  /** Initializer env (default 'AutodeskProduction2') */
  env?: string
  /** Initializer api (default 'streamingV2') */
  api?: string
  /**
   * Extensions to load once the viewer starts: bare ids, or `{ id, options }`
   * entries when the extension reads load options. Captured when the viewer
   * mounts. Load progress is observable via `useAPSExtensions()`; failures
   * report through `onExtensionError`. The `viewer-extension-types` item
   * catalogs the public ids and types their options.
   */
  extensions?: APSExtensionRequest[]
  /** Extra config passed to the GuiViewer3D constructor */
  viewerConfig?: Record<string, unknown>
  /**
   * Named Autodesk settings profile applied at creation — `'aec'` is
   * Autodesk's "Construction (AEC)" tuning (reversed zoom, edge rendering,
   * AEC light preset). Omit for the SDK default.
   */
  profile?: APSViewerProfile
  /** Native GuiViewer3D toolbar, or the toolbar-less core Viewer3D. */
  toolbar?: 'native' | 'none'
  /** Force one appearance. Omit to follow the app's light/dark appearance live. */
  theme?: 'light' | 'dark'
  /** Observe the viewer container and resize the WebGL canvas. Default true. */
  autoResize?: boolean
  /** Shut the whole SDK runtime down when the last viewer unmounts.
   * Default false: keeps the runtime warm across route changes. */
  shutdownOnUnmount?: boolean
  onViewerReady?: (viewer: APSViewer3D) => void
  onModelLoaded?: (model: APSModel, doc: APSDocument) => void
  onError?: (error: Error) => void
  /** An extension from `extensions` failed to load. Non-fatal: the viewer and
   * the other extensions keep going, so this is a report, not a teardown. */
  onExtensionError?: (id: string, error: Error) => void
  className?: string
  style?: CSSProperties
  /** Overlay UI. Rendered inside the provider, absolutely positioned children
   * can sit on top of the canvas and use every hook. */
  children?: ReactNode
}

/** A bare id and an `{ id, options }` entry are the same request. */
function toExtensionEntry(request: APSExtensionRequest): {
  id: string
  options?: Record<string, unknown>
} {
  return typeof request === 'string' ? { id: request } : request
}

/** Unloading is best-effort: the viewer may already be finished. */
function unloadModel(viewer: APSViewer3D | null, model: APSModel | null): void {
  if (!viewer || !model) return
  try {
    viewer.unloadModel(model)
  } catch {
    // the viewer is gone; the model went with it
  }
}

/**
 * APS Viewer container. Renders a plain positioned <div> on the
 * server (SSR-safe: no window access until effects run), then on the client:
 *
 *  1. loads the SDK script/CSS from the Autodesk CDN exactly once,
 *  2. runs the global Initializer exactly once,
 *  3. instantiates a viewer bound to this component's lifetime,
 *  4. tears everything down on unmount — including under React Strict Mode's
 *     mount → unmount → remount cycle, which is where naive wrappers leak
 *     WebGL contexts.
 */
export function APSViewer({
  urn,
  getAccessToken,
  version,
  env,
  api,
  extensions,
  viewerConfig,
  profile,
  toolbar = 'native',
  theme,
  autoResize = true,
  shutdownOnUnmount = false,
  onViewerReady,
  onModelLoaded,
  onError,
  onExtensionError,
  className,
  style,
  children,
}: APSViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [store] = useState(() => new ViewerStore())
  const [status, setStatus] = useState<APSViewerStatus>('idle')
  const viewerRef = useRef<APSViewer3D | null>(null)

  // Latest-callback refs so effect deps stay minimal and consumers can pass
  // inline closures without recreating the viewer.
  const callbacksRef = useRef({
    getAccessToken,
    onViewerReady,
    onModelLoaded,
    onError,
    onExtensionError,
  })
  callbacksRef.current = { getAccessToken, onViewerReady, onModelLoaded, onError, onExtensionError }

  // biome-ignore lint/correctness/useExhaustiveDependencies: viewerConfig and extensions are intentionally captured at creation time
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let disposed = false
    let viewer: APSViewer3D | null = null

    setStatus('loading-runtime')
    acquireViewerRuntime({
      getAccessToken: () => callbacksRef.current.getAccessToken(),
      version,
      env,
      api,
    })
      .then((autodesk) => {
        // Strict Mode: the first effect's cleanup may already have run.
        if (disposed) return
        const Ctor = toolbar === 'none' ? autodesk.Viewing.Viewer3D : autodesk.Viewing.GuiViewer3D
        viewer = new Ctor(container, viewerConfig)
        const startCode = viewer.start()
        if (startCode > 0) {
          throw new Error(`cantera aps-viewer: viewer.start() failed with code ${startCode}`)
        }
        viewerRef.current = viewer
        store.attach(viewer)
        if (profile) {
          const settings = {
            aec: autodesk.Viewing.ProfileSettings.AEC,
            default: autodesk.Viewing.ProfileSettings.Default,
            fluent: autodesk.Viewing.ProfileSettings.Fluent,
            navis: autodesk.Viewing.ProfileSettings.Navis,
          }[profile]
          if (settings) viewer.setProfile(new autodesk.Viewing.Profile(settings))
        }
        const boundViewer = viewer
        for (const request of extensions ?? []) {
          const { id, options } = toExtensionEntry(request)
          store.setExtensionStatus(id, 'loading')
          boundViewer
            .loadExtension(id, options)
            .then(() => {
              if (!disposed) store.setExtensionStatus(id, 'ready')
            })
            .catch((error) => {
              if (disposed) return
              store.setExtensionStatus(id, 'error')
              const wrapped =
                error instanceof Error
                  ? error
                  : new Error(`cantera aps-viewer: failed to load extension "${id}"`)
              console.error(`cantera aps-viewer: failed to load extension "${id}"`, error)
              callbacksRef.current.onExtensionError?.(id, wrapped)
            })
        }
        setStatus('ready')
        callbacksRef.current.onViewerReady?.(viewer)
      })
      .catch((error: Error) => {
        if (disposed) return
        setStatus('error')
        callbacksRef.current.onError?.(error)
      })

    return () => {
      disposed = true
      store.detach()
      if (viewer) {
        viewer.finish()
        viewer = null
        viewerRef.current = null
      }
      releaseViewerRuntime({ shutdown: shutdownOnUnmount })
      setStatus('idle')
    }
  }, [version, env, api, toolbar, profile, shutdownOnUnmount, store])

  // Appearance is deliberately separate from viewer lifetime: a theme switch
  // calls setTheme in place and never burns a second WebGL context.
  useEffect(() => {
    if (status !== 'ready') return
    const viewer = viewerRef.current
    if (!viewer || typeof window === 'undefined') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const root = document.documentElement
      const dark = theme
        ? theme === 'dark'
        : root.classList.contains('dark') || (!root.classList.contains('light') && media.matches)
      viewer.setTheme(dark ? 'dark-theme' : 'light-theme')
    }
    apply()
    if (theme) return

    const observer = new MutationObserver(apply)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    media.addEventListener('change', apply)
    return () => {
      observer.disconnect()
      media.removeEventListener('change', apply)
    }
  }, [status, theme])

  // The SDK's token callback cannot reject, so the loader broadcasts token
  // failures instead: without this the viewer would sit at "loading" forever
  // with nothing reported to the consumer.
  useEffect(
    () =>
      onViewerTokenError((error) => {
        setStatus((previous) => (previous === 'ready' ? previous : 'error'))
        callbacksRef.current.onError?.(error)
      }),
    [],
  )

  useEffect(() => {
    if (!autoResize || status !== 'ready' || typeof ResizeObserver === 'undefined') return
    const viewer = viewerRef.current
    if (!viewer) return
    const observer = new ResizeObserver(() => viewer.resize())
    observer.observe(viewer.container)
    return () => observer.disconnect()
  }, [autoResize, status])

  // Model loading is a separate concern from viewer lifetime: swapping `urn`
  // reuses the live viewer instead of recreating the WebGL context.
  useEffect(() => {
    const viewer = viewerRef.current
    const autodesk = typeof window !== 'undefined' ? window.Autodesk : undefined
    if (status !== 'ready' || !viewer || !autodesk) return
    if (!urn) return

    let cancelled = false
    let loadedModel: APSModel | null = null
    // A URN swap reuses this store, so the previous model's snapshot has to
    // go before the next document starts loading.
    store.resetModel()

    autodesk.Viewing.Document.load(
      toDocumentId(urn),
      (doc) => {
        if (cancelled) return
        const geometry = doc.getRoot().getDefaultGeometry()
        if (!geometry) {
          callbacksRef.current.onError?.(
            new Error('cantera aps-viewer: document has no viewable geometry'),
          )
          return
        }
        viewer
          .loadDocumentNode(doc, geometry)
          .then((model) => {
            // Cancelled while this request was in flight: the cleanup below
            // has already run and never saw this model, so unload it here or
            // it stays in the viewer next to the model that replaced it.
            if (cancelled) {
              unloadModel(viewerRef.current, model)
              return
            }
            loadedModel = model
            callbacksRef.current.onModelLoaded?.(model, doc)
          })
          .catch((error: Error) => {
            if (!cancelled) callbacksRef.current.onError?.(error)
          })
      },
      (code, message) => {
        if (cancelled) return
        callbacksRef.current.onError?.(
          new Error(`cantera aps-viewer: Document.load failed (${code}): ${message}`),
        )
      },
    )

    return () => {
      cancelled = true
      unloadModel(viewerRef.current, loadedModel)
      store.resetModel()
    }
  }, [status, urn, store])

  return (
    <APSViewerContext.Provider value={store}>
      <div
        className={className}
        style={{ position: 'relative', ...style }}
        data-aps-viewer=""
        data-aps-viewer-status={status}
      >
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
        {children}
      </div>
    </APSViewerContext.Provider>
  )
}
