# Episodic Memory — design-system-agent

One entry per completed task: what was done, what was learned, in the form
"did X, hit Y, resolved by Z". Populated only via the Reflect step
(AGENT_FRAMEWORK.md §6) after a real task — not pre-filled.

## Phase 0 — mascot slicing + token extraction (2026-08-26)

Sliced `assets/image/mascot.png` (2x2 sheet, 1254x1254, quadrants 627x627)
into four mood sprites (`neutral`, `thinking`, `celebrating`, `resting`) with
`scripts/slice-mascot.mjs`. No PIL/ImageMagick available in the environment —
used `sharp` instead (had to install it as a root devDependency; environment
had no image tooling preinstalled at all).

Background removal: a global brightness threshold would have eaten into the
character's cream-colored fur (also very light). Used flood-fill starting
from the four image borders instead — only pixels *connected* to the border
and close to white become transparent, so isolated light regions inside the
character (fur highlights, the yellow star, light paw pads) survive untouched
because they aren't contiguously connected to the border region. Verified two
ways: alpha-channel sampling (`corner alpha=0`, `center alpha=255`) and
visual inspection of all four output PNGs via the Read tool — the alpha check
alone would not have caught a bad crop, only the visual check confirmed no
white halo or bitten edge.

Derived the entire color palette (`primary`, `accent`, `background`, etc. in
both `tailwind.config.js` and `tokens.ts`) from actual pixel values sampled
out of the mascot artwork (purple ears/hoodie ~`#7B6BD6`, yellow star
`#FFD764`, warm cream background `#FAF7F2`) rather than picking colors from
imagination. This is the standard to hold future palette changes to.

Deliberately did not add `react-native-svg` for a circular growth-progress
ring around the mascot — used a row of five dot indicators (stage) plus a
plain percentage `Text` (growthProgress) instead, to avoid a new native
dependency before there was a second real need for SVG rendering.
