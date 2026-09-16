import { alpha } from '@mui/material/styles';
import { apple, brand } from '../themePrimitives';

/**
 * Apple-style controls: pill/soft-rounded buttons, "capsule" fields with a
 * focus ring instead of a heavy border, and the iOS toggle switch.
 */
export const inputsCustomizations = {
  MuiButtonBase: {
    defaultProps: { disableRipple: true },
    styleOverrides: {
      root: {
        transition: 'background-color 160ms ease, color 160ms ease, transform 120ms ease, box-shadow 160ms ease',
        '&:active': { transform: 'scale(0.97)' },
      },
    },
  },

  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 980, // Apple capsule button
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: '-0.005em',
        padding: '7px 18px',
        minHeight: 34,
        boxShadow: 'none',
        '&:hover': { boxShadow: 'none' },
        [theme.breakpoints.down('sm')]: { padding: '6px 14px' },
      }),
      sizeSmall: { minHeight: 28, padding: '4px 14px', fontSize: '0.8125rem' },
      sizeLarge: { minHeight: 44, padding: '10px 26px', fontSize: '1rem' },
      contained: ({ theme }) => ({
        backgroundColor: theme.palette.primary.main,
        color: '#FFFFFF',
        '&:hover': {
          backgroundColor: theme.palette.mode === 'dark' ? brand[400] : brand[600],
        },
        '&.Mui-disabled': {
          backgroundColor: alpha(theme.palette.primary.main, 0.35),
          color: alpha('#FFFFFF', 0.7),
        },
      }),
      outlined: ({ theme }) => ({
        borderColor: alpha(theme.palette.primary.main, 0.4),
        '&:hover': {
          borderColor: theme.palette.primary.main,
          backgroundColor: alpha(theme.palette.primary.main, 0.06),
        },
      }),
      text: ({ theme }) => ({
        padding: '6px 12px',
        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) },
      }),
    },
  },

  MuiIconButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 8,
        color: theme.palette.text.secondary,
        '&:hover': {
          backgroundColor: apple(theme.palette.mode).fill,
          color: theme.palette.text.primary,
        },
      }),
    },
  },

  MuiToggleButtonGroup: {
    styleOverrides: {
      root: ({ theme }) => ({
        // iOS segmented control
        backgroundColor: apple(theme.palette.mode).fill,
        borderRadius: 9,
        padding: 2,
        gap: 2,
      }),
    },
  },

  MuiToggleButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        border: 0,
        borderRadius: '7px !important',
        textTransform: 'none',
        fontWeight: 500,
        color: theme.palette.text.primary,
        padding: '4px 12px',
        '&.Mui-selected': {
          backgroundColor: theme.palette.mode === 'dark' ? '#636366' : '#FFFFFF',
          boxShadow: theme.shadows[1],
          fontWeight: 600,
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' ? '#6E6E73' : '#FFFFFF',
          },
        },
      }),
    },
  },

  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => {
        const c = apple(theme.palette.mode);
        return {
          borderRadius: 9,
          backgroundColor: theme.palette.mode === 'dark' ? c.fill : '#FFFFFF',
          transition: 'box-shadow 150ms ease, border-color 150ms ease',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: c.separator,
            transition: 'border-color 150ms ease',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.mode === 'dark' ? 'rgba(235,235,245,0.35)' : 'rgba(60,60,67,0.35)',
          },
          '&.Mui-focused': {
            // Apple focus ring
            boxShadow: `0 0 0 3.5px ${alpha(theme.palette.primary.main, 0.28)}`,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
              borderWidth: 1,
            },
          },
          '&.Mui-error.Mui-focused': {
            boxShadow: `0 0 0 3.5px ${alpha(theme.palette.error.main, 0.28)}`,
          },
        };
      },
      input: {
        '&::placeholder': { opacity: 0.55 },
      },
    },
  },

  MuiInputLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        letterSpacing: '-0.005em',
        '&.Mui-focused': { color: theme.palette.primary.main },
      }),
    },
  },

  MuiFormLabel: {
    styleOverrides: {
      root: { fontWeight: 500 },
    },
  },

  MuiSwitch: {
    styleOverrides: {
      root: {
        // iOS-style toggle — 63×28pt
        width: 63,
        height: 28,
        padding: 0,
        overflow: 'visible',
      },
      switchBase: ({ theme }) => ({
        padding: 2,
        transitionDuration: '260ms',
        '&.Mui-checked': {
          transform: 'translateX(35px)',
          color: '#FFFFFF',
          '& + .MuiSwitch-track': {
            backgroundColor: theme.palette.mode === 'dark' ? '#30D158' : '#34C759',
            opacity: 1,
            border: 0,
          },
        },
        '&.Mui-focusVisible + .MuiSwitch-track': {
          boxShadow: `0 0 0 3.5px ${alpha(theme.palette.primary.main, 0.3)}`,
        },
        '&.Mui-disabled + .MuiSwitch-track': { opacity: 0.4 },
      }),
      thumb: {
        boxSizing: 'border-box',
        width: 24,
        height: 24,
        backgroundColor: '#FFFFFF',
        boxShadow: '0 3px 8px rgba(0,0,0,0.15), 0 1px 1px rgba(0,0,0,0.16)',
      },
      track: ({ theme }) => ({
        borderRadius: 28 / 2,
        backgroundColor: theme.palette.mode === 'dark' ? '#39393D' : '#E9E9EA',
        opacity: 1,
        transition: 'background-color 260ms ease',
      }),
      sizeSmall: {
        width: 40,
        height: 24,
        '& .MuiSwitch-thumb': { width: 20, height: 20 },
        '& .MuiSwitch-switchBase.Mui-checked': { transform: 'translateX(16px)' },
        '& .MuiSwitch-track': { borderRadius: 12 },
      },
    },
  },

  MuiCheckbox: {
    defaultProps: { disableRipple: true },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 6,
        color: theme.palette.mode === 'dark' ? 'rgba(235,235,245,0.4)' : 'rgba(60,60,67,0.35)',
        '&.Mui-checked': { color: theme.palette.primary.main },
      }),
    },
  },

  MuiRadio: {
    defaultProps: { disableRipple: true },
    styleOverrides: {
      root: ({ theme }) => ({
        '&.Mui-checked': { color: theme.palette.primary.main },
      }),
    },
  },

  MuiSlider: {
    styleOverrides: {
      root: { height: 4 },
      thumb: {
        width: 22,
        height: 22,
        backgroundColor: '#FFFFFF',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        '&:hover, &.Mui-focusVisible': { boxShadow: '0 2px 10px rgba(0,0,0,0.28)' },
      },
      rail: ({ theme }) => ({
        opacity: 1,
        backgroundColor: apple(theme.palette.mode).fillStrong,
      }),
    },
  },

  MuiChip: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 980,
        fontWeight: 500,
        letterSpacing: '-0.005em',
        backgroundColor: apple(theme.palette.mode).fill,
        border: 0,
      }),
      outlined: ({ theme }) => ({
        border: `1px solid ${apple(theme.palette.mode).separator}`,
        backgroundColor: 'transparent',
      }),
      sizeSmall: { height: 22, fontSize: '0.75rem' },
    },
  },

  MuiAutocomplete: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: 12,
        marginTop: 6,
        border: `1px solid ${apple(theme.palette.mode).separator}`,
        boxShadow: theme.shadows[8],
      }),
      option: {
        borderRadius: 7,
        margin: '2px 6px',
        minHeight: 34,
      },
    },
  },
};
