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
        backgroundColor: theme.palette.background.default,
      },
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
          backgroundColor: c.materialBar,
          backgroundImage: 'none',
          color: theme.palette.text.primary,
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: `1px solid ${c.separator}`,
          boxShadow: 'none',
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
          backgroundColor: c.materialSidebar,
          backgroundImage: 'none',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderRight: `1px solid ${c.separator}`,
          boxShadow: 'none',
        };
      },
    },
  },

  MuiPaper: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: { backgroundImage: 'none' },
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
        boxShadow: 'none',
        transition: 'box-shadow 200ms ease, transform 200ms ease',
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
