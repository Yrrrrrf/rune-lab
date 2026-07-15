import { Schema } from "effect";

export const withFallback = <A, I>(
  schema: Schema.Schema<A, I, never>,
  fallback: A,
): Schema.Schema<A, unknown, never> =>
  Schema.transform(Schema.Unknown, schema, {
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
  });

// fallow-ignore-next-line unused-export
export const ThemeSchema = withFallback(Schema.String, "light");

// fallow-ignore-next-line unused-export
export const LanguageSchema = withFallback(Schema.String, "en");

// fallow-ignore-next-line unused-export
export const CurrencySchema = withFallback(Schema.String, "USD");

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
): Schema.Schema<unknown, unknown, never> {
  if (key === "theme") {
    return ThemeSchema as unknown as Schema.Schema<unknown, unknown, never>;
  }
  if (key === "language") {
    return LanguageSchema as unknown as Schema.Schema<unknown, unknown, never>;
  }
  if (key === "currency") {
    return CurrencySchema as unknown as Schema.Schema<unknown, unknown, never>;
  }
  if (key === "contributions") {
    return ContributionsSchema as unknown as Schema.Schema<
      unknown,
      unknown,
      never
    >;
  }
  return withFallback(Schema.Any, fallback) as unknown as Schema.Schema<
    unknown,
    unknown,
    never
  >;
}
