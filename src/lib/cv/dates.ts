/**
 * Date presentation helper for the website. Dates are free-text strings
 * (e.g. "May 2022 -- Present"); the LaTeX path keeps its own `--` (TeX renders
 * that as an en-dash), while the web normalises any separator — `--`, hyphen,
 * or em-dash — to a typographic en-dash.
 */
export function displayDates(dates: string): string {
  return dates.replace(/\s*(?:--|–|—|-)\s*/g, ' – ');
}
