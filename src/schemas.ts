import { z } from "zod";

export const MFPropSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "number", "boolean", "function", "object", "array"]),
  required: z.boolean(),
  description: z.string().optional(),
  schema: z.record(z.unknown()).optional(),
});

export const MFComponentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  props: z.array(MFPropSchema),
});

const MFEventPayloadSchema: z.ZodType<
  Record<string, { type: string; description?: string }>
> = z.record(
  z.object({
    type: z.string(),
    description: z.string().optional(),
  }),
);

export const MFEventSchema = z.object({
  event: z.string(),
  description: z.string().optional(),
  direction: z.enum(["emits", "listens"]),
  payload: MFEventPayloadSchema,
});

export const MFManifestSchema = z.object({
  $schema: z.string().optional(),
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  framework: z.enum(["react", "vue", "angular"]),
  port: z.number().optional(),
  components: z.array(MFComponentSchema),
  events: z.array(MFEventSchema),
});

export const MFModuleSchema = z.object({
  // mount receives: the DOM element, the component name, and optional props
  mount: z.function().args(z.any(), z.string(), z.record(z.unknown())).returns(z.any()),
  unmount: z.function().optional(),
  manifest: MFManifestSchema,
});
