import { createTheme } from '@mui/material/styles'

export const sdsTheme = createTheme({
  palette: {
    primary: { main: '#2744C7', dark: '#1B3299', light: '#E7ECFC' },
    text: { primary: '#131B26', secondary: '#566273' },
    background: { default: '#EEF1F5', paper: '#FFFFFF' },
    divider: '#D5DBE3',
    success: { main: '#2E7D5B', dark: '#146C43', light: '#E3F4EA' },
    warning: { main: '#B7791F', dark: '#7A5A12', light: '#FFF1D6' },
    error: { main: '#B3261E', light: '#FFF6F5' },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Helvetica", "Arial", sans-serif',
    fontSize: 13,
    h1: { fontSize: 28, fontWeight: 600 },
    h2: { fontSize: 16, fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#EEF1F5',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, size: 'small' },
      styleOverrides: {
        root: {
          minHeight: 32,
        },
        sizeSmall: {
          minHeight: 32,
          paddingLeft: 12,
          paddingRight: 12,
          fontSize: 13,
        },
      },
    },
    MuiIconButton: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          width: 32,
          height: 32,
        },
        sizeSmall: {
          width: 32,
          height: 32,
        },
      },
    },
    MuiChip: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          height: 22,
          fontSize: 11,
        },
        label: {
          paddingLeft: 8,
          paddingRight: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 36,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 36,
          paddingLeft: 12,
          paddingRight: 12,
          fontSize: 13,
          textTransform: 'none',
        },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true, enterDelay: 400 },
    },
  },
})

export const zoneColors = {
  aws: { bg: '#FBF7EF', line: '#E6D8BC', label: '#7A5A12' },
  gcp: { bg: '#F1F6FD', line: '#C7D8EF', label: '#1B3F7A' },
  azure: { bg: '#F0F7F7', line: '#BFDADA', label: '#0D5A55' },
  kubernetes: { bg: '#F6F3FB', line: '#D4C8E8', label: '#5B3A8C' },
  generic: { bg: '#EEF1F5', line: '#D5DBE3', label: '#566273' },
} as const
