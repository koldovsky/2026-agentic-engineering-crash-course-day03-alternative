## ADDED Requirements

### Requirement: Honest import member defaults
New machine-import defaults SHALL use a neutral Local user attribution instead of
guessing a human from the server's OS account. For an already imported stable machine,
defaults SHALL retain its original portable attribution to allow repeat collection.
Loading defaults SHALL NOT scan transcript directories. Import settings SHALL explain
the difference between member attribution and the provider application.

#### Scenario: Fresh defaults
- **WHEN** defaults are requested before the machine has been imported
- **THEN** the member is Local user regardless of the server OS account and no
  transcript directory is scanned

#### Scenario: Existing machine defaults
- **WHEN** defaults are requested for a machine already present in the ledger
- **THEN** its original member and computer attribution are reused, independently
  of local display names, and repeated import remains idempotent
