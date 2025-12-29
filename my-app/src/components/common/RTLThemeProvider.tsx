import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

interface RTLThemeProviderProps {
  children: React.ReactNode;
}

const RTLThemeProvider: React.FC<RTLThemeProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'he';

  // Create RTL cache
  const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [rtlPlugin],
  });

  // Create LTR cache
  const cacheLtr = createCache({
    key: 'mui',
  });

  const theme = createTheme({
    direction: isRTL ? 'rtl' : 'ltr',
    palette: {
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
    typography: {
      fontFamily: isRTL 
        ? "'Segoe UI', 'Arial Hebrew', 'David', 'Narkisim', system-ui, Arial, sans-serif"
        : "'Roboto', 'Helvetica', 'Arial', sans-serif",
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            // Let MUI handle RTL positioning automatically
          },
        },
      },

      MuiListItemText: {
        styleOverrides: {
          root: {
            textAlign: isRTL ? 'right' : 'left',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRight: isRTL ? 'none' : undefined,
            borderLeft: isRTL ? undefined : 'none',
          },
        },
      },
    },
  });

  return (
    <CacheProvider value={isRTL ? cacheRtl : cacheLtr}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
};

export default RTLThemeProvider;
