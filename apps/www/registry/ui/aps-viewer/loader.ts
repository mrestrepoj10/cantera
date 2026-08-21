import type { AutodeskGlobal, GetAccessToken } from '@/lib/viewer-types'

const VIEWER_HOST = 'https://developer.api.autodesk.com/modelderivative/v2/viewers'

export interface ViewerRuntimeOptions {
  getAccessToken: GetAccessToken
  /** SDK version, e.g. '7.*' (default) pins to latest v7 */
  version?: string
  /** Initializer environment (default 'AutodeskProduction2' — SVF2) */
  env?: string
  /** Initializer API (default 'streamingV2' — SVF2) */
  api?: string
  language?: string
}

let scriptPromise: Promise<AutodeskGlobal> | null = null
let runtimePromise: Promise<AutodeskGlobal> | null = null
let activeConsumers = 0
const tokenErrorListeners = new Set<(error: Error) => void>()

/**
 * Subscribes to token-supplier failures. The SDK's `getAccessToken` callback
 * has no rejection path — a backend that is down or a grant that expired would
 * otherwise leave the SDK waiting forever with nothing to report — so the
 * failure is broadcast here and `<APSViewer>` turns it into `onError`.
 * Returns an unsubscribe function.
 */
export function onViewerTokenError(listener: (error: Error) => void): () => void {
  tokenErrorListeners.add(listener)
  return () => {
    tokenErrorListeners.delete(listener)
  }
}

function reportTokenError(cause: unknown): void {
  const error = new Error('cantera aps-viewer: getAccessToken failed', { cause })
  if (tokenErrorListeners.size === 0) {
    // Nobody is listening: still fail loudly rather than silently.
    console.error(error, cause)
    return
  }
  for (const listener of tokenErrorListeners) listener(error)
}

function assertBrowser(): void {
  if (typeof window === 'undefined') {
    throw new Error(
      'cantera aps-viewer: the APS Viewer runtime can only load in the browser. ' +
        'Render <APSViewer> inside a client component; it is SSR-safe as long as ' +
        'you do not call loader functions during server rendering.',
    )
  }
}

/**
 * Injects the viewer <script> and <link> tags exactly once, no matter how
 * many components ask for them, and resolves when `window.Autodesk.Viewing`
 * exists. Safe to call repeatedly; concurrent callers share one promise.
 */
export function loadViewerScript(version = '7.*'): Promise<AutodeskGlobal> {
  assertBrowser()
  if (window.Autodesk?.Viewing) return Promise.resolve(window.Autodesk)
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<AutodeskGlobal>((resolve, reject) => {
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = `${VIEWER_HOST}/${version}/style.min.css`
    css.setAttribute('data-aps-viewer', 'style')
    document.head.appendChild(css)

    const script = document.createElement('script')
    script.src = `${VIEWER_HOST}/${version}/viewer3D.min.js`
    script.async = true
    script.setAttribute('data-aps-viewer', 'script')
    script.onload = () => {
      if (window.Autodesk?.Viewing) {
        resolve(window.Autodesk)
      } else {
        scriptPromise = null
        script.remove()
        css.remove()
        reject(
          new Error('cantera aps-viewer: viewer3D.min.js loaded but window.Autodesk is missing'),
        )
      }
    }
    script.onerror = () => {
      scriptPromise = null
      script.remove()
      css.remove()
      reject(
        new Error('cantera aps-viewer: failed to load the APS Viewer script from the Autodesk CDN'),
      )
    }
    document.head.appendChild(script)
  })

  return scriptPromise
}

/**
 * Loads the script (if needed) and runs `Autodesk.Viewing.Initializer` exactly
 * once. The Initializer is global in the SDK, so the first caller's options
 * win; subsequent calls share the initialized runtime.
 *
 * Call `releaseViewerRuntime()` when a consumer unmounts. The runtime itself
 * stays warm by default (re-initializing is expensive); pass
 * `shutdown: true` to tear it down when the last consumer releases.
 */
export function acquireViewerRuntime(options: ViewerRuntimeOptions): Promise<AutodeskGlobal> {
  assertBrowser()
  activeConsumers += 1
  if (runtimePromise) return runtimePromise

  const {
    getAccessToken,
    version = '7.*',
    env = 'AutodeskProduction2',
    api = 'streamingV2',
    language,
  } = options

  runtimePromise = loadViewerScript(version).then(
    (autodesk) =>
      new Promise<AutodeskGlobal>((resolve) => {
        autodesk.Viewing.Initializer(
          {
            env,
            api,
            language,
            getAccessToken: (onTokenReady: (token: string, expiresInSeconds: number) => void) => {
              getAccessToken()
                .then(({ accessToken, expiresInSeconds }) =>
                  onTokenReady(accessToken, expiresInSeconds),
                )
                .catch(reportTokenError)
            },
          },
          () => resolve(autodesk),
        )
      }),
  )
  runtimePromise.catch(() => {
    runtimePromise = null
  })
  return runtimePromise
}

export function releaseViewerRuntime({ shutdown = false }: { shutdown?: boolean } = {}): void {
  activeConsumers = Math.max(0, activeConsumers - 1)
  if (
    shutdown &&
    activeConsumers === 0 &&
    typeof window !== 'undefined' &&
    window.Autodesk?.Viewing
  ) {
    window.Autodesk.Viewing.shutdown()
    runtimePromise = null
  }
}

/** Test-only: reset module state between test cases. */
export function __resetLoaderStateForTests(): void {
  scriptPromise = null
  runtimePromise = null
  activeConsumers = 0
  tokenErrorListeners.clear()
}

/** Normalizes a Model Derivative URN into the `urn:` documentId form. */
export function toDocumentId(urn: string): string {
  const trimmed = urn.trim()
  return trimmed.startsWith('urn:') ? trimmed : `urn:${trimmed}`
}
