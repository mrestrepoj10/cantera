'use client'

import { useEffect, useRef } from 'react'
import { useAPSViewer } from '@/components/ui/aps-viewer/hooks'

const GROUP_ID = 'cantera-site-viewer-settings-group'
const BUTTON_ID = 'cantera-site-viewer-settings-button'

const SETTINGS_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block" aria-hidden="true"><line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/></svg>`

type ToolbarButton = Autodesk.Viewing.UI.Button & { container: HTMLElement }

/** Appends a settings button to the SDK's own toolbar, the way an APS
 * extension would: our control group after a divider, inheriting the
 * toolbar's position and scale. Renders nothing itself. */
export function ViewerSettingsTrigger({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { viewer } = useAPSViewer()
  const buttonRef = useRef<ToolbarButton | null>(null)
  const openRef = useRef(open)
  const toggleRef = useRef(onToggle)
  // Synced after commit, not during render — see useAPSViewerEvent.
  useEffect(() => {
    openRef.current = open
    toggleRef.current = onToggle
  })

  useEffect(() => {
    if (!viewer) return
    const viewing = window.Autodesk?.Viewing
    if (!viewing) return

    const applyState = (button: ToolbarButton, isOpen: boolean) => {
      button.setState(isOpen ? viewing.UI.Button.State.ACTIVE : viewing.UI.Button.State.INACTIVE)
      button.container.setAttribute('aria-pressed', String(isOpen))
    }

    const mount = () => {
      const toolbar = viewer.toolbar
      if (!toolbar || toolbar.getControl(GROUP_ID) || buttonRef.current) return
      const button = new viewing.UI.Button(BUTTON_ID) as ToolbarButton
      button.setToolTip('Viewer settings')
      button.icon.innerHTML = SETTINGS_ICON_SVG
      button.onClick = () => toggleRef.current()
      // LMV buttons are divs with mouse handlers only; wire up the keyboard
      // and name/role/state ourselves.
      const node = button.container
      node.setAttribute('role', 'button')
      node.setAttribute('aria-label', 'Viewer settings')
      node.tabIndex = 0
      node.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        toggleRef.current()
      })
      applyState(button, openRef.current)
      const group = new viewing.UI.ControlGroup(GROUP_ID)
      group.addClass('cantera-site-settings-group')
      group.addControl(button)
      toolbar.addControl(group)
      buttonRef.current = button
    }

    mount()
    viewer.addEventListener(viewing.TOOLBAR_CREATED_EVENT, mount)
    return () => {
      viewer.removeEventListener(viewing.TOOLBAR_CREATED_EVENT, mount)
      buttonRef.current = null
      try {
        viewer.toolbar?.removeControl(GROUP_ID)
      } catch {
        // the viewer may already be finished
      }
    }
  }, [viewer])

  useEffect(() => {
    const viewing = window.Autodesk?.Viewing
    const button = buttonRef.current
    if (!viewing || !button) return
    button.setState(open ? viewing.UI.Button.State.ACTIVE : viewing.UI.Button.State.INACTIVE)
    button.container.setAttribute('aria-pressed', String(open))
  }, [open])

  return null
}
