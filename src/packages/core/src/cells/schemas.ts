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

export const ContributionsSchema = withFallback(
  Schema.Record({
    key: Schema.String,
    value: Schema.Array(Schema.Any),
  }),
  {},
);
