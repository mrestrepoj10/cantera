import type { APSCameraState, APSViewer3D } from '@/lib/viewer-types'

type Listener = () => void

const EMPTY_SELECTION: readonly number[] = Object.freeze([])

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

  /** Server snapshots for useSyncExternalStore — stable, empty values. */
  static getServerViewer = (): APSViewer3D | null => null
  static getServerSelection = (): readonly number[] => EMPTY_SELECTION
  static getServerCamera = (): APSCameraState | null => null
  static getServerModelLoaded = (): boolean => false

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
