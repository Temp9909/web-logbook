import { alpha } from '@mui/material/styles';
import { svgIconClasses } from '@mui/material/SvgIcon';
import { typographyClasses } from '@mui/material/Typography';
import { buttonBaseClasses } from '@mui/material/ButtonBase';
import { iconButtonClasses } from '@mui/material/IconButton';
import { apple } from '../themePrimitives';

/**
 * Lists and tables in the Apple "grouped list" spirit: no vertical rules,
 * hairline separators, roomy rows.
 */
export const dataDisplayCustomizations = {
  MuiList: {
    styleOverrides: {
      root: {
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      },
    },
  },
  MuiListItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        [`& .${svgIconClasses.root}`]: {
          width: '1.15rem',
          height: '1.15rem',
          color: theme.palette.text.secondary,
        },
        [`& .${typographyClasses.root}`]: {
          fontWeight: 500,
          letterSpacing: '-0.005em',
        },
        [`& .${buttonBaseClasses.root}`]: {
          display: 'flex',
          gap: 10,
          padding: '4px 10px',
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.26 : 0.12),
            [`& .${svgIconClasses.root}`]: {
              color: theme.palette.primary.main,
            },
            [`& .${typographyClasses.root}`]: { fontWeight: 600 },
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.32 : 0.16),
            },
          },
          '&:focus-visible': {
            backgroundColor: 'transparent',
            outline: `2px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            outlineOffset: 1,
          },
        },
      }),
    },
  },
  MuiListItemText: {
    styleOverrides: {
      primary: ({ theme }) => ({
        fontSize: theme.typography.body2.fontSize,
        fontWeight: 500,
        letterSpacing: '-0.005em',
      }),
      secondary: ({ theme }) => ({
        fontSize: theme.typography.caption.fontSize,
        color: theme.palette.text.secondary,
      }),
    },
  },
  MuiListItemIcon: {
    styleOverrides: {
      root: {
        minWidth: 0,
        justifyContent: 'center',
      },
    },
  },
  MuiListSubheader: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: 'transparent',
        color: theme.palette.text.secondary,
        fontSize: '0.6875rem',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        lineHeight: 2.4,
      }),
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderBottom: `1px solid ${apple(theme.palette.mode).separator}`,
        letterSpacing: '-0.005em',
      }),
      head: ({ theme }) => ({
        fontWeight: 600,
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: theme.palette.text.secondary,
        backgroundColor: 'transparent',
      }),
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: ({ theme }) => ({
        '&:hover': { backgroundColor: apple(theme.palette.mode).fill },
        '&:last-of-type td': { borderBottom: 0 },
      }),
    },
  },
  MuiTablePagination: {
    styleOverrides: {
      root: ({ theme }) => ({ color: theme.palette.text.secondary }),
      actions: {
        display: 'flex',
        gap: 6,
        marginRight: 6,
        [`& .${iconButtonClasses.root}`]: {
          minWidth: 0,
          width: 32,
          height: 32,
        },
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: apple(theme.palette.mode).fillStrong,
        color: theme.palette.text.primary,
        fontWeight: 600,
      }),
    },
  },
  MuiBadge: {
    styleOverrides: {
      badge: { fontWeight: 600, fontSize: '0.6875rem', borderRadius: 980 },
    },
  },
  MuiPaginationItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 8,
        fontWeight: 500,
        '&.Mui-selected': {
          backgroundColor: theme.palette.primary.main,
          color: '#FFFFFF',
          '&:hover': { backgroundColor: theme.palette.primary.dark },
        },
      }),
    },
  },
};
