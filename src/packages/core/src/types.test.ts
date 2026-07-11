import type { Kernel } from "./mod.ts";

Deno.test("compile-time type assertions", () => {
  // Wrap type checks in a function that is never executed at runtime
  // but is fully type-checked at compile time.
  function _typeChecks() {
    const kernel: Kernel = null as unknown as Kernel;

    // Valid assignments should compile
    const _theme: string = kernel.getCell("theme");
    const _lang: string = kernel.getCell("language");
    const _curr: string = kernel.getCell("currency");
    const _contribs: Record<string, readonly unknown[]> = kernel.getCell(
      "contributions",
    );

    // Avoid unused variable warnings
    const _ = { _theme, _lang, _curr, _contribs };

    // @ts-expect-error - theme expects string, not number
    kernel.setCell("theme", 123);

    // @ts-expect-error - language expects string, not number
    kernel.setCell("language", 123);

    // @ts-expect-error - currency expects string, not number
    kernel.setCell("currency", 123);

    // @ts-expect-error - contributions expects Record<string, readonly unknown[]>, not number
    kernel.setCell("contributions", 123);

    // @ts-expect-error - unknown cell name should fail
    kernel.getCell("invalid_cell_name");

    // @ts-expect-error - unknown cell name should fail on set
    kernel.setCell("invalid_cell_name", "value");
  }
});
