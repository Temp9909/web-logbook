# V8.6.7 — Configurable On/Off switch color

- Adds `Settings -> General -> Appearance -> On / Off switch color`.
- Includes Apple-style preset colors plus a custom color picker.
- Applies globally to native Apple switches, legacy OptionSwitch controls, and MUI switches such as Stats Dashboard Options.
- Persists the selected color in backend settings as `switch_color`.
- Existing databases need no migration: an empty/missing value falls back to the existing Apple green.
