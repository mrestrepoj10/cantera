import type { APSCameraState, APSExtensionStatus, APSViewer3D } from '@/lib/viewer-types'

type Listener = () => void

const EMPTY_SELECTION: readonly number[] = Object.freeze([])
const EMPTY_EXTENSIONS: Readonly<Record<string, APSExtensionStatus>> = Object.freeze({})

/**
 * Bridges the viewer's imperative event bus into a React 18/19 external
 * store. Snapshots are cached and replaced only when the underlying event
 * fires, so `useSyncExternalStore` gets referentially stable values and
 * never tears or loops.
 *
 * Camera changes fire once per animation frame during orbits, so camera
 * snapshots are coalesced through requestAnimationFrame.
 */
export class ViewerStore {
  private viewer: APSViewer3D | null = null
  private listeners = new Set<Listener>()
  private handlers: Array<[string, (event: any) => void]> = []
  private selection: readonly number[] = EMPTY_SELECTION
  private camera: APSCameraState | null = null
  private modelLoaded = false
  private rafId: number | null = null
  private extensions: Readonly<Record<string, APSExtensionStatus>> = EMPTY_EXTENSIONS

  attach(viewer: APSViewer3D): void {
    const viewing = window.Autodesk?.Viewing
    if (!viewing) throw new Error('cantera aps-viewer: viewer runtime not loaded')
    this.viewer = viewer

    const on = (type: string, handler: (event: any) => void) => {
      viewer.addEventListener(type, handler)
      this.handlers.push([type, handler])
    }

    on(viewing.SELECTION_CHANGED_EVENT, () => {
      this.selection = Object.freeze(viewer.getSelection().slice())
      this.emit()
    })
    on(viewing.CAMERA_CHANGE_EVENT, () => this.scheduleCameraSnapshot())
    on(viewing.GEOMETRY_LOADED_EVENT, () => {
      this.modelLoaded = true
      // First camera snapshot once geometry exists, so useAPSCamera has an
      // initial value without waiting for the user to move the camera.
      this.scheduleCameraSnapshot()
      this.emit()
    })

    this.emit()
  }

  /**
   * Drops the model-loaded snapshot without tearing the viewer down. A URN
   * swap reuses the same store, so the flag has to fall back to false while
   * the next document loads — otherwise overlays keyed off
   * `useAPSModelLoaded()` disappear before there is anything to look at.
   */
  resetModel(): void {
    if (!this.modelLoaded) return
    this.modelLoaded = false
    this.emit()
  }

  /**
   * Load lifecycle of the extensions the viewer component was asked to load,
   * as a frozen snapshot keyed by extension id — replaced, never mutated, so
   * `useSyncExternalStore` sees each transition.
   */
  setExtensionStatus(id: string, status: APSExtensionStatus): void {
    if (this.extensions[id] === status) return
    this.extensions = Object.freeze({ ...this.extensions, [id]: status })
    this.emit()
  }

  detach(): void {
    if (this.viewer) {
      for (const [type, handler] of this.handlers) {
        this.viewer.removeEventListener(type, handler)
      }
    }
    this.handlers = []
    if (this.rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.viewer = null
    this.selection = EMPTY_SELECTION
    this.camera = null
    this.modelLoaded = false
    this.extensions = EMPTY_EXTENSIONS
    this.emit()
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getViewer = (): APSViewer3D | null => this.viewer
  getSelection = (): readonly number[] => this.selection
  getCamera = (): APSCameraState | null => this.camera
  isModelLoaded = (): boolean => this.modelLoaded
  getExtensionStatuses = (): Readonly<Record<string, APSExtensionStatus>> => this.extensions

  /** Server snapshots for useSyncExternalStore — stable, empty values. */
  static getServerViewer = (): APSViewer3D | null => null
  static getServerSelection = (): readonly number[] => EMPTY_SELECTION
  static getServerCamera = (): APSCameraState | null => null
  static getServerModelLoaded = (): boolean => false
  static getServerExtensionStatuses = (): Readonly<Record<string, APSExtensionStatus>> =>
    EMPTY_EXTENSIONS

  private emit(): void {
    for (const listener of this.listeners) listener()
  }

  private scheduleCameraSnapshot(): void {
    if (this.rafId !== null) return
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null
      const viewer = this.viewer
      if (!viewer) return
      const nav = viewer.navigation
      this.camera = {
        position: { ...nav.getPosition() },
        target: { ...nav.getTarget() },
        up: { ...nav.getCameraUpVector() },
        isPerspective: nav.getCamera().isPerspective,
      }
      this.emit()
    })
  }
}
