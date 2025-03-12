// src/lib/theme/static.ts

export interface ThemeConfig {
	name: string;
	icon: string;
	description?: string;
}

export const STATIC_THEMES: ThemeConfig[] = [
	{ name: "light", icon: "🌞", description: "Clean, light mode appearance" },
	{ name: "dark", icon: "🌙", description: "Sleek dark mode interface" },
	{ name: "cupcake", icon: "🧁", description: "Sweet pastel colors" },
	{ name: "bumblebee", icon: "🐝", description: "Sharp black and yellow" },
	{ name: "emerald", icon: "💚", description: "Lush green and neutral tones" },
	{ name: "corporate", icon: "🏢", description: "Professional and modern" },
	{ name: "synthwave", icon: "🌆", description: "Retro-futuristic vibrant style" },
	{ name: "retro", icon: "📺", description: "Nostalgic vintage look" },
	{ name: "cyberpunk", icon: "🤖", description: "High-tech, neon aesthetic" },
	{ name: "valentine", icon: "💝", description: "Soft romantic theme" },
	{ name: "halloween", icon: "🎃", description: "Spooky orange and black" },
	{ name: "garden", icon: "🌷", description: "Fresh natural colors" },
	{ name: "forest", icon: "🌲", description: "Deep woodland tones" },
	{ name: "aqua", icon: "💧", description: "Cool aquatic colors" },
	{ name: "lofi", icon: "🎵", description: "Minimalist and calm" },
	{ name: "pastel", icon: "🎨", description: "Soft pastel palette" },
	{ name: "fantasy", icon: "🔮", description: "Mystical and enchanting" },
	{ name: "wireframe", icon: "📝", description: "Simple black and white" },
	{ name: "black", icon: "⚫", description: "Monochrome dark theme" },
	{ name: "luxury", icon: "👑", description: "Elegant gold and black" },
	{ name: "dracula", icon: "🧛", description: "Dark vampire-inspired" },
	{ name: "cmyk", icon: "🖨️", description: "Print-inspired colors" },
	{ name: "autumn", icon: "🍂", description: "Warm autumn colors" },
	{ name: "business", icon: "💼", description: "Clean business look" },
	{ name: "acid", icon: "🧪", description: "Bright neon colors" },
	{ name: "lemonade", icon: "🍋", description: "Fresh citrus theme" },
	{ name: "night", icon: "🌃", description: "Dark nighttime colors" },
	{ name: "coffee", icon: "☕", description: "Warm coffee tones" },
	{ name: "winter", icon: "❄️", description: "Cool winter colors" },
	{ name: "dim", icon: "🔅", description: "Dimmed light theme" },
	{ name: "nord", icon: "❄️", description: "Arctic color palette" },
	{ name: "sunset", icon: "🌅", description: "Warm sunset colors" },
	// { name: "uaemex", icon: "🦅", description: "UAEMEX university colors" },
];

export const availableThemes = STATIC_THEMES.map((theme) => theme.name);

export const customThemes = {
	// UAEMEX Theme (Universidad Autónoma del Estado de México)
	uaemex: {
		"primary": "#006633", // UAEMEX deep green
		"secondary": "#D4AF37", // Gold/yellow accent
		"accent": "#8C1515", // Complementary dark red
		"neutral": "#3D4451", // Dark neutral for text
		"base-100": "#FFFFFF", // White background
		"base-200": "#F2F2F2", // Light gray for contrasting areas
		"base-300": "#E5E5E5", // Slightly darker gray for borders
		"info": "#0072CE", // Informational blue
		"success": "#00843D", // Success green (slightly lighter than primary)
		"warning": "#F2C75C", // Warning yellow
		"error": "#C41E3A", // Error red

		// ^Additional customizations
		"--rounded-box": "0.5rem", // More conservative border radius
		"--rounded-btn": "0.25rem", // Conservative buttons
		"--btn-text-case": "normal", // No text transform
		"--animation-btn": "0.25s", // Faster button animations
		"--animation-input": "0.2s", // Faster input animations
		"--navbar-padding": "0.75rem", // Compact navbar
		"--border-btn": "1px", // Thin button borders
	},
};
