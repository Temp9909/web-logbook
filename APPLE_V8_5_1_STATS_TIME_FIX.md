# V8.5.1 — Stats time fix

Fixes `e.split is not a function` in Stats > By year and Stats > By type/category.
Aggregated stats store durations as numeric minutes, while raw flights use `HH:MM` strings.
The shared time converter now supports both representations and the Apple Stats table formats numeric minutes back to `HH:MM`.
