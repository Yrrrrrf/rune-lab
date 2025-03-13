import { availableThemes } from "./src/lib/core/theme/constants.ts"

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
      extend: {},
    },
    plugins: [
      require('@tailwindcss/typography'),
      require('@tailwindcss/forms'),
      require('daisyui')
    ],
    daisyui: {
      themes: [...availableThemes.availableThemes],
      // themes: true, // This enables all themes
    }
  }
