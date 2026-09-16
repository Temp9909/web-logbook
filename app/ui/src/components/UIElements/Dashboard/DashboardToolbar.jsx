import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { compareVersions } from 'compare-versions';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import { fetchAuthEnabled, fetchLatestRelease, fetchVersion } from '../../../util/http/settings';
import ThemeSwitcher from './ThemeSwitcher';
import { DRAWER_WIDTH, MINI_DRAWER_WIDTH } from '../../../constants/constants';

const TITLES = {
  logbook: 'Logbook', licensing: 'Licensing', map: 'Map', aircrafts: 'Aircrafts',
  airports: 'Airports', persons: 'Persons', attachments: 'Attachments', stats: 'Stats',
  currency: 'Currency', export: 'Export', import: 'Import', settings: 'Settings',
};

const AppTitle = () => {
  const location = useLocation();
  const segment = location.pathname.split('/').filter(Boolean)[0] || 'logbook';
  const title = TITLES[segment] || 'Logbook';

  const { data: version } = useQuery({
    queryKey: ['version'], queryFn: ({ signal }) => fetchVersion({ signal }),
    placeholderData: '', staleTime: 86400000, gcTime: 86400000, refetchOnWindowFocus: false,
  });
  const { data: latestRelease } = useQuery({
    queryKey: ['latestRelease'], queryFn: ({ signal }) => fetchLatestRelease({ signal }),
    staleTime: 604800000, gcTime: 604800000, refetchOnWindowFocus: false,
  });
  const isNewReleaseAvailable = useMemo(() => (
    version && latestRelease?.tag_name ? compareVersions(latestRelease.tag_name, version) === 1 : false
  ), [version, latestRelease]);

  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Typography sx={{ fontSize: '1.0625rem', fontWeight: 600, letterSpacing: '-0.015em' }}>{title}</Typography>
      {version && (
        <Badge color="primary" badgeContent="New" invisible={!isNewReleaseAvailable}>
          <Chip
            size="small" label={version} variant="outlined"
            component="a" href="https://github.com/vsimakhin/web-logbook/releases"
            clickable target="_blank" rel="noopener noreferrer"
            sx={{ height: 20, fontSize: '0.68rem', color: 'text.secondary' }}
          />
        </Badge>
      )}
    </Stack>
  );
};

const ToolbarActions = () => {
  const navigate = useNavigate();
  const { data: auth } = useQuery({
    queryKey: ['auth-enabled'], queryFn: ({ signal }) => fetchAuthEnabled({ signal }),
    placeholderData: false, staleTime: 86400000, gcTime: 86400000, refetchOnWindowFocus: false,
  });
  const handleLogout = useCallback(() => navigate('/logout'), [navigate]);
  return (
    <Stack direction="row" spacing={0.25} alignItems="center">
      <ThemeSwitcher />
      {auth && (
        <Tooltip title="Logout"><IconButton onClick={handleLogout}><MeetingRoomIcon /></IconButton></Tooltip>
      )}
    </Stack>
  );
};

export const DashboardToolbar = ({ handleMenuToggle, expanded, isMobile }) => (
  <AppBar
    position="fixed"
    color="inherit"
    elevation={0}
    sx={{
      zIndex: 30000,
      left: isMobile ? 0 : (expanded ? DRAWER_WIDTH : MINI_DRAWER_WIDTH),
      width: isMobile ? '100%' : `calc(100% - ${expanded ? DRAWER_WIDTH : MINI_DRAWER_WIDTH}px)`,
      transition: (theme) => theme.transitions.create(['left', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.standard,
      }),
    }}
  >
    <Toolbar sx={{ minHeight: '58px !important', px: { xs: 1.5, sm: 2.25 } }}>
      <IconButton edge="start" aria-label="toggle drawer" onClick={handleMenuToggle} sx={{ mr: 1, width: 32, height: 32 }}>
        {(!isMobile && expanded) ? <MenuOpenIcon sx={{ fontSize: 19 }} /> : <MenuIcon sx={{ fontSize: 19 }} />}
      </IconButton>
      <Box sx={{ flexGrow: 1 }}><AppTitle /></Box>
      <ToolbarActions />
    </Toolbar>
  </AppBar>
);

export default DashboardToolbar;
