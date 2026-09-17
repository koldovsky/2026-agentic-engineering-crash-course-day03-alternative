## Context

Model icons currently contain Unicode glyphs at 22px with inherited line-height 1.5
inside 28px squares. Grid centers the 33px line box, not the painted glyph. Existing
browser checks capture pages and test behavior/overflow but not artwork alignment.

## Goals / Non-Goals

Fix the displayed defect and establish reviewable visual evidence. No brand
redesign, image generation, new dependencies, imported data reads or numeric changes.

## Decisions

- Share a server-compatible ProviderMark SVG component between model boxes and
  ProviderBadge. Keep the existing star/diamond symbolism and colors. SVG uses a
  balanced 24-unit viewBox, explicit 20px/12px sizes, currentColor, aria-hidden and
  focusable=false. Container layout is independent of line-height.
- Browser tests use only synthetic demo. Compare the artwork group's getBBox
  transformed by getScreenCTM to the parent slot center; test both axes, containment
  and both size variants at 1280px/375px. Checking only SVG viewport dimensions
  would miss off-center artwork. This is an appropriate concrete regression check
  because the user-reported defect escaped general screenshot review.
- Capture small component crops and page context. Root and independent checker
  inspect crops at actual size; geometry is not a universal optical quality oracle.
- Fault injection is in the isolated test browser only: translate artwork down4px,
  observe the same assertion reject the offset, remove transform and pass. No live
  app mutation and no automatic screenshot-baseline approval.
- Add a persistent project rule requiring a separate visual pass for UI changes,
  including representative shared components, actual-size crops, concrete findings
  and explicit limits. Workshop guide explains functional/layout/optical checks and
  maker/checker responsibilities. Evidence template gains visual-review fields.

## Risks / Trade-offs

Balanced SVG geometry removes font variability; subjective optical balance still
requires visual judgment. Screenshots describe this Chromium/Windows environment,
not every browser. Tiny provider symbols remain provisional, not official logos.

## Verification / Rollout

Required check/build and targeted visual browser scenarios. Document actual
geometry, controlled-fault detection and screenshot inspection. Restart local
production app after verification. Leave previous changes and real data intact.
