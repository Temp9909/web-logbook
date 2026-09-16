import { alpha } from '@mui/material/styles';
import { apple, fontFamily } from '../themePrimitives';

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
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.background.default,
        backgroundImage: theme.palette.mode === 'dark'
          ? 'radial-gradient(900px 520px at 82% -12%, rgba(10,132,255,.18), transparent 65%), radial-gradient(760px 540px at 15% 105%, rgba(191,90,242,.10), transparent 67%)'
          : 'radial-gradient(900px 520px at 82% -12%, rgba(0,122,255,.13), transparent 65%), radial-gradient(760px 540px at 15% 105%, rgba(175,82,222,.09), transparent 67%)',
        backgroundAttachment: 'fixed',
      },
      '#root': { minHeight: '100vh' },
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
      '::selection': { backgroundColor: alpha(theme.palette.primary.main, 0.25) },
    }),
  },

  MuiAppBar: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: ({ theme }) => {
        const c = apple(theme.palette.mode);
        return {
          minHeight: 58,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(35,35,39,.88)' : 'rgba(255,255,255,.82)',
          backgroundImage: 'none',
          color: theme.palette.text.primary,
          backdropFilter: 'saturate(180%) blur(24px)',
          WebkitBackdropFilter: 'saturate(180%) blur(24px)',
          borderBottom: `1px solid ${c.separator}`,
          boxShadow: '0 1px 0 rgba(0,0,0,.04)',
        };
      },
    },
  },

  MuiToolbar: {
    styleOverrides: {
      root: { minHeight: 58, '@media (min-width:600px)': { minHeight: 58 } },
    },
  },

  MuiDrawer: {
    styleOverrides: {
      paper: ({ theme }) => {
        const c = apple(theme.palette.mode);
        return {
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(28,28,31,.86)' : 'rgba(246,246,248,.78)',
          backgroundImage: 'none',
          backdropFilter: 'saturate(180%) blur(24px)',
          WebkitBackdropFilter: 'saturate(180%) blur(24px)',
          borderRight: `1px solid ${c.separator}`,
          boxShadow: 'inset -1px 0 rgba(255,255,255,.2)',
        };
      },
    },
  },

  MuiPaper: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: { backgroundImage: 'none' },
      rounded: { borderRadius: 14 },
      outlined: ({ theme }) => ({ border: `1px solid ${apple(theme.palette.mode).separator}` }),
    },
  },

  MuiCard: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 16,
        border: `1px solid ${apple(theme.palette.mode).separator}`,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(35,35,39,.72)' : 'rgba(255,255,255,.78)',
        backgroundImage: 'none',
        backdropFilter: 'saturate(165%) blur(18px)',
        WebkitBackdropFilter: 'saturate(165%) blur(18px)',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 16px 40px rgba(0,0,0,.24), 0 1px 2px rgba(0,0,0,.32)'
          : '0 10px 35px rgba(0,0,0,.065), 0 1px 2px rgba(0,0,0,.045)',
        transition: 'box-shadow 180ms ease, transform 180ms ease',
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
        borderRadius: 14,
        border: `1px solid ${apple(theme.palette.mode).separator}`,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(35,35,39,.78)' : 'rgba(255,255,255,.82)',
        overflow: 'hidden',
        '&::before': { display: 'none' },
        '& + &': { marginTop: 10 },
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
    styleOverrides: { root: ({ theme }) => ({ borderColor: apple(theme.palette.mode).separator }) },
  },
};
