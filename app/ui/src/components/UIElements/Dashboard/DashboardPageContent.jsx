import { Outlet, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const PAGE_META = {
  logbook: ['Flight records', 'Your complete flying history, totals and recent activity'],
  licensing: ['Licensing', 'Licences, ratings and certificates'],
  map: ['Map', 'Visualize your flights and routes'],
  aircrafts: ['Aircrafts', 'Aircraft registrations, types and categories'],
  airports: ['Airports', 'Airport database and custom airfields'],
  persons: ['Persons', 'People linked to your logbook'],
  attachments: ['Attachments', 'Documents and files attached to your flights'],
  stats: ['Stats', 'Flight hours, activity and trends'],
  currency: ['Currency', 'Track recency and qualification requirements'],
  export: ['Export', 'Generate and download your logbook'],
  import: ['Import', 'Import flights from CSV or other sources'],
  settings: ['Settings', 'Preferences, fields and account configuration'],
};

const getMeta = (pathname) => {
  const segment = pathname.split('/').filter(Boolean)[0] || 'logbook';
  return PAGE_META[segment] || [segment.charAt(0).toUpperCase() + segment.slice(1), ''];
};

export const DashboardPageContent = () => {
  const location = useLocation();
  const [title, subtitle] = getMeta(location.pathname);

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        minWidth: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        pt: '58px',
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 3, md: '34px' },
          pt: { xs: 3, md: '30px' },
          pb: { xs: 5, md: '50px' },
          maxWidth: '100%',
        }}
      >
        <Box sx={{ mb: 2.5 }}>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '1.75rem', md: '2rem' },
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.035em',
              mb: 0.5,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ color: 'text.secondary', fontSize: '0.84375rem' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardPageContent;
