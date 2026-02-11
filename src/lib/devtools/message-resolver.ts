// sdk/devtools/src/patterns/message-resolver.ts

/**
 * Dynamic i18n Message Resolver Pattern
 *
 * Enables dynamic message function calls for config selectors.
 * Creates a resolver that dynamically looks up and calls message functions.
 */

type MessageBundle = Record<string, (...args: any[]) => string>;

interface MessageResolverConfig<T> {
  /**
   * Function to extract the message key from an option
   * @example (currency) => currency.code // "USD"
   */
  keyExtractor: (option: T) => string;

  /**
   * Optional transformer for the key before message lookup
   * @example (key) => key.toLowerCase() // "USD" -> "usd"
   */
  keyTransformer?: (key: string) => string;
}

/**
 * Creates a message resolver function for dynamic i18n lookups
 *
 * @example
 * ```typescript
 * const getCurrencyLabel = createMessageResolver<Currency>(m, {
 *   keyExtractor: (currency) => currency.code
 * });
 *
 * getCurrencyLabel({ code: "EUR", symbol: "€" }); // "Euro"
 * ```
 */
export function createMessageResolver<T>(
  messages: MessageBundle,
  config: MessageResolverConfig<T>,
) {
  return (option: T): string => {
    const key = config.keyExtractor(option);
    const transformedKey = config.keyTransformer
      ? config.keyTransformer(key)
      : key;

    const messageFn = messages[transformedKey];

    if (!messageFn || typeof messageFn !== "function") {
      if (import.meta.env.DEV) {
        console.warn(
          `[MessageResolver] Missing translation for key: "${transformedKey}"`,
        );
      }
      return key; // Fallback to key
    }

    return messageFn();
  };
}

/**
 * Type guard to check if a message key exists
 */
export function hasMessage(messages: MessageBundle, key: string): boolean {
  return key in messages && typeof messages[key] === "function";
}

/**
 * Batch resolver for multiple options at once
 */
export function batchResolveMessages<T>(
  messages: MessageBundle,
  options: T[],
  config: MessageResolverConfig<T>,
): Record<string, string> {
  const resolver = createMessageResolver(messages, config);

  return options.reduce((acc, option) => {
    const key = config.keyExtractor(option);
    acc[key] = resolver(option);
    return acc;
  }, {} as Record<string, string>);
}
