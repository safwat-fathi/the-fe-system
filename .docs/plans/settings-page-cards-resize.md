## Summary
- The section selector cards in `app/(pages)/settings/page.tsx` currently have generous padding, wide grids, and large icon/text sizes, so they occupy too much space and prevent other content from fitting comfortably.
- We need to reduce their visual footprint—smaller padding, balanced typography, tighter icon size, and responsive grid tweaks—while keeping the layout clean and modern.

## Plan
1. Adjust the card grid to allow more columns on larger screens (e.g., 4 columns on xl) and reduce gaps so more cards fit across.
2. Update card styling: shrink padding, icon size, heading/subtext sizes, and apply consistent height constraints to keep cards compact.
3. Verify responsiveness to ensure cards remain legible on mobile while providing a denser, orderly layout on desktop.

