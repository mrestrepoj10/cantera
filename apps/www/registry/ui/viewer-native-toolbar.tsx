'use client'

import { useEffect, useRef } from 'react'
import { useAPSViewer } from '@/components/ui/aps-viewer/hooks'
import type {
  APSViewer3D,
  APSViewerExtension,
  APSViewingNamespace,
  AutodeskGlobal,
} from '@/lib/viewer-types'

export const VIEWER_NATIVE_TOOLBAR_EXTENSION_ID = 'Cantera.ViewerNativeToolbar'

export type ViewerNativeToolbarPosition = 'bottom' | 'top' | 'left' | 'right'
export type ViewerNativeToolbarScale = 'md' | 'lg'

export interface ViewerNativeToolbarOptions {
  /** Docking edge. Left and right positions derive a vertical orientation. */
  position?: ViewerNativeToolbarPosition
  /** `lg` raises native controls to a 44px minimum touch target. */
  scale?: ViewerNativeToolbarScale
}

export interface ViewerNativeToolbarProps extends ViewerNativeToolbarOptions {}

interface NativeToolbarExtension extends APSViewerExtension {
  setOptions(options: ViewerNativeToolbarOptions): void
}

const POSITION_CLASSES = [
  'cantera-toolbar--bottom',
  'cantera-toolbar--top',
  'cantera-toolbar--left',
  'cantera-toolbar--right',
] as const
const SCALE_CLASSES = ['cantera-toolbar--md', 'cantera-toolbar--lg'] as const
const STYLE_ATTRIBUTE = 'data-cantera-viewer-native-toolbar'

/**
 * Best-effort LMV 7.* styling. Autodesk does not publish a stable DOM contract
 * for the native toolbar, so these selectors are intentionally isolated behind
 * our classes and include the known tooltip and flyout shapes used by v7.
 */
export const VIEWER_NATIVE_TOOLBAR_CSS = `
.adsk-toolbar.cantera-toolbar--top,
.adsk-toolbar.cantera-toolbar--bottom,
.adsk-toolbar.cantera-toolbar--left,
.adsk-toolbar.cantera-toolbar--right {
  position: absolute !important;
  z-index: 5;
  overflow: visible;
}

.adsk-toolbar.cantera-toolbar--bottom {
  inset: auto 12px 12px 12px !important;
}

.adsk-toolbar.cantera-toolbar--top {
  inset: 12px 12px auto 12px !important;
}

.adsk-toolbar.cantera-toolbar--left,
.adsk-toolbar.cantera-toolbar--right {
  top: 50% !important;
  bottom: auto !important;
  width: auto !important;
  max-height: calc(100% - 24px);
  transform: translateY(-50%);
  flex-direction: column;
  overflow: visible;
}

.adsk-toolbar.cantera-toolbar--left {
  right: auto !important;
  left: 12px !important;
}

.adsk-toolbar.cantera-toolbar--right {
  right: 12px !important;
  left: auto !important;
}

.adsk-toolbar.cantera-toolbar--left .adsk-control-group,
.adsk-toolbar.cantera-toolbar--right .adsk-control-group {
  display: flex;
  flex-direction: column;
  width: auto;
  height: auto;
  overflow: visible;
}

.adsk-toolbar.cantera-toolbar--lg .adsk-button {
  min-width: 44px;
  min-height: 44px;
}

.adsk-toolbar.cantera-toolbar--lg .adsk-control-group {
  min-height: 44px;
}

.adsk-toolbar.cantera-toolbar--left .adsk-control-tooltip,
.adsk-toolbar.cantera-toolbar--left .toolbar-vertical-group,
.adsk-toolbar.cantera-toolbar--left .toolbar-settings-sub-menu,
.adsk-toolbar.cantera-toolbar--left .toolbar-submenu,
.adsk-toolbar.cantera-toolbar--left .explode-submenu {
  top: 50% !important;
  right: auto !important;
  bottom: auto !important;
  left: calc(100% + 10px) !important;
  transform: translateY(-50%) !important;
}

.adsk-toolbar.cantera-toolbar--right .adsk-control-tooltip,
.adsk-toolbar.cantera-toolbar--right .toolbar-vertical-group,
.adsk-toolbar.cantera-toolbar--right .toolbar-settings-sub-menu,
.adsk-toolbar.cantera-toolbar--right .toolbar-submenu,
.adsk-toolbar.cantera-toolbar--right .explode-submenu {
  top: 50% !important;
  right: calc(100% + 10px) !important;
  bottom: auto !important;
  left: auto !important;
  transform: translateY(-50%) !important;
}
`

let stylesheetConsumers = 0
const registeredManagers = new WeakSet<object>()

