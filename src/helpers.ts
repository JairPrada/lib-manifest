import type { MFManifest, MFModule, MFManifestInput } from "./types";
import { MFModuleSchema } from "./schemas";

/**
 * defineManifest: wraps the manifest object with full TypeScript inference.
 * Use this in each MF's manifest.ts so the component names become literal types.
 */
export function defineManifest<const T extends MFManifestInput>(m: T): T {
  return m;
}

/**
 * validateManifest: called by the composer after dynamic-importing a remote MF.
 * Throws if the module doesn't export `mount`, `unmount`, and `manifest`.
 */
export function validateManifest(mod: unknown): asserts mod is MFModule {
  const result = MFModuleSchema.safeParse(mod);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Module does not conform to MFModule contract:\n${issues}`,
    );
  }
}
