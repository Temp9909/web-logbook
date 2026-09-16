import { createTheme, alpha } from '@mui/material/styles';

const defaultTheme = createTheme();

/**
 * Apple-inspired design tokens.
 *
 * Colors follow the Apple Human Interface Guidelines system palette
 * (iOS / macOS system colors), typography uses the San Francisco stack
 * with the usual fallbacks, and elevation is kept soft and diffuse.
 */

// Apple system blue (accent color)
export const brand = {
  50: '#EBF5FF',
  100: '#D6EAFF',
  200: '#A8D2FF',
  300: '#66B2FF',
  400: '#007AFF', // systemBlue - light
  500: '#0A84FF', // systemBlue - dark
  600: '#0071E3', // Apple.com button blue
  700: '#0058B0',
  800: '#003E7E',
  900: '#00284F',
};

// Apple neutral / label / fill grays
export const gray = {
  50: '#FFFFFF',
  100: '#F5F5F7', // Apple marketing gray
  200: '#F2F2F7', // systemGroupedBackground
  300: '#E5E5EA', // systemGray5
  400: '#D1D1D6', // systemGray4
  500: '#AEAEB2', // systemGray2
  600: '#8E8E93', // systemGray
  700: '#3A3A3C', // systemGray - dark elevated
  800: '#1D1D1F', // Apple near-black label
  900: '#000000',
};

export const green = {
  50: '#E8FAEE',
  100: '#D1F5DD',
  200: '#A5EBBC',
  300: '#6EDD93',
  400: '#34C759', // systemGreen - light
  500: '#30D158', // systemGreen - dark
  600: '#248A3D',
  700: '#1C6B2F',
  800: '#144D22',
  900: '#0C3015',
};

export const orange = {
  50: '#FFF6E5',
  100: '#FFEDCC',
  200: '#FFDA99',
  300: '#FFC266',
  400: '#FF9500', // systemOrange - light
  500: '#FF9F0A', // systemOrange - dark
  600: '#C76F00',
  700: '#9A5600',
  800: '#6E3E00',
  900: '#422500',
};

export const red = {
  50: '#FFECEB',
  100: '#FFD9D6',
  200: '#FFB3AD',
  300: '#FF8078',
  400: '#FF3B30', // systemRed - light
  500: '#FF453A', // systemRed - dark
  600: '#D70015',
  700: '#A50011',
  800: '#75000C',
  900: '#470007',
};

// Additional Apple system colors, handy for charts / accents
export const systemColors = {
  teal: { light: '#5AC8FA', dark: '#64D2FF' },
  indigo: { light: '#5856D6', dark: '#5E5CE6' },
  purple: { light: '#AF52DE', dark: '#BF5AF2' },
  pink: { light: '#FF2D55', dark: '#FF375F' },
  yellow: { light: '#FFCC00', dark: '#FFD60A' },
  mint: { light: '#00C7BE', dark: '#63E6E2' },
};

// Apple labels / separators / fills (semantic colors)
export const appleLight = {
  label: '#1D1D1F',
  secondaryLabel: 'rgba(60, 60, 67, 0.60)',
  tertiaryLabel: 'rgba(60, 60, 67, 0.30)',
  separator: 'rgba(60, 60, 67, 0.18)',
  fill: 'rgba(116, 116, 128, 0.08)',
  fillStrong: 'rgba(116, 116, 128, 0.14)',
  groupedBackground: '#F2F2F7',
  elevated: '#FFFFFF',
  materialBar: 'rgba(255, 255, 255, 0.72)',
  materialSidebar: 'rgba(246, 246, 248, 0.78)',
};

export const appleDark = {
  label: '#F5F5F7',
  secondaryLabel: 'rgba(235, 235, 245, 0.60)',
  tertiaryLabel: 'rgba(235, 235, 245, 0.30)',
  separator: 'rgba(84, 84, 88, 0.60)',
  fill: 'rgba(120, 120, 128, 0.20)',
  fillStrong: 'rgba(120, 120, 128, 0.32)',
  // Not pure black: matches the macOS dark window chrome rather than an OLED void
  groupedBackground: '#161618',
  elevated: '#1F1F22',
  materialBar: 'rgba(31, 31, 34, 0.72)',
  materialSidebar: 'rgba(28, 28, 31, 0.78)',
};

export const apple = (mode) => (mode === 'dark' ? appleDark : appleLight);

// San Francisco first, then the usual platform fallbacks
export const fontFamily = [
  '-apple-system',
  'BlinkMacSystemFont',
  '"SF Pro Text"',
  '"SF Pro Display"',
  '"Helvetica Neue"',
  '"Segoe UI"',
  'Roboto',
  'Arial',
  'sans-serif',
  '"Apple Color Emoji"',
  '"Segoe UI Emoji"',
].join(',');

