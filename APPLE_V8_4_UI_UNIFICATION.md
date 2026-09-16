APPLE V8.4 — UI unification

Changes:
- All single-choice dropdowns now use the same native Apple-style select language as Filter > Period.
- New/Edit Flight Registration, Type, PIC name and Flight role use the same dropdown component.
- Aircrafts list replaces Edit buttons with iOS-style chevrons; the whole row opens editing.
- Logbook now supports 10 / 25 / 50 / 100 rows per page, page numbers, previous/next navigation and result counts.
- Stats > By year / By type / By category were rebuilt as native Apple/EASA-style tables matching the main Logbook visual language.
- Stats native tables keep search and CSV export; MUI X DataGrid is no longer used on those three pages.

Validation:
- 262 JS/JSX/TS/TSX files parsed with TypeScript parser: 0 syntax errors.
- Full npm/Vite build was not run because npm offline cache is missing zstddec 0.2.0.
