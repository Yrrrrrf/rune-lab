import containerQueries from '@tailwindcss/container-queries';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';
import daisyui from 'daisyui';

import { availableThemes, customThemes } from './src/lib/stores/theme';

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
    themes: [...availableThemes, customThemes],
    themeRoot: ":root",
    styled: true,
    utils: true,
    logs: true,
    base: true,
    prefix: "",
  }

} satisfies Config;
