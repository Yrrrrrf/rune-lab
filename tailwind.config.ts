import containerQueries from '@tailwindcss/container-queries';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';
import daisyui from 'daisyui';

import availableThemes from "./src/lib/theme/index";

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {}
  },

  plugins: [
    typography, 
    forms, 
    containerQueries,
    daisyui,
  ],

  daisyui: {
    themes: [...availableThemes.availableThemes],
    themeRoot: ":root",
    styled: true,
    utils: true,
    logs: true,
    base: true,
    prefix: "",
  }

} satisfies Config;
