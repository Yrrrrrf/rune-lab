// src/lib/tools/format.ts


// * ANSI escape codes for ansi formatting in terminal
export const ansi_f = (color: string, str: string): string => `\x1b[${color}m${str}\x1b[0m`;


// Foreground colors
export const red = (str: string): string => ansi_f('31', str);
export const green = (str: string): string => ansi_f('32', str);
export const yellow = (str: string): string => ansi_f('33', str);
export const blue = (str: string): string => ansi_f('34', str);
export const magenta = (str: string): string => ansi_f('35', str);
export const cyan = (str: string): string => ansi_f('36', str);

// Background colors
export const bg_red = (str: string): string => ansi_f('41', str);
export const bg_green = (str: string): string => ansi_f('42', str);
export const bg_yellow = (str: string): string => ansi_f('43', str);
export const bg_blue = (str: string): string => ansi_f('44', str);
export const bg_magenta = (str: string): string => ansi_f('45', str);
export const bg_cyan = (str: string): string => ansi_f('46', str);

// Styles
export const bold = (str: string): string => ansi_f('1', str);
export const dim = (str: string): string => ansi_f('2', str);
export const italic = (str: string): string => ansi_f('3', str);
export const underline = (str: string): string => ansi_f('4', str);
export const inverse = (str: string): string => ansi_f('7', str);
export const hidden = (str: string): string => ansi_f('8', str);
export const strikethrough = (str: string): string => ansi_f('9', str);
