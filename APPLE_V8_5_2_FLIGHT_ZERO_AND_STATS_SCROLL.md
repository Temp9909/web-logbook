# V8.5.2 — Flight-time zero values and Stats By Type scrolling

- In **Flight time → Operational and pilot function time** only, zero durations (`0:00` / `00:00`) are displayed as empty Apple time pickers (`-- : --`).
- Zero durations from this Flight time card are normalized to an empty value before create/update, so saving does not persist `00:00`. Departure/arrival clock times are unchanged.
- The time picker keeps a local draft so `00:30` can still be entered naturally even though a completed `00:00` is treated as empty.
- In **Stats → By type**, the aircraft type column is no longer sticky during horizontal scrolling; it scrolls with the rest of the logbook table and no longer overlays other columns.
