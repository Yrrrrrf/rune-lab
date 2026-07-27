import { assertEquals, assertExists } from "@std/assert";
import { defineSettings } from "./define-settings.ts";

Deno.test("defineSettings - options thunk is not called at define time", () => {
	const schema = defineSettings({
		id: "test",
		label: "Test Settings",
		fields: [
			{
				id: "test.select",
				label: "Select Field",
				type: "select",
				options: () => {
					throw new Error("Thunk executed too early!");
				},
				target: { type: "callback" },
			},
		],
	});

	assertExists(schema);
	assertEquals(schema.fields[0].id, "test.select");
});
