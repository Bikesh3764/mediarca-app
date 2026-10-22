# ADR 001: Adoption of Apple Human Interface Guidelines Design Tokens

## Status
Accepted

## Context
MediArca's web application adheres to a clean, gallery-like Apple Human Interface Guidelines aesthetic (`DESIGN.md`). The mobile application must deliver a tactile, high-density, touch-optimized native mobile experience on both Android and iOS without visual chaos or generic UI templates.

## Decision
1. **Single Action Color**: Action Blue (`#0066cc`) is reserved exclusively for interactive elements (buttons, active tabs, selected states).
2. **Alternating Canvas Rhythm**: Clean alternation between Parchment Canvas (`#f5f5f7`) and Pure White (`#ffffff`) surfaces.
3. **Touch Target Rule**: Strictly enforce a minimum touch target size of 44x44 physical points (`TouchTarget.minSize = 44`) on all buttons, tabs, inputs, and clickable badges.
4. **Full Pill Action Buttons**: All primary action buttons use full pill rounding (`borderRadius: 9999`) with subtle tactile press feedback.

## Consequences
- Guaranteed zero touch fatigue or accidental mis-clicks on mobile touchscreens.
- High visual discipline and brand consistency across both web and mobile platforms.
