export interface TextMeasurer {
  measureText(text: string, font: string): { width: number; height: number };
}
