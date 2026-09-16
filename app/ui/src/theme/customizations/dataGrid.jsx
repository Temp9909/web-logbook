import { alpha } from '@mui/material/styles';
import { apple } from '../themePrimitives';

/**
 * MUI X DataGrid restyled as a macOS/Numbers-like table:
 * no outer border, no vertical rules, hairline row separators,
 * tinted selection and a quiet header.
 */
export const dataGridCustomizations = {
  MuiDataGrid: {
    styleOverrides: {
      root: ({ theme }) => {
        const c = apple(theme.palette.mode);
        return {
          border: `1px solid ${c.separator}`,
          borderRadius: 14,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(35,35,39,0.88)' : 'rgba(255,255,255,0.82)',
          backdropFilter: 'saturate(180%) blur(22px)',
          WebkitBackdropFilter: 'saturate(180%) blur(22px)',
          boxShadow: theme.shadows[2],
          '--DataGrid-rowBorderColor': c.separator,
          '& .MuiDataGrid-columnHeaders': { borderBottom: `1px solid ${c.separator}` },
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: 'transparent',
            borderRight: 0,
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            color: theme.palette.text.secondary,
          },
          '& .MuiDataGrid-columnSeparator': { display: 'none' },
          '& .MuiDataGrid-cell': {
            borderRight: 0,
            borderBottom: `1px solid ${c.separator}`,
          },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-row:hover': { backgroundColor: c.fill },
          '& .MuiDataGrid-row.Mui-selected': {
            backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.24 : 0.1),
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.14),
            },
          },
          '& .MuiDataGrid-footerContainer': { borderTop: `1px solid ${c.separator}` },
          '& .MuiDataGrid-overlay': { backgroundColor: 'transparent' },
        };
      },
    },
  },
};
