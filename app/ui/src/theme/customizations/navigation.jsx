import { alpha } from '@mui/material/styles';
import { apple } from '../themePrimitives';

/**
 * Navigation & overlays: sidebar rows with the macOS selection pill,
 * translucent menus, dark capsule tooltips and underline-free tabs.
 */
export const navigationCustomizations = {
  MuiListItemButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 9,
        marginInline: 6,
        transition: 'background-color 140ms ease',
        padding: '8px 11px',
        '&:hover': { backgroundColor: apple(theme.palette.mode).fill },
        '&.Mui-selected': {
          backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.26 : 0.12),
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.32 : 0.16),
          },
        },
      }),
    },
  },

  MuiMenu: {
    styleOverrides: {
      paper: ({ theme }) => {
        const c = apple(theme.palette.mode);
        return {
          borderRadius: 12,
          marginTop: 6,
          minWidth: 180,
          padding: 4,
          border: `1px solid ${c.separator}`,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(44,44,46,0.82)' : 'rgba(255,255,255,0.82)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          boxShadow: theme.shadows[8],
        };
      },
      list: { padding: 0 },
    },
  },

  MuiMenuItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 7,
        minHeight: 32,
        fontSize: theme.typography.body2.fontSize,
        '&:hover': { backgroundColor: theme.palette.primary.main, color: '#FFFFFF' },
        '&:hover .MuiSvgIcon-root': { color: '#FFFFFF' },
        '&.Mui-selected': { backgroundColor: apple(theme.palette.mode).fillStrong },
      }),
    },
  },

  MuiPopover: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: 12,
        border: `1px solid ${apple(theme.palette.mode).separator}`,
        boxShadow: theme.shadows[8],
      }),
    },
  },

  MuiTooltip: {
    defaultProps: { arrow: false },
    styleOverrides: {
      tooltip: ({ theme }) => ({
        borderRadius: 9,
        padding: '6px 10px',
        fontSize: '0.75rem',
        fontWeight: 500,
        letterSpacing: '-0.003em',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(72,72,74,0.92)' : 'rgba(28,28,30,0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: theme.shadows[4],
      }),
    },
  },

  MuiTabs: {
    styleOverrides: {
      root: { minHeight: 40 },
      indicator: ({ theme }) => ({
        height: 2.5,
        borderRadius: 2,
        backgroundColor: theme.palette.primary.main,
      }),
    },
  },

  MuiTab: {
    styleOverrides: {
      root: ({ theme }) => ({
        textTransform: 'none',
        fontWeight: 500,
        minHeight: 40,
        letterSpacing: '-0.005em',
        color: theme.palette.text.secondary,
        '&.Mui-selected': { color: theme.palette.text.primary, fontWeight: 600 },
      }),
    },
  },

  MuiLink: {
    defaultProps: { underline: 'hover' },
    styleOverrides: {
      root: ({ theme }) => ({ color: theme.palette.primary.main }),
    },
  },

  MuiBreadcrumbs: {
    styleOverrides: {
      root: ({ theme }) => ({ fontSize: theme.typography.body2.fontSize }),
    },
  },
};
