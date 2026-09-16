# Apple Exact V3

This version treats `apple-reference.html` as the visual source of truth.

The React application now uses the CSS extracted directly from that HTML reference and reproduces its shell and primary views instead of approximating them through the previous MUI dashboard layout.

Main changes:
- exact 232 px translucent sidebar from the HTML
- exact 52 px top bar from the HTML
- exact page spacing, typography, cards, pills and segmented controls
- Logbook rebuilt with the HTML EASA table structure
- real logbook data is mapped into the HTML table
- real search and All/PIC/IFR/Night filters
- real flight row navigation
- real Export and New flight navigation
- Licensing rebuilt with the grouped HTML list style and real licence data
- Stats dashboard rebuilt with the HTML tiles/bar layout and real logbook data
- light/dark mode uses the same CSS variables as the HTML

The backend and API routes remain unchanged.
