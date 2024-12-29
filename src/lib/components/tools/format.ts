
// Foreground colors
export const fg_color = (color: string, str: string): string => `\x1b[${color}m${str}\x1b[0m`;

export const red = (str: string): string => fg_color('31', str);
export const green = (str: string): string => fg_color('32', str);
export const yellow = (str: string): string => fg_color('33', str);
export const blue = (str: string): string => fg_color('34', str);
export const magenta = (str: string): string => fg_color('35', str);
export const cyan = (str: string): string => fg_color('36', str);

// Background colors
export const bg_color = (color: string, str: string): string => `\x1b[${color}m${str}\x1b[0m`;

export const bg_red = (str: string): string => bg_color('41', str);
export const bg_green = (str: string): string => bg_color('42', str);
export const bg_yellow = (str: string): string => bg_color('43', str);
export const bg_blue = (str: string): string => bg_color('44', str);
export const bg_magenta = (str: string): string => bg_color('45', str);
export const bg_cyan = (str: string): string => bg_color('46', str);

// Styles
export const style = (style: string, str: string): string => `\x1b[${style}m${str}\x1b[0m`;

export const bold = (str: string): string => style('1', str);
export const dim = (str: string): string => style('2', str);
export const italic = (str: string): string => style('3', str);
export const underline = (str: string): string => style('4', str);
export const inverse = (str: string): string => style('7', str);
export const hidden = (str: string): string => style('8', str);
export const strikethrough = (str: string): string => style('9', str);
