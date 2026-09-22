## Why

The user spotted provider marks sitting below the center of their rounded boxes.
Existing behavior/overflow tests passed and page screenshots were reviewed, but
no focused visual acceptance check caught the defect. The user asks for a quality
process that catches this during implementation and can be taught in day04.

## What Changes

- Replace font-dependent provider glyphs with shared, centered decorative SVGs.
- Verify actual artwork alignment at desktop and 375px; inspect component crops.
- Demonstrate that the alignment assertion detects an intentional 4px offset.
- Add a concrete visual review gate to project rules and the workshop quality guide.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard`: consistently aligned provider marks across models and badges.

## Impact

Small React/CSS correction, targeted browser checks, local review instructions
and workshop guidance. No usage, import, pricing or storage changes. These remain
provisional provider symbols; no claim of official logo or reference-design fidelity.
