import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import { useNavigate, Outlet } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { NotificationsProvider } from './hooks/useNotifications/useNotifications';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { queryClient } from './util/http/http';
import getMPTheme from './theme/getMPTheme';
import { setNavigate } from './util/navigation';
import { ColorModeContext } from './context/ColorModeContext';
import { DialogsProvider } from './hooks/useDialogs/useDialogs';
import './apple-exact.css';
import './switch-color.css';
import useSettings from './hooks/useSettings';

dayjs.extend(updateLocale);
dayjs.updateLocale("en", { weekStart: 1 });

function NavigationSetter() {
  const navigate = useNavigate();
  setNavigate(navigate);
  return null;
}

function SwitchColorSync() {
  const { data } = useSettings();

  useEffect(() => {
    const color = data?.switch_color;
    if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)) {
      document.documentElement.style.setProperty('--switch-on-color', color.toUpperCase() === '#34C759' ? '#4AD968' : color);
    } else {
      document.documentElement.style.removeProperty('--switch-on-color');
    }
  }, [data?.switch_color]);

  return null;
}

function App() {
  const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'light');

  const colorMode = useMemo(() => ({
    mode,
    toggleColorMode: () => {
      setMode((prev) => {
        const next = prev === 'light' ? 'dark' : 'light';
        localStorage.setItem('themeMode', next);
        return next;
      });
    },
  }), [mode]);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'j') {
        event.preventDefault();
        colorMode.toggleColorMode();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [colorMode]);

  const theme = useMemo(() => createTheme(getMPTheme(mode)), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NavigationSetter />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <QueryClientProvider client={queryClient}>
            <NotificationsProvider>
              <SwitchColorSync />
              <DialogsProvider>
                <Outlet />
              </DialogsProvider>
            </NotificationsProvider>
          </QueryClientProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
