export interface MFPropDeclaration {
  name: string;
  type: "string" | "number" | "boolean" | "function" | "object" | "array";
  required: boolean;
  description?: string;
  schema?: Record<string, unknown>;
}

export interface MFComponentDeclaration {
  name: string;
  description?: string;
  props: MFPropDeclaration[];
}

export interface MFEventDeclaration {
  event: string;
  description?: string;
  direction: "emits" | "listens";
  payload: Record<string, { type: string; description?: string }>;
}

export interface MFManifest {
  $schema?: string;
  name: string;
  version: string;
  description?: string;
  framework: "react" | "vue" | "angular";
  port?: number;
  readonly components: readonly MFComponentDeclaration[];
  readonly events: readonly MFEventDeclaration[];
}

export type MFManifestInput = {
  [K in keyof MFManifest]: MFManifest[K];
};

/**
 * ComponentName<Manifest>: extracts the union of component name strings from a manifest.
 *
 * Example — given a manifest typed as:
 *   { components: [{ name: "Login" }, { name: "LoginWithCredentials" }] }
 *
 * ComponentName<that manifest> === "Login" | "LoginWithCredentials"
 *
 * This is what gives the shell TypeScript autocomplete when picking a component.
 */
export type ComponentName<M extends { components: { name: string }[] }> =
  M['components'][number]['name']

export interface UniversalMF {
  /**
   * Called by the shell to render the microfrontend into `el`.
   * - `component`: which component to render (must match a name declared in the manifest)
   * - `props`: any additional properties the component needs
   */
  mount(el: HTMLElement, component: string, props: Record<string, unknown>): void | Promise<void>;
  /** Called by the shell when the MF should be removed from the DOM. */
  unmount?(el: HTMLElement): void;
}

export interface MFModule extends UniversalMF {
  manifest: MFManifest;
}
