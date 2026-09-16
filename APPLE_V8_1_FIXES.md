# Apple V8.1 targeted fixes

- Persons: null-safe person rendering and corrected associated-flight field mapping (`log_uuid`, flat departure/arrival/total_time data).
- Airports: removed from the main sidebar and moved into Settings > Airports. `/airports` now redirects there.
- Airports: standard-airport directory is capped to 30 visible matching rows with search and a fixed-height scroll area, instead of rendering the full database.
- Attachments: rebuilt the global Attachments screen with search, selected-row preview, flight navigation, individual download, filtered ZIP download, delete, and optional KML track reset.
- Attachment preview: native Apple UI for PDF, images, text/CSV/JSON/XML, and a generic fallback for unsupported file types.

The existing Logbook and Stats design is unchanged.
