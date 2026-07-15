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

export const ThemeSchema = withFallback(Schema.String, "light");
export const LanguageSchema = withFallback(Schema.String, "en");
export const CurrencySchema = withFallback(Schema.String, "USD");
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
