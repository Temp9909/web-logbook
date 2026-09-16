import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import LinearProgress from '@mui/material/LinearProgress';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { fetchLogbookData } from '../../util/http/logbook';
import { useErrorNotification } from '../../hooks/useAppNotifications';
import LogbookTable from './LogbookTable';
import Tile from '../UIElements/Tile';

const toMinutes = (value) => {
  if (!value || typeof value !== 'string') return 0;
  const [h = '0', m = '0'] = value.split(':');
  const hours = Number.parseInt(h, 10);
  const minutes = Number.parseInt(m, 10);
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
};

const formatMinutes = (minutes) => {
  const safe = Number.isFinite(minutes) ? minutes : 0;
  return `${Math.floor(safe / 60).toLocaleString()}:${String(safe % 60).padStart(2, '0')}`;
};

export const Logbook = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['logbook'],
    queryFn: ({ signal }) => fetchLogbookData({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load logbook' });

  const summary = useMemo(() => {
    const rows = Array.isArray(data) ? data.filter((row) => row?.uuid !== 'previous-experience-artificial-uuid') : [];
    const totals = rows.reduce((acc, row) => {
      acc.total += toMinutes(row?.time?.total_time);
      acc.pic += toMinutes(row?.time?.pic_time);
      acc.me += toMinutes(row?.time?.me_time) + toMinutes(row?.time?.mcc_time);
      acc.ifr += toMinutes(row?.time?.ifr_time);
      acc.landings += (Number(row?.landings?.day) || 0) + (Number(row?.landings?.night) || 0);
      return acc;
    }, { total: 0, pic: 0, me: 0, ifr: 0, landings: 0 });

    return {
      flights: rows.length,
      landings: totals.landings,
      lastDate: rows[0]?.date || '',
      total: formatMinutes(totals.total),
      pic: formatMinutes(totals.pic),
      me: formatMinutes(totals.me),
      ifr: formatMinutes(totals.ifr),
    };
  }, [data]);

  return (
    <>
      {isLoading && <LinearProgress sx={{ mb: 1.5, borderRadius: 99 }} />}

      <Grid container spacing={1.5} sx={{ mb: 1.25 }}>
        <Tile title="Total time" value={summary.total} size={{ xs: 6, sm: 6, md: 3 }} />
        <Tile title="PIC" value={summary.pic} size={{ xs: 6, sm: 6, md: 3 }} />
        <Tile title="Multi-engine" value={summary.me} size={{ xs: 6, sm: 6, md: 3 }} />
        <Tile title="IFR" value={summary.ifr} size={{ xs: 6, sm: 6, md: 3 }} />
      </Grid>

      <Box sx={{ mb: 2, px: 0.25 }}>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
          {summary.flights.toLocaleString()} flights · {summary.landings.toLocaleString()} landings
          {summary.lastDate ? ` · last entry on ${summary.lastDate}` : ''}
        </Typography>
      </Box>

      <LogbookTable data={data || []} isLoading={isLoading} />
    </>
  );
};

export default Logbook;
