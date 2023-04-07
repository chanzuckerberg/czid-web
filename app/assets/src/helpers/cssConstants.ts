// We should use scss files where possible.
// However, some of our older components have inline styles that use strings.
// i.e. app/assets/src/components/visualizations/TidyTree.ts
// The linter stops us from using the same string in multiple places.
// This file is to avoid having to create the same constants in multiple files.

export const FILL_OPACITY = "fill-opacity";
export const FONT_WEIGHT = "font-weight";
export const TEXT_ANCHOR = "text-anchor";
export const TRANSFORM = "transform";
export const TRANSLATE = "translate";