function retainStylesheet(): void {
  stylesheetConsumers += 1
  if (document.head.querySelector(`style[${STYLE_ATTRIBUTE}]`)) return
  const style = document.createElement('style')
  style.setAttribute(STYLE_ATTRIBUTE, '')
  style.textContent = VIEWER_NATIVE_TOOLBAR_CSS
  document.head.appendChild(style)
}

function releaseStylesheet(): void {
  stylesheetConsumers = Math.max(0, stylesheetConsumers - 1)
  if (stylesheetConsumers === 0) {
    document.head.querySelector(`style[${STYLE_ATTRIBUTE}]`)?.remove()
  }
}

function normalizeOptions(
  options: ViewerNativeToolbarOptions = {},
): Required<ViewerNativeToolbarOptions> {
  return {
    position: options.position ?? 'bottom',
    scale: options.scale ?? 'md',
  }
}

function removeToolbarClasses(viewer: APSViewer3D): void {
  viewer.toolbar?.container.classList.remove(...POSITION_CLASSES, ...SCALE_CLASSES)
}

/** Register the extension once for the active Autodesk Viewer runtime. */
export function registerViewerNativeToolbar(autodesk: AutodeskGlobal): void {
  const viewing = autodesk.Viewing
  const manager = viewing.theExtensionManager
  if (registeredManagers.has(manager)) return
  if (manager.getExtensionClass?.(VIEWER_NATIVE_TOOLBAR_EXTENSION_ID)) {
    registeredManagers.add(manager)
    return
  }

  class CanteraViewerNativeToolbar extends viewing.Extension implements NativeToolbarExtension {
    private current = normalizeOptions()
    private hasStylesheet = false

    constructor(viewer: APSViewer3D, options?: Record<string, unknown>) {
      super(viewer, options)
      this.current = normalizeOptions(options as ViewerNativeToolbarOptions | undefined)
    }

    load(): boolean {
      retainStylesheet()
      this.hasStylesheet = true
      if (this.viewer.toolbar) this.onToolbarCreated()
      return true
    }

    onToolbarCreated(): void {
      this.apply()
    }

    setOptions(options: ViewerNativeToolbarOptions): void {
      this.current = normalizeOptions(options)
      this.apply()
    }

    unload(): boolean {
      removeToolbarClasses(this.viewer)
      if (this.hasStylesheet) {
        releaseStylesheet()
        this.hasStylesheet = false
      }
      return true
    }

    private apply(): void {
      const toolbar = this.viewer.toolbar?.container
      if (!toolbar) return
      toolbar.classList.remove(...POSITION_CLASSES, ...SCALE_CLASSES)
      toolbar.classList.add(
        `cantera-toolbar--${this.current.position}`,
        `cantera-toolbar--${this.current.scale}`,
      )
    }
  }

  manager.registerExtension(
    VIEWER_NATIVE_TOOLBAR_EXTENSION_ID,
    CanteraViewerNativeToolbar as APSViewingNamespace['Extension'],
  )
  registeredManagers.add(manager)
}

/**
 * Load and configure the native-toolbar extension for the closest APSViewer.
 * The extension is unloaded automatically with the component.
 */
export function useViewerNativeToolbar(options: ViewerNativeToolbarOptions = {}): void {
  const { viewer } = useAPSViewer()
  const position = options.position ?? 'bottom'
  const scale = options.scale ?? 'md'
  const optionsRef = useRef<Required<ViewerNativeToolbarOptions>>({ position, scale })
  optionsRef.current = { position, scale }

  useEffect(() => {
    if (!viewer || !window.Autodesk) return
    let cancelled = false
    registerViewerNativeToolbar(window.Autodesk)
    viewer
      .loadExtension(VIEWER_NATIVE_TOOLBAR_EXTENSION_ID, optionsRef.current)
      .then((extension) => {
        if (cancelled) {
          viewer.unloadExtension(VIEWER_NATIVE_TOOLBAR_EXTENSION_ID)
          return
        }
        const nativeToolbar = extension as NativeToolbarExtension
        nativeToolbar.setOptions(optionsRef.current)
      })
      .catch((error) => {
        if (!cancelled) console.error('cantera: failed to load the native toolbar extension', error)
      })

    return () => {
      cancelled = true
      try {
        viewer.unloadExtension(VIEWER_NATIVE_TOOLBAR_EXTENSION_ID)
      } catch {
        // The parent viewer may already be finished; cleanup is best-effort.
      }
    }
  }, [viewer])

  useEffect(() => {
    if (!viewer) return
    const extension = viewer.getExtension(
      VIEWER_NATIVE_TOOLBAR_EXTENSION_ID,
    ) as NativeToolbarExtension | null
    extension?.setOptions({ position, scale })
  }, [viewer, position, scale])
}

/** Declarative native-toolbar configuration. Render inside an APSViewer. */
export function ViewerNativeToolbar({
  position = 'bottom',
  scale = 'md',
}: ViewerNativeToolbarProps) {
  useViewerNativeToolbar({ position, scale })
  return null
}
