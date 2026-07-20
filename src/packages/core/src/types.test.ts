import { contribute, defineContribution } from "./forge/define-contribution.ts";
import { definePlugin } from "./mod.ts";

Deno.test("compile-time type assertions", () => {
  function _typeChecks() {
    definePlugin({
      id: "test",
      slots: {
        theme: {
          create: () => "light",
          // @ts-expect-error - hand-written contextKey should fail to compile in slot spec
          contextKey: Symbol("theme"),
        },
      },
    });

    interface ExpectedItem {
      foo: string;
    }
    const testKey = defineContribution<ExpectedItem>("test-key");

    // positive case: compiles when item matches ExpectedItem
    const _positive = contribute(testKey, { foo: "hello" });

    // negative case: fails when item does not match ExpectedItem
    // @ts-expect-error - wrong item type should fail to compile
    const _negative = contribute(testKey, { foo: 123 });
  }
});
