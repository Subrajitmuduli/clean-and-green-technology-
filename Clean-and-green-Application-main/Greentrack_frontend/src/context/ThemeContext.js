import React, { createContext, useState, useMemo } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Context export
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: 'light'
});

export const CustomThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('light');

  const colorMode = useMemo(() => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
      mode
    }), [mode]);

  const theme = useMemo(() =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                // Light mode modern emerald palette
                primary: { main: '#10b981', light: '#34d399', dark: '#047857' },
                secondary: { main: '#059669', light: '#10b981', dark: '#065f46' },
                background: {
                  default: '#f6fbf6',
                  paper: '#ffffff',
                },
                text: {
                  primary: '#0f172a',
                  secondary: '#475569'
                }
              }
            : {
                // Dark mode modern sleek palette
                primary: { main: '#34d399', light: '#6ee7b7', dark: '#10b981' },
                secondary: { main: '#6ee7b7', light: '#a7f3d0', dark: '#34d399' },
                background: {
                  default: '#0f172a',
                  paper: '#1e293b',
                },
                text: {
                  primary: '#f8fafc',
                  secondary: '#94a3b8'
                }
              }),
        },
        typography: {
          fontFamily: "'Outfit', 'sans-serif'",
          button: {
            textTransform: 'none',
            fontWeight: 600,
          }
        },
        shape: { borderRadius: 16 },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: '50px',
                padding: '8px 24px',
                boxShadow: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 20px -6px rgba(16, 185, 129, 0.4)',
                  transform: 'translateY(-2px)'
                }
              }
            }
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: '20px',
                boxShadow: mode === 'light' ? '0 10px 40px -10px rgba(0,0,0,0.06)' : '0 10px 40px -10px rgba(0,0,0,0.3)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }
            }
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none'
              }
            }
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  transition: 'all 0.2s',
                  '&:hover fieldset': {
                    borderColor: '#10b981',
                  },
                }
              }
            }
          }
        }
      }), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
