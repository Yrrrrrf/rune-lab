// Type definitions
export interface ThemeConfig {
    name: string;
    value: string;
    icon: string;
    description?: string;
}

// Comprehensive theme configuration
export const THEMES_CONFIG = {
    light: { icon: '🌞', description: 'Clean, light mode appearance' },
    dark: { icon: '🌙', description: 'Sleek dark mode interface' },
    cupcake: { icon: '🧁', description: 'Sweet pastel colors' },
    bumblebee: { icon: '🐝', description: 'Sharp black and yellow' },
    emerald: { icon: '💚', description: 'Lush green and neutral tones' },
    corporate: { icon: '🏢', description: 'Professional and modern' },
    synthwave: { icon: '🌆', description: 'Retro-futuristic vibrant style' },
    retro: { icon: '📺', description: 'Nostalgic vintage look' },
    cyberpunk: { icon: '🤖', description: 'High-tech, neon aesthetic' },
    valentine: { icon: '💝', description: 'Soft romantic theme' },
    halloween: { icon: '🎃', description: 'Spooky orange and black' },
    garden: { icon: '🌷', description: 'Fresh natural colors' },
    forest: { icon: '🌲', description: 'Deep woodland tones' },
    aqua: { icon: '💧', description: 'Cool aquatic colors' },
    lofi: { icon: '🎵', description: 'Minimalist and calm' },
    pastel: { icon: '🎨', description: 'Soft pastel palette' },
    fantasy: { icon: '🔮', description: 'Mystical and enchanting' },
    wireframe: { icon: '📝', description: 'Simple black and white' },
    black: { icon: '⚫', description: 'Monochrome dark theme' },
    luxury: { icon: '👑', description: 'Elegant gold and black' },
    dracula: { icon: '🧛', description: 'Dark vampire-inspired' },
    cmyk: { icon: '🖨️', description: 'Print-inspired colors' },
    autumn: { icon: '🍂', description: 'Warm autumn colors' },
    business: { icon: '💼', description: 'Clean business look' },
    acid: { icon: '🧪', description: 'Bright neon colors' },
    lemonade: { icon: '🍋', description: 'Fresh citrus theme' },
    night: { icon: '🌃', description: 'Dark nighttime colors' },
    coffee: { icon: '☕', description: 'Warm coffee tones' },
    winter: { icon: '❄️', description: 'Cool winter colors' },
    dim: { icon: '🔅', description: 'Dimmed light theme' },
    nord: { icon: '❄️', description: 'Arctic color palette' },
    sunset: { icon: '🌅', description: 'Warm sunset colors' }
} as const;

// Export theme names for DaisyUI configuration
export const availableThemes = Object.keys(THEMES_CONFIG);

// Custom themes can be added here
export const customThemes = {
    // Example custom theme
    mytheme: {
        primary: "#a991f7",
        secondary: "#f6d860",
        accent: "#37cdbe",
        neutral: "#3d4451",
        "base-100": "#ffffff",
    }
};