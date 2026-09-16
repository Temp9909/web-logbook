import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';

export const DashboardPageContent = () => {
  return (
    <Box component="main" sx={{ flexGrow: 1, px: { xs: 2, sm: 4.25 }, pt: { xs: 1, sm: 2.5 }, pb: 6, overflow: 'auto', minWidth: 0 }}>
      <Toolbar sx={{ minHeight: '58px !important' }} />
      <Outlet />
    </Box>
  );
};

export default DashboardPageContent;