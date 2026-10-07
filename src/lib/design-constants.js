// Design constants for UI components (redesign v2).
// Sizes, timings and colours that come from the Claude Design mockups
// (docs/design/Nexo Projects.dc.html) and are not Tailwind tokens. Keep new
// component constants here instead of inlining magic numbers.

/**
 * Docked side panel (components/layout/SidePanel.tsx).
 * Mirrors nexo-design-pipeline/src/core/side-panel.js + assets/css/panels.css.
 */
export const SIDE_PANEL = Object.freeze({
  /** Width on first visit, px (design 4a run history) */
  defaultWidth: 280,
  /** Narrowest width a drag can leave it at, px */
  minWidth: 220,
  /** Widest it can be, as a fraction of the window width */
  maxWidthFraction: 0.45,
  /** Released narrower than this while dragging → the panel hides */
  collapseWidth: 120,
  /** Grab width of the resize grip on the panel's edge, px */
  dividerWidth: 12,
  /** The fold line shown when the hidden panel's edge is approached, px */
  foldLineWidth: 5,
  foldLineHeight: 96,
  /** Hover area at the screen edge that reveals the fold line, px */
  revealZoneWidth: 14,
  revealZoneHeight: 200,
  /** Open / close animation, ms */
  transitionMs: 220,
  /** localStorage key prefix; the panel's storageKey is appended */
  storagePrefix: 'ui_panel_',
})

/** Status dot colours in run lists (design 4a). */
export const RUN_STATUS_DOT = Object.freeze({
  running: '#E0894A',
  pending: '#E0894A',
  failed: '#FF7A5C',
  active: '#5FBE6D',
  completed: '#8D99AC',
})

/** Floating panels anchored to a button (design 4a). */
export const POPOVER = Object.freeze({
  /** "New run" options */
  newRunWidth: 340,
  /** Research solution references */
  referencesWidth: 420,
})
