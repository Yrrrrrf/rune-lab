// deno-lint-ignore-file no-explicit-any
import { Schema } from "effect";

// fallow-ignore-next-line unused-export
export const withFallback = <A, I>(
  schema: Schema.Schema<A, I, never>,
  fallback: A,
): Schema.Schema<A, unknown, never> =>
  Schema.transform(
    Schema.Unknown,
    schema,
    {
      strict: false,
      decode: (input) => {
        try {
          return Schema.decodeUnknownSync(schema)(input);
        } catch {
          return fallback;
        }
      },
      encode: (val) => {
        try {
          return Schema.encodeSync(schema)(val as never);
        } catch {
          return val;
        }
      },
    },
  );

// fallow-ignore-next-line unused-export
export const ThemeSchema = withFallback(
  Schema.String,
  "light",
);

// fallow-ignore-next-line unused-export
export const LanguageSchema = withFallback(
  Schema.String,
  "en",
);

// fallow-ignore-next-line unused-export
export const CurrencySchema = withFallback(
  Schema.String,
  "USD",
);

// fallow-ignore-next-line unused-export
export const ContributionsSchema = withFallback(
  Schema.Record({
    key: Schema.String,
    value: Schema.Array(Schema.Any),
  }),
  {},
);

export function getCellSchema(
  key: string,
  fallback: unknown,
): Schema.Schema<any, any, never> {
  if (key === "theme") return ThemeSchema;
  if (key === "language") return LanguageSchema;
  if (key === "currency") return CurrencySchema;
  if (key === "contributions") return ContributionsSchema;
  return withFallback(Schema.Any, fallback);
}
