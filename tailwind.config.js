// import { availableThemes } from "./src/lib/core/theme/constants.ts"

/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{html,js,svelte,ts}"],
	theme: {
		extend: {},
	},
	plugins: [
		require("@tailwindcss/typography"),
		require("@tailwindcss/forms"),
	],
	// daisyui: {
	//   themes: [...availableThemes.availableThemes],
	//   utils: true,
	//   logs: true,
	// }
};
