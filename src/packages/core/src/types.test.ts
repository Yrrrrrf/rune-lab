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
  }
});