// Soft, diffuse elevation - Apple never uses hard drop shadows
const buildShadows = (mode) => {
  const shadows = [...defaultTheme.shadows];
  const s = (y, blur, a1, spread = 0, a2 = 0.04) =>
    mode === 'dark'
      ? `0px ${y}px ${blur}px ${spread}px rgba(0, 0, 0, ${a1 + 0.25}), 0px 1px 2px rgba(0, 0, 0, 0.4)`
      : `0px ${y}px ${blur}px ${spread}px rgba(0, 0, 0, ${a1}), 0px 1px 2px rgba(0, 0, 0, ${a2})`;

  shadows[1] = s(1, 3, 0.05);
  shadows[2] = s(2, 6, 0.06);
  shadows[3] = s(4, 12, 0.07);
  shadows[4] = s(6, 18, 0.08);
  shadows[6] = s(10, 28, 0.1);
  shadows[8] = s(14, 38, 0.12);
  shadows[12] = s(20, 50, 0.14);
  shadows[16] = s(26, 62, 0.16);
  shadows[24] = s(32, 80, 0.18);
  return shadows;
};

export const getDesignTokens = (mode) => {
  const isDark = mode === 'dark';
  const c = apple(mode);

  return {
    palette: {
      mode,
      primary: {
        light: brand[300],
        main: isDark ? brand[500] : brand[400],
        dark: brand[700],
        contrastText: '#FFFFFF',
      },
      secondary: {
        light: systemColors.indigo.light,
        main: isDark ? systemColors.indigo.dark : systemColors.indigo.light,
        dark: '#3634A3',
        contrastText: '#FFFFFF',
      },
      info: {
        light: systemColors.teal.light,
        main: isDark ? systemColors.teal.dark : systemColors.teal.light,
        dark: '#0071A4',
        contrastText: '#FFFFFF',
      },
      warning: {
        light: orange[300],
        main: isDark ? orange[500] : orange[400],
        dark: orange[600],
        contrastText: '#FFFFFF',
      },
      error: {
        light: red[300],
        main: isDark ? red[500] : red[400],
        dark: red[600],
        contrastText: '#FFFFFF',
      },
      success: {
        light: green[300],
        main: isDark ? green[500] : green[400],
        dark: green[600],
        contrastText: '#FFFFFF',
      },
      grey: { ...gray },
      divider: c.separator,
      background: {
        default: isDark ? appleDark.groupedBackground : appleLight.groupedBackground,
        paper: isDark ? appleDark.elevated : appleLight.elevated,
      },
      text: {
        primary: c.label,
        secondary: c.secondaryLabel,
        disabled: c.tertiaryLabel,
        warning: isDark ? orange[500] : orange[400],
      },
      action: {
        active: c.secondaryLabel,
        hover: c.fill,
        hoverOpacity: 0.06,
        selected: isDark ? alpha(brand[500], 0.24) : alpha(brand[400], 0.12),
        selectedOpacity: 0.12,
        focus: alpha(isDark ? brand[500] : brand[400], 0.24),
        disabled: c.tertiaryLabel,
        disabledBackground: c.fill,
      },
    },
    typography: {
      fontFamily,
      // Apple uses tighter tracking as type gets larger
      h1: {
        fontSize: defaultTheme.typography.pxToRem(48),
        fontWeight: 700,
        lineHeight: 1.08,
        letterSpacing: '-0.022em',
      },
      h2: {
        fontSize: defaultTheme.typography.pxToRem(36),
        fontWeight: 700,
        lineHeight: 1.12,
        letterSpacing: '-0.021em',
      },
      h3: {
        fontSize: defaultTheme.typography.pxToRem(28),
        fontWeight: 600,
        lineHeight: 1.18,
        letterSpacing: '-0.02em',
      },
      h4: {
        fontSize: defaultTheme.typography.pxToRem(24),
        fontWeight: 600,
        lineHeight: 1.25,
        letterSpacing: '-0.018em',
      },
      h5: {
        fontSize: defaultTheme.typography.pxToRem(20),
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.015em',
      },
      h6: {
        fontSize: defaultTheme.typography.pxToRem(17),
        fontWeight: 600,
        lineHeight: 1.35,
        letterSpacing: '-0.012em',
      },
      subtitle1: {
        fontSize: defaultTheme.typography.pxToRem(17),
        fontWeight: 500,
        letterSpacing: '-0.01em',
      },
      subtitle2: {
        fontSize: defaultTheme.typography.pxToRem(14),
        fontWeight: 600,
        letterSpacing: '-0.006em',
      },
      body1: {
        fontSize: defaultTheme.typography.pxToRem(15),
        lineHeight: 1.47,
        letterSpacing: '-0.008em',
      },
      body2: {
        fontSize: defaultTheme.typography.pxToRem(13.5),
        lineHeight: 1.45,
        letterSpacing: '-0.005em',
      },
      button: {
        fontSize: defaultTheme.typography.pxToRem(14),
        fontWeight: 600,
        letterSpacing: '-0.005em',
        textTransform: 'none',
      },
      caption: {
        fontSize: defaultTheme.typography.pxToRem(12),
        fontWeight: 400,
        letterSpacing: 0,
      },
      overline: {
        fontSize: defaultTheme.typography.pxToRem(11),
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      },
    },
    shape: {
      borderRadius: 10,
    },
    shadows: buildShadows(mode),
    transitions: {
      easing: {
        // Apple's standard ease curve
        easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        easeOut: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        sharp: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  };
};
