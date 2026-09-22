## ADDED Requirements

### Requirement: Consistently aligned provider marks
The dashboard SHALL render decorative provider marks with balanced artwork,
centered within the model icon box and their compact badge slot. Alignment SHALL
not depend on system-font glyph baselines. Visible provider text SHALL retain the
meaning while decorative marks remain hidden from assistive technology.

#### Scenario: V1 Model icon alignment
- **WHEN** synthetic Overview is rendered at desktop or 375px width
- **THEN** both provider artworks are contained by their icon boxes and their
  horizontal and vertical centers differ from the box center by at most 1 CSS px

#### Scenario: V2 Compact badge alignment
- **WHEN** provider badges appear in the dashboard
- **THEN** both marks are centered within their compact slots, have no clipping,
  and do not add duplicate accessible text

#### Scenario: V3 Visual verification evidence
- **WHEN** the correction is reviewed
- **THEN** full-page context and actual-size crops of both model marks and badge
  variants are inspected, and a controlled 4px artwork shift fails the same
  geometry assertion that passes after restoration
