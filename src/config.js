/**
 * Central constants for the Drone Battery Calculator.
 *
 * Import from here instead of scattering magic numbers through the UI or
 * the physics engine. Paths are repository-relative so a fork works from
 * any folder without rewriting developer-specific locations.
 */

export const CELL_NOMINAL_VOLTAGE = 3.7;
export const CELL_FULL_VOLTAGE = 4.2;
export const USABLE_CAPACITY_FRACTION = 0.8;
export const C_RATING_SAFETY_MARGIN = 1.2;

export const THRESHOLDS = {
  thrustToWeight: { ok: 2.0, warn: 1.5 },
  flightTimeMin: { ok: 8, warn: 4 },
  batteryPctOfAuw: { okMin: 15, okMax: 30, warnMax: 40 },
  sagPerCellV: { ok: 0.1, warn: 0.3 },
};

export const PARAMS = [
  { id: "motors", sliderMin: 3, sliderMax: 12, sliderStep: 1, defaultValue: 4, unit: "", label: "Number of motors" },
  { id: "esc", sliderMin: 5, sliderMax: 500, sliderStep: 5, defaultValue: 30, unit: "A", label: "ESC rating per motor" },
  { id: "thrust", sliderMin: 50, sliderMax: 20000, sliderStep: 50, defaultValue: 500, unit: "g", label: "Max thrust per motor" },
  { id: "hover", sliderMin: 25, sliderMax: 85, sliderStep: 1, defaultValue: 50, unit: "%", label: "Avg hover throttle" },
  { id: "cells", sliderMin: 2, sliderMax: 12, sliderStep: 1, defaultValue: 3, unit: "S", label: "Cell count (S)" },
  { id: "cap", sliderMin: 500, sliderMax: 22000, sliderStep: 100, defaultValue: 2200, unit: "mAh", label: "Capacity" },
  { id: "crate", sliderMin: 5, sliderMax: 200, sliderStep: 5, defaultValue: 30, unit: "C", label: "C-rating" },
  { id: "bwt", sliderMin: 50, sliderMax: 8000, sliderStep: 10, defaultValue: 180, unit: "g", label: "Battery weight" },
  { id: "dwt", sliderMin: 100, sliderMax: 30000, sliderStep: 50, defaultValue: 654, unit: "g", label: "Drone weight (no battery)" },
  { id: "payload", sliderMin: 0, sliderMax: 10000, sliderStep: 50, defaultValue: 0, unit: "g", label: "Payload weight" },
  { id: "ir", sliderMin: 1, sliderMax: 50, sliderStep: 0.5, defaultValue: 4, unit: "mΩ", label: "IR per cell" },
];

export const DEFAULT_INPUTS = Object.fromEntries(
  PARAMS.map((param) => [param.id, param.defaultValue]),
);

export const PATHS = {
  index: "index.html",
  styles: "src/phase2/styles.css",
  ui: "src/phase2/ui.js",
  calculator: "src/phase1/calculator.js",
  docsImages: "docs/images",
};

export function repoUrl(relativePath = "") {
  const cleaned = String(relativePath).replace(/^[\\/]+/, "");
  return cleaned ? `./${cleaned}` : "./";
}
