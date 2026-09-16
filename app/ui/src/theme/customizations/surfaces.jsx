import { alpha } from '@mui/material/styles';
import { apple, fontFamily } from '../themePrimitives';

/**
 * Surfaces: translucent "materials" (blurred toolbar and sidebar),
 * grouped-style cards and macOS-like sheets.
 */
export const surfacesCustomizations = {
  MuiCssBaseline: {
    styleOverrides: (theme) => ({
      html: {
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
      },
      body: {
        fontFamily,
        background: `radial-gradient(900px 500px at 80% -10%, ${alpha(theme.palette.primary.main, 0.13)}, transparent 65%), radial-gradient(700px 500px at 15% 100%, ${alpha('#AF52DE', 0.09)}, transparent 65%), ${theme.palette.background.default}`,
        backgroundAttachment: 'fixed',
      },
      '#root': { height: '100%' },

      // Discreet, overlay-style scrollbars
      '*::-webkit-scrollbar': { width: 10, height: 10 },
      '*::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
      '*::-webkit-scrollbar-thumb': {
        borderRadius: 8,
        border: '3px solid transparent',
        backgroundClip: 'content-box',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(235,235,245,0.25)' : 'rgba(60,60,67,0.25)',
      },
      '*::-webkit-scrollbar-thumb:hover': {
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(235,235,245,0.4)' : 'rgba(60,60,67,0.4)',
      },
      '::selection': {
        backgroundColor: alpha(theme.palette.primary.main, 0.25),
      },
    }),
  },

  MuiAppBar: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: ({ theme }) => {
        const c = apple(theme.palette.mode);
        return {
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(35,35,39,0.88)' : 'rgba(255,255,255,0.82)',
          backgroundImage: 'none',
          color: theme.palette.text.primary,
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: `1px solid ${c.separator}`,
          boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
        };
      },
    },
  },

  MuiToolbar: {
    styleOverrides: {
      root: { minHeight: 52, '@media (min-width:600px)': { minHeight: 52 } },
    },
  },

  MuiDrawer: {
    styleOverrides: {
      paper: ({ theme }) => {
        const c = apple(theme.palette.mode);
        return {
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(35,35,39,0.70)' : 'rgba(255,255,255,0.68)',
          backgroundImage: 'none',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderRight: `1px solid ${c.separator}`,
          boxShadow: 'inset -1px 0 rgba(255,255,255,0.28)',
        };
      },
    },
  },

  MuiPaper: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundImage: 'none',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(35,35,39,0.88)' : 'rgba(255,255,255,0.82)',
        backdropFilter: 'saturate(180%) blur(22px)',
        WebkitBackdropFilter: 'saturate(180%) blur(22px)',
      }),
      rounded: { borderRadius: 12 },
      outlined: ({ theme }) => ({
        border: `1px solid ${apple(theme.palette.mode).separator}`,
      }),
    },
  },

  MuiCard: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 14,
        border: `1px solid ${apple(theme.palette.mode).separator}`,
        backgroundColor: theme.palette.background.paper,
        backgroundImage: 'none',
        boxShadow: theme.shadows[2],
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(35,35,39,0.88)' : 'rgba(255,255,255,0.82)',
        backdropFilter: 'saturate(180%) blur(22px)',
        WebkitBackdropFilter: 'saturate(180%) blur(22px)',
        transition: 'box-shadow 180ms ease, transform 180ms ease',
        '&:hover': { boxShadow: theme.shadows[3] },
      }),
    },
  },

  MuiTableContainer: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 14,
        border: `1px solid ${apple(theme.palette.mode).separator}`,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(35,35,39,0.88)' : 'rgba(255,255,255,0.82)',
        backdropFilter: 'saturate(180%) blur(22px)',
        WebkitBackdropFilter: 'saturate(180%) blur(22px)',
        boxShadow: theme.shadows[2],
        overflow: 'auto',
      }),
    },
  },

  MuiCardContent: {
    styleOverrides: {
      root: { padding: 16, '&:last-child': { paddingBottom: 16 } },
    },
  },

  MuiAccordion: {
    defaultProps: { elevation: 0, disableGutters: true },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 12,
        border: `1px solid ${apple(theme.palette.mode).separator}`,
        backgroundColor: theme.palette.background.paper,
        overflow: 'hidden',
        '&::before': { display: 'none' },
        '& + &': { marginTop: 8 },
      }),
    },
  },

  MuiAccordionSummary: {
    styleOverrides: {
      root: ({ theme }) => ({
        minHeight: 48,
        '&:hover': { backgroundColor: apple(theme.palette.mode).fill },
      }),
    },
  },

  MuiDivider: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderColor: apple(theme.palette.mode).separator,
      }),
    },
  },
};
