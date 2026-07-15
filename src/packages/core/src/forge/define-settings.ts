import { Schema } from "effect";

export interface SettingsFieldSchema {
  id: string; // e.g. "pluginId.fieldId"
  label: string;
  type: "select" | "toggle" | "text" | "number" | "range" | "color" | "custom";
  component?: unknown;
  options?: { value: unknown; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  target:
    | { type: "cell"; name: string }
    | { type: "store"; storeId: string; property: string }
    | { type: "callback" };
}

export interface SettingsSchema {
  id: string;
  label: string;
  icon?: string;
  fields: SettingsFieldSchema[];
}

const TargetSchema = Schema.Union(
  Schema.Struct({
    type: Schema.Literal("cell"),
    name: Schema.String,
  }),
  Schema.Struct({
    type: Schema.Literal("store"),
    storeId: Schema.String,
    property: Schema.String,
  }),
  Schema.Struct({
    type: Schema.Literal("callback"),
  }),
);

const SettingsFieldSchemaStruct = Schema.Struct({
  id: Schema.String,
  label: Schema.String,
  type: Schema.Literal(
    "select",
    "toggle",
    "text",
    "number",
    "range",
    "color",
    "custom",
  ),
  component: Schema.optional(Schema.Any),
  options: Schema.optional(
    Schema.Array(
      Schema.Struct({
        value: Schema.Any,
        label: Schema.String,
      }),
    ),
  ),
  min: Schema.optional(Schema.Number),
  max: Schema.optional(Schema.Number),
  step: Schema.optional(Schema.Number),
  target: TargetSchema,
});

const SettingsSchemaStruct = Schema.Struct({
  id: Schema.String,
  label: Schema.String,
  icon: Schema.optional(Schema.String),
  fields: Schema.Array(SettingsFieldSchemaStruct),
});

export function defineSettings(schema: SettingsSchema): SettingsSchema {
  const validated = Schema.decodeUnknownSync(SettingsSchemaStruct)(schema);
  return Object.freeze(validated) as SettingsSchema;
}
