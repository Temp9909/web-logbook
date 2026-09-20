# Apple V8 — exact structural implementation

This build implements the approved standalone Apple preview as real React screen structure.
It does not rely on the former `apple-legacy-page` MUI camouflage layer for the converted routes.

Structurally rebuilt routed screens:
- New flight / flight record
- Add rating / rating details
- Map
- Aircrafts
- Airports: standard list, DB source, custom airports
- Persons and person detail
- Attachments
- Export A4
- Import CSV, mapping, options and progress
- Settings: General, Previous flight experience, Logbook signature, Standard fields, Custom fields

Preserved because already approved:
- Main Logbook
- Stats
- Licensing list

Implementation notes:
- Converted screens use native React/HTML forms, native tables and native modals.
- Existing backend HTTP APIs and React Query cache are used for data/actions.
- MUI X DataGrid is not used by the rebuilt routed screens.
- The previous body-level `apple-legacy-page` CSS bridge is no longer activated by DashboardPageContent.
- Currency remains removed from navigation/router.
