# Dark quiz editor design

## Intent
Make quiz creation resemble the supplied reference while retaining CheckMate's dark theme.

## Scope and constraints
Show section-grouped question navigation and completion status alongside the active question form. Keep existing question types, section controls, quiz tools, validation, and responsive access. Preserve the current server actions, database schema, APIs, and data contracts. Ask the user before any backend change.

## Approaches
1. Restructure the existing editor presentation around its current data and server actions. This keeps the existing behavior and is the selected approach.
2. Build a separate editor and duplicate the flow. This would increase maintenance and risk divergence from existing functionality.

## Implementation
Use the existing question identifiers and form actions, with a dark sidebar and a focused editing panel. Adapt the layout for smaller screens and maintain keyboard access and clear status labels. Verify the question form and navigation, run existing tests and lint, and inspect the result where the environment permits.
