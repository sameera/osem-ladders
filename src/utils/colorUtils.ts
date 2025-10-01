/**
 * Calculates gradient color based on position in a sequence
 * Uses blue -> yellow -> purple gradient
 * @param index - Current position (0-based)
 * @param total - Total number of items
 * @returns RGB color string
 */
export function getGradientColor(index: number, total: number): string {
  const position = index / (total - 1); // 0 to 1

  if (position <= 0.5) {
    // Blue to Yellow (first half)
    const ratio = position * 2; // 0 to 1
    const r = Math.round(37 + (234 - 37) * ratio);   // 37 (blue) to 234 (yellow)
    const g = Math.round(99 + (179 - 99) * ratio);   // 99 (blue) to 179 (yellow)
    const b = Math.round(235 + (8 - 235) * ratio);   // 235 (blue) to 8 (yellow)
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Yellow to Purple (second half)
    const ratio = (position - 0.5) * 2; // 0 to 1
    const r = Math.round(234 + (147 - 234) * ratio); // 234 (yellow) to 147 (purple)
    const g = Math.round(179 + (51 - 179) * ratio);  // 179 (yellow) to 51 (purple)
    const b = Math.round(8 + (234 - 8) * ratio);     // 8 (yellow) to 234 (purple)
    return `rgb(${r}, ${g}, ${b})`;
  }
}