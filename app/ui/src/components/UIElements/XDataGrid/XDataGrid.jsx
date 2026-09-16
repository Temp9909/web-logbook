import { useMemo, useDeferredValue, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { useLocalStorageState, CODEC_JSON } from '../../../hooks/useLocalStorageState';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import XPagination from './XPagination';
import XFooter from './XFooter';
import XToolbar from './XToolbar';
import XToolbarColumnsPanel from './XToolbarColumnsPanel';
import XToolbarFilterPanel from './XToolbarFilterPanel';
import { FilterProvider, useFilter } from './FilterContext';
import Box from '@mui/material/Box';
import { styled, alpha } from '@mui/material/styles';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const defaultPageSizeOptions = [5, 10, 15, 20, 25, 50, 75, 100, { value: -1, label: 'All' }]
const defaultPageSize = defaultPageSizeOptions[3]

const toMinutes = (val) => {
  if (!val || typeof val !== 'string') return null;
  const parts = val.split(':');
  if (parts.length !== 2) return null;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
};

const StyledDataGrid = styled(DataGrid)(({ theme }) => {
  const isLight = theme.palette.mode === 'light';
  // Apple hairline separator + subtle fill
  const separator = isLight ? 'rgba(60, 60, 67, 0.18)' : 'rgba(84, 84, 88, 0.60)';
  const fill = isLight ? 'rgba(116, 116, 128, 0.08)' : 'rgba(120, 120, 128, 0.20)';
  const accent = theme.palette.primary.main;
  const tint = (a) => alpha(accent, a);

  return {
    border: 0,
    borderRadius: 14,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    fontFamily: theme.typography.fontFamily,
    fontSize: '0.8125rem',
    letterSpacing: '-0.005em',
    WebkitFontSmoothing: 'antialiased',

    // Column headers - quiet, uppercase, no vertical rules
    '& .MuiDataGrid-columnHeaders': {
      borderBottom: `1px solid ${separator}`,
    },
    '& .MuiDataGrid-columnHeader': {
      backgroundColor: 'transparent',
      borderRight: 0,
    },
    '& .MuiDataGrid-columnHeaderTitle': {
      fontSize: '0.6875rem',
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: theme.palette.text.secondary,
    },
    '& .MuiDataGrid-columnSeparator': { display: 'none' },

    '& .MuiDataGrid-filler': {
      backgroundColor: 'transparent',
    },

    // Cells - horizontal hairlines only
    '& .MuiDataGrid-cell': {
      borderRight: 0,
      borderBottom: `1px solid ${separator}`,
      backgroundColor: 'transparent',
      color: theme.palette.text.primary,
    },

    // Row hover / selection use the system accent tint
    '& .MuiDataGrid-row:hover, & .MuiDataGrid-row:hover .MuiDataGrid-cell': {
      backgroundColor: `${fill} !important`,
    },
    '& .MuiDataGrid-row.Mui-selected, & .MuiDataGrid-row.Mui-selected .MuiDataGrid-cell': {
      backgroundColor: `${tint(isLight ? 0.10 : 0.24)} !important`,
    },
    '& .MuiDataGrid-row.Mui-selected:hover, & .MuiDataGrid-row.Mui-selected:hover .MuiDataGrid-cell': {
      backgroundColor: `${tint(isLight ? 0.14 : 0.30)} !important`,
    },

    '& .MuiDataGrid-footerContainer': {
      borderTop: `1px solid ${separator}`,
    },

    '& .MuiPaginationItem-root': {
      borderRadius: 8,
    },

    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
      outline: 'none',
    },
  };
});


