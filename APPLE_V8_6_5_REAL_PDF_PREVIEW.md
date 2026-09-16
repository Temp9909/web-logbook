# V8.6.5 — Real PDF preview

- Replaces the fake Export A4/A5 preview card with the actual generated PDF.
- Adds POST `/api/export/preview/{format}`.
- Preview uses the current unsaved A4/A5 settings without writing them to the database.
- Refresh Preview regenerates the PDF.
- Restore defaults and Save settings refresh the preview automatically.
