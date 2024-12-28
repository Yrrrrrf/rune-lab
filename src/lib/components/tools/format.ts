
export const color = (color: string, str: string): string => `\x1b[${color}m${str}\x1b[0m`;

export const red = (str: string): string => color('31', str);
export const green = (str: string): string => color('32', str);
export const yellow = (str: string): string => color('33', str);
export const blue = (str: string): string => color('34', str);
export const magenta = (str: string): string => color('35', str);
export const cyan = (str: string): string => color('36', str);
