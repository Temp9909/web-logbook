import { alpha } from '@mui/material/styles';
import { apple } from '../themePrimitives';

/**
 * Feedback: iOS-style alerts, centered sheets with a blurred backdrop,
 * and capsule progress indicators.
 */
export const feedbackCustomizations = {
  MuiAlert: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 12,
        color: theme.palette.text.primary,
        border: `1px solid ${apple(theme.palette.mode).separator}`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[2],
        letterSpacing: '-0.005em',
      }),
      standardSuccess: ({ theme }) => ({
        backgroundColor: alpha(theme.palette.success.main, 0.12),
        borderColor: alpha(theme.palette.success.main, 0.25),
      }),
      standardError: ({ theme }) => ({
        backgroundColor: alpha(theme.palette.error.main, 0.12),
        borderColor: alpha(theme.palette.error.main, 0.25),
      }),
      standardWarning: ({ theme }) => ({
        backgroundColor: alpha(theme.palette.warning.main, 0.14),
        borderColor: alpha(theme.palette.warning.main, 0.28),
      }),
      standardInfo: ({ theme }) => ({
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        borderColor: alpha(theme.palette.primary.main, 0.22),
      }),
      icon: { alignItems: 'center' },
    },
  },

  MuiDialog: {
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiBackdrop-root': {
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.28)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        },
        '& .MuiDialog-paper': {
          borderRadius: 16,
          border: `1px solid ${apple(theme.palette.mode).separator}`,
          backgroundImage: 'none',
          boxShadow: theme.shadows[24],
        },
      }),
    },
  },

  MuiDialogTitle: {
    styleOverrides: {
      root: ({ theme }) => ({
        fontSize: theme.typography.pxToRem(17),
        fontWeight: 600,
        letterSpacing: '-0.012em',
        paddingBottom: 8,
      }),
    },
  },

  MuiDialogActions: {
    styleOverrides: {
      root: { padding: '12px 20px 18px', gap: 8 },
    },
  },

  MuiSnackbarContent: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 12,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(58,58,60,0.92)' : 'rgba(28,28,30,0.9)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }),
    },
  },

  MuiLinearProgress: {
    styleOverrides: {
      root: ({ theme }) => ({
        height: 6,
        borderRadius: 980,
        backgroundColor: apple(theme.palette.mode).fillStrong,
      }),
      bar: { borderRadius: 980 },
    },
  },

  MuiSkeleton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 8,
        backgroundColor: apple(theme.palette.mode).fill,
      }),
    },
  },
};
