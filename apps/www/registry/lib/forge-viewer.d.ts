/**
 * Ambient augmentations for `@types/forge-viewer` (Autodesk's official Viewer
 * SDK definitions, a dev dependency of the viewer-types item).
 *
 * Declarations live in this .d.ts so they can use `namespace` merging — the
 * only way to extend an ambient global namespace — without tripping
 * `@typescript-eslint/no-namespace` in projects that lint .ts sources.
 */

declare global {
  /** The CDN script defines `window.Autodesk`; it is absent until the viewer
   * loader has injected and awaited that script. */
  interface Window {
    Autodesk?: typeof Autodesk
  }

  namespace Autodesk {
    namespace Viewing {
      /** Missing from `@types/forge-viewer`: LMV 7.x settings profiles —
       * `viewer.setProfile(new Profile(ProfileSettings.AEC))`. */
      class Profile {
        constructor(settings: unknown, name?: string)
      }
      const ProfileSettings: {
        AEC: unknown
        Default: unknown
        Fluent: unknown
        Navis: unknown
      } & Record<string, unknown>
      interface Viewer3D {
        setProfile(profile: Profile, override?: boolean): boolean
      }
      interface ExtensionManager {
        getExtensionClass?(extensionId: string): unknown
      }
    }
  }
}

export {}
