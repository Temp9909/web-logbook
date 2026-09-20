import { useMemo } from 'react';
import { useGridApiRef } from '@mui/x-data-grid';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import XDataGrid from '../UIElements/XDataGrid/XDataGrid';
import {
  createColumn,
  createDateColumn,
  createLandingColumn,
  createTimeColumn,
  sumTime,
} from './helpers';
import NewFlightRecordButton from './NewFlightRecordButton';
import useSettings from '../../hooks/useSettings';
import TableHeader from '../UIElements/TableHeader';
import CSVExportButton from '../UIElements/CSVExportButton';
import PDFExportButton from './PDFExportButton';

const isFSTDRecord = (row) => Boolean(row?.sim?.type || row?.sim?.time);

const groupHeader = (title) => <TableHeader title={title} />;

export const LogbookTable = ({ data, isLoading, ...props }) => {
  const apiRef = useGridApiRef();
  const { settings, isSettingsLoading, paginationOptions } = useSettings();

  const columns = useMemo(() => {
    if (isSettingsLoading) return [];

    return [
      // AMC1 FCL.050 - column 1
      createDateColumn({
        field: 'date',
        headerName: 'DATE (dd/mm/yy)',
        width: 96,
        displayFormat: 'DD/MM/YY',
        getValue: (_value, row) => (isFSTDRecord(row) ? null : row.date),
      }),

      // column 2 - departure
      createColumn({ field: 'departure_place', headerName: 'PLACE', width: 72, valueGetter: (_value, row) => row.departure?.place }),
      createColumn({ field: 'departure_time', headerName: 'TIME', width: 66, type: 'string', valueGetter: (_value, row) => row.departure?.time }),

      // column 3 - arrival
      createColumn({ field: 'arrival_place', headerName: 'PLACE', width: 72, valueGetter: (_value, row) => row.arrival?.place }),
      createColumn({ field: 'arrival_time', headerName: 'TIME', width: 66, type: 'string', valueGetter: (_value, row) => row.arrival?.time }),

      // column 4 - aircraft
      createColumn({ field: 'aircraft_model', headerName: 'MAKE, MODEL, VARIANT', width: 150, valueGetter: (_value, row) => row.aircraft?.model }),
      createColumn({ field: 'aircraft_reg', headerName: 'REGISTRATION', width: 108, valueGetter: (_value, row) => row.aircraft?.reg_name }),

      // column 5 - single / multi-pilot time
      createTimeColumn({ field: 'se_time', headerName: 'SE', width: 62, renderCell: (params) => (params.value && params.value !== '0:00' && params.value !== '00:00' ? '✓' : '') }),
      createTimeColumn({ field: 'me_time', headerName: 'ME', width: 62, valueGetter: (_value, row) => row.time.mcc_time !== '' ? '' : row.time.me_time, renderCell: (params) => (params.value && params.value !== '0:00' && params.value !== '00:00' ? '✓' : '') }),
      createTimeColumn({ field: 'mcc_time', headerName: 'MULTI-PILOT TIME', width: 108 }),

      // columns 6-8
      createTimeColumn({ field: 'total_time', headerName: 'TOTAL TIME OF FLIGHT', width: 108 }),
      createColumn({ field: 'pic_name', headerName: 'NAME(S) PIC', width: 150, align: 'left' }),
      createLandingColumn({ field: 'landings_day', headerName: 'DAY', width: 62 }),
      createLandingColumn({ field: 'landings_night', headerName: 'NIGHT', width: 62 }),

      // column 9
      createTimeColumn({ field: 'night_time', headerName: 'NIGHT', width: 70 }),
      createTimeColumn({ field: 'ifr_time', headerName: 'IFR', width: 70 }),

      // column 10
      createTimeColumn({ field: 'pic_time', headerName: 'PIC', width: 70 }),
      createTimeColumn({ field: 'co_pilot_time', headerName: 'CO-PILOT', width: 78 }),
      createTimeColumn({ field: 'dual_time', headerName: 'DUAL', width: 70 }),
      createTimeColumn({ field: 'instructor_time', headerName: 'INSTRUCTOR', width: 86 }),

      // column 11 - FSTD session. The date is the record date for an FSTD entry.
      createDateColumn({
        field: 'sim_date',
        headerName: 'DATE (dd/mm/yy)',
        width: 96,
        displayFormat: 'DD/MM/YY',
        getValue: (_value, row) => (isFSTDRecord(row) ? row.date : null),
      }),
      createColumn({ field: 'sim_type', headerName: 'TYPE', width: 86, valueGetter: (_value, row) => row.sim?.type }),
      createColumn({
        field: 'sim_time',
        headerName: 'TOTAL TIME OF SESSION',
        width: 108,
        headerAlign: 'center',
        align: 'center',
        type: 'time',
        valueGetter: (_value, row) => row.sim?.time,
        aggregationFn: sumTime,
      }),

      // column 12
      createColumn({ field: 'remarks', headerName: 'REMARKS AND ENDORSEMENTS', align: 'left', width: 240 }),
    ].map((col) => ({ ...col, sortable: col.field === 'date' }));
  }, [isSettingsLoading]);

  const columnGroupingModel = useMemo(() => [
    { groupId: 'easa-1', headerName: '1', headerAlign: 'center', children: [{ field: 'date' }] },
    {
      groupId: 'easa-2', headerName: '2', headerAlign: 'center', children: [{
        groupId: 'easa-departure', headerName: groupHeader('DEPARTURE'), headerAlign: 'center',
        children: [{ field: 'departure_place' }, { field: 'departure_time' }],
      }],
    },
    {
      groupId: 'easa-3', headerName: '3', headerAlign: 'center', children: [{
        groupId: 'easa-arrival', headerName: groupHeader('ARRIVAL'), headerAlign: 'center',
        children: [{ field: 'arrival_place' }, { field: 'arrival_time' }],
      }],
    },
    {
      groupId: 'easa-4', headerName: '4', headerAlign: 'center', children: [{
        groupId: 'easa-aircraft', headerName: groupHeader('AIRCRAFT'), headerAlign: 'center',
        children: [{ field: 'aircraft_model' }, { field: 'aircraft_reg' }],
      }],
    },
    {
      groupId: 'easa-5', headerName: '5', headerAlign: 'center', children: [
        {
          groupId: 'easa-single-pilot', headerName: groupHeader('SINGLE-PILOT TIME'), headerAlign: 'center',
          children: [{ field: 'se_time' }, { field: 'me_time' }],
        },
        { field: 'mcc_time' },
      ],
    },
    { groupId: 'easa-6', headerName: '6', headerAlign: 'center', children: [{ field: 'total_time' }] },
    { groupId: 'easa-7', headerName: '7', headerAlign: 'center', children: [{ field: 'pic_name' }] },
    {
      groupId: 'easa-8', headerName: '8', headerAlign: 'center', children: [{
        groupId: 'easa-landings', headerName: groupHeader('LANDINGS'), headerAlign: 'center',
        children: [{ field: 'landings_day' }, { field: 'landings_night' }],
      }],
    },
    {
      groupId: 'easa-9', headerName: '9', headerAlign: 'center', children: [{
        groupId: 'easa-operational', headerName: groupHeader('OPERATIONAL CONDITION TIME'), headerAlign: 'center',
        children: [{ field: 'night_time' }, { field: 'ifr_time' }],
      }],
    },
    {
      groupId: 'easa-10', headerName: '10', headerAlign: 'center', children: [{
        groupId: 'easa-function', headerName: groupHeader('PILOT FUNCTION TIME'), headerAlign: 'center',
        children: [{ field: 'pic_time' }, { field: 'co_pilot_time' }, { field: 'dual_time' }, { field: 'instructor_time' }],
      }],
    },
    {
      groupId: 'easa-11', headerName: '11', headerAlign: 'center', children: [{
        groupId: 'easa-fstd', headerName: groupHeader('FSTD SESSION'), headerAlign: 'center',
        children: [{ field: 'sim_date' }, { field: 'sim_type' }, { field: 'sim_time' }],
      }],
    },
    { groupId: 'easa-12', headerName: '12', headerAlign: 'center', children: [{ field: 'remarks' }] },
  ], []);

  const customActions = useMemo(() => (
    <>
      <NewFlightRecordButton />
      <CSVExportButton apiRef={apiRef} type="logbook" />
      <PDFExportButton />
    </>
  ), [apiRef]);

  return (
    <XDataGrid
      apiRef={apiRef}
      tableId="logbook"
      title="Logbook"
      icon={<AutoStoriesOutlinedIcon />}
      loading={isLoading}
      rows={data}
      columns={columns}
      columnGroupingModel={columnGroupingModel}
      columnGroupHeaderHeight={30}
      columnHeaderHeight={50}
      pageSizeOptions={paginationOptions}
      getRowId={(row) => row.uuid}
      footerFieldIdTotalLabel="aircraft_reg"
      showAggregationFooter
      showPreviousPagesTotal
      initialValues={settings.previous_experience}
      disableColumnMenu
      customActions={customActions}
      pageTotalLabel="TOTAL THIS PAGE"
      previousTotalLabel="TOTAL FROM PREVIOUS PAGES"
      grandTotalLabel="TOTAL TIME"
      {...props}
    />
  );
};

export default LogbookTable;