const XDataGridContent = ({ apiRef, tableId, rows, columns, ...props }) => {
  const [paginationModel, setPaginationModel] = useLocalStorageState(`${tableId}-pagination`, { pageSize: defaultPageSize, page: 0 }, { codec: CODEC_JSON });
  const [columnsState, setColumnsState] = useLocalStorageState(`${tableId}-columns`, {}, { codec: CODEC_JSON });

  const { filterModel, quickFilterModel, setQuickFilterModel } = useFilter();
  const deferredFilterModel = useDeferredValue(filterModel);

  useEffect(() => {
    if (!apiRef.current) return;

    const save = () => {
      const state = apiRef.current.exportState();
      setColumnsState(state.columns);
    };

    const unsubscribes = [
      apiRef.current.subscribeEvent('columnWidthChange', save),
      apiRef.current.subscribeEvent('columnVisibilityModelChange', save),
      apiRef.current.subscribeEvent('columnOrderChange', save),
      apiRef.current.subscribeEvent('debouncedResize', save),
    ];

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [apiRef, setColumnsState]);

  const columnMap = useMemo(() => {
    const map = new Map();
    columns.forEach(col => map.set(col.field, col));
    return map;
  }, [columns]);

  const filteredRows = useMemo(() => {
    if (!deferredFilterModel.items.length) {
      return rows;
    }

    return rows.filter((row) => {
      return deferredFilterModel.items.every((filter) => {
        const { field, operator, value } = filter;
        // const column = columns.find((col) => col.field === field);
        const column = columnMap.get(field);
        if (!column) return true;

        const rowValue = column.valueGetter ? column.valueGetter(row[field], row) : row[field];
        const type = column.columnType || column.type;

        const hasRowValue = rowValue !== null && rowValue !== undefined && rowValue !== '';

        if (operator === 'contains') {
          return String(rowValue || '').toLowerCase().includes(String(value).toLowerCase());
        }

        if (operator === 'equals') {
          if (type === 'boolean') {
            return !!rowValue === !!value;
          }
          return rowValue === value;
        }

        if (operator === '>=' || operator === '<=') {
          if (!hasRowValue) return false;

          if (type === 'number') {
            const v = Number(value);
            const rv = Number(rowValue);
            return operator === '>=' ? rv >= v : rv <= v;
          }

          if (type === 'date') {
            const v = dayjs(value);
            const rv = dayjs(rowValue);
            return operator === '>=' ? rv.isSameOrAfter(v, 'day') : rv.isSameOrBefore(v, 'day');
          }

          if (type === 'time') {
            const v = toMinutes(value);
            const rv = toMinutes(rowValue);
            if (v === null || rv === null) return true;
            return operator === '>=' ? rv >= v : rv <= v;
          }
        }

        return true;
      });
    });
  }, [rows, deferredFilterModel, columnMap]);

  useEffect(() => {
    if (props.onFilteredRowsChange) {
      props.onFilteredRowsChange(filteredRows);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredRows, props.onFilteredRowsChange]);

  const slots = useMemo(() => ({
    footer: XFooter,
    toolbar: XToolbar,
    columnsPanel: XToolbarColumnsPanel,
    filterPanel: XToolbarFilterPanel,
  }), []);

  // if pageSize is not in pageSizeOptions, add it
  if (props.pageSizeOptions && !props.pageSizeOptions.includes(paginationModel.pageSize)) {
    props.pageSizeOptions.push(paginationModel.pageSize);
    // sort pageSizeOptions
    props.pageSizeOptions.sort((a, b) => a - b);
  }

  const mergedColumnsState = useMemo(() => {
    if (!props.customColumnVisibilityModel) {
      return columnsState;
    }

    return {
      ...columnsState,
      columnVisibilityModel: {
        ...props.customColumnVisibilityModel,
        ...(columnsState?.columnVisibilityModel || {}),
      },
    };
  }, [columnsState, props.customColumnVisibilityModel]);

  return (
    <Box sx={{ borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
      <StyledDataGrid
        sx={{
          '& .MuiDataGrid-cell': { px: 0.5 },
          '& .MuiDataGrid-columnHeaderTitle': { px: 0.1 },
        }}
        key={tableId}
        apiRef={apiRef}
        rows={filteredRows}
        columns={columns}
        filterModel={quickFilterModel} // only for quick filter
        onFilterModelChange={setQuickFilterModel}
        rowHeight={38}
        density="compact"
        initialState={{ columns: mergedColumnsState, ...props.initialState }}
        // pagination
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        // filtering
        pageSizeOptions={props.pageSizeOptions || [5, 10, 15, 20, 25, 50, 75, 100, { value: -1, label: 'All' }]}
        slots={slots}
        slotProps={{
          basePagination: {
            material: {
              ActionsComponent: XPagination,
            },
          },
          footer: {
            fieldIdTotalLabel: props.footerFieldIdTotalLabel,
            showAggregationFooter: props.showAggregationFooter,
            showPagination: props.showPagination,
            showPageTotal: props.showPageTotal,
            showPreviousPagesTotal: props.showPreviousPagesTotal,
            initialValues: props.initialValues,
          },
          toolbar: { initialColumns: columns, customActions: props.customActions, title: props.title, icon: props.icon },
        }}
        showToolbar
        {...props}
      />
    </Box>
  );
};

export const XDataGrid = (props) => (
  <FilterProvider storageKey={props.tableId}>
    <XDataGridContent {...props} />
  </FilterProvider>
);

export default XDataGrid;