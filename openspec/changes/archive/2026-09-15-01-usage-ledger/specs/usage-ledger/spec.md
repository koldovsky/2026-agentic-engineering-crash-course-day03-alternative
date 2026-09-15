## Purpose

Provide durable, consistent token accounting across providers and team machines,
with transparent estimated pricing and repeatable aggregation.

## ADDED Requirements

### Requirement: Disjoint usage accounting
The system SHALL validate nonnegative integer token buckets and count reasoning
as part of output, not extra tokens. Every record SHALL have machine attribution.

#### Scenario: Reasoning is included once
- **WHEN** usage has 100 input, 40 cache-read, 10 cache-write, 5 one-hour writes,
  20 output and 12 reasoning tokens
- **THEN** the total is 175 tokens

#### Scenario: Invalid tokens or references
- **WHEN** a record has negative/fractional tokens, reasoning greater than output,
  an invalid date, unknown properties or an undeclared machine
- **THEN** validation rejects the bundle

### Requirement: Durable idempotent storage
The system SHALL persist normalized data and atomically reject conflicting records.

#### Scenario: Repeat import and restart
- **WHEN** an identical bundle is merged twice and the database is reopened
- **THEN** usage exists once and prompts and attribution are preserved

#### Scenario: Conflicting immutable record
- **WHEN** a bundle includes a new record and a conflicting existing identity
- **THEN** no records from that bundle are saved

### Requirement: Transparent estimates
The system SHALL use exact-model rate entries with source and snapshot date and
SHALL report unknown pricing separately from priced costs.

#### Scenario: Known model
- **WHEN** one million fresh tokens use claude-sonnet-4-6 at $3 per million
- **THEN** estimated API cost is $3 and not labeled subscription spend

#### Scenario: Unknown model
- **WHEN** a usage record names an unrecognized model
- **THEN** tokens remain included and its cost is unpriced

### Requirement: Consistent filtered summaries
The system SHALL aggregate the same filtered records by UTC day, member and model.

#### Scenario: Combined filters
- **WHEN** provider, member, model and inclusive UTC date bounds are selected
- **THEN** every summary uses only records satisfying all selected filters

#### Scenario: Empty data and demo isolation
- **WHEN** no matching local records exist
- **THEN** totals are zero and synthetic demo data is available separately without
  insertion into the local database
