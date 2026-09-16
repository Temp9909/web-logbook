import { alpha } from '@mui/material/styles';
import { apple } from '../themePrimitives';

export const dataGridCustomizations = {
  MuiDataGrid: {
    styleOverrides: {
      root: ({ theme }) => {
        const c = apple(theme.palette.mode);
        return {
          border: 0,
          borderRadius: 14,
          backgroundColor: 'transparent',
          color: theme.palette.text.primary,
          fontSize: '0.8125rem',
          letterSpacing: '-0.005em',
          '--DataGrid-rowBorderColor': c.separator,
          '& .MuiDataGrid-main': { borderRadius: 14 },
          '& .MuiDataGrid-columnHeaders': {
            borderBottom: `1px solid ${c.separator}`,
            backgroundColor: 'transparent',
          },
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: 'transparent',
            borderRight: 0,
            paddingInline: 8,
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.045em',
            textTransform: 'uppercase',
            color: theme.palette.text.secondary,
          },
          '& .MuiDataGrid-columnSeparator': { display: 'none' },
          '& .MuiDataGrid-cell': {
            borderRight: 0,
            borderBottom: `1px solid ${c.separator}`,
            paddingInline: 8,
          },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-row:hover, & .MuiDataGrid-row:hover .MuiDataGrid-cell': {
            backgroundColor: `${c.fill} !important`,
          },
          '& .MuiDataGrid-row.Mui-selected, & .MuiDataGrid-row.Mui-selected .MuiDataGrid-cell': {
            backgroundColor: `${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.24 : 0.10)} !important`,
          },
          '& .MuiDataGrid-row.Mui-selected:hover, & .MuiDataGrid-row.Mui-selected:hover .MuiDataGrid-cell': {
            backgroundColor: `${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.30 : 0.14)} !important`,
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: `1px solid ${c.separator}`,
            minHeight: 46,
          },
          '& .MuiDataGrid-toolbarContainer': {
            minHeight: 52,
            padding: '8px 10px',
            gap: 4,
            borderBottom: `1px solid ${c.separator}`,
          },
          '& .MuiDataGrid-overlay': { backgroundColor: 'transparent' },
        };
      },
    },
  },
};
