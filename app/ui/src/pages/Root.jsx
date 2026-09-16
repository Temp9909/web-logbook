import { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import DashboardToolbar from '../components/UIElements/Dashboard/DashboardToolbar';
import DashboardNavbar from '../components/UIElements/Dashboard/DashboardNavbar';
import DashboardPageContent from '../components/UIElements/Dashboard/DashboardPageContent';
import { useLocalStorageState, CODE_BOOLEAN } from '../hooks/useLocalStorageState';

export const Root = () => {
  const isMobile = useMediaQuery('(max-width:800px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useLocalStorageState('dashboard-expanded', true, { codec: CODE_BOOLEAN });

  const handleMenuToggle = useCallback(() => {
    if (isMobile) setMobileOpen(o => !o);
    else setExpanded(e => !e);
  }, [isMobile, setExpanded]);

  const handleMobileClose = useCallback(() => setMobileOpen(false), []);

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: (theme) => theme.palette.mode === 'dark'
          ? 'radial-gradient(900px 520px at 82% -12%, rgba(10,132,255,.18), transparent 65%), radial-gradient(760px 540px at 15% 105%, rgba(191,90,242,.10), transparent 67%), #161618'
          : 'radial-gradient(900px 520px at 82% -12%, rgba(0,122,255,.13), transparent 65%), radial-gradient(760px 540px at 15% 105%, rgba(175,82,222,.09), transparent 67%), #F2F2F7',
      }}
    >
      <DashboardToolbar
        handleMenuToggle={handleMenuToggle}
        expanded={expanded}
        isMobile={isMobile}
      />
      <DashboardNavbar
        expanded={expanded}
        mobileOpen={mobileOpen}
        handleMobileClose={handleMobileClose}
        isMobile={isMobile}
      />
      <DashboardPageContent />
    </Box>
  );
};

export default Root;
