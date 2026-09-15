import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';

export const DashboardPageContent = () => {
  return (
    <Box component="main" sx={{ flexGrow: 1, px: { xs: 1.5, sm: 2.5 }, pb: 3, overflow: 'auto', minWidth: 0 }}>
      <Toolbar />
      <Outlet />
    </Box>
  );
};

export default DashboardPageContent;