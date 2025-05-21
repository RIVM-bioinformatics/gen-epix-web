/* eslint-disable @typescript-eslint/naming-convention */
import type {
  PaletteMode,
  Theme,
  ThemeOptions,
} from '@mui/material';
import { createTheme as muiCreateTheme } from '@mui/material';

import robotoFlexWoff2 from './fonts/RobotoFlex.woff2';
import notoSansMonoWoff2 from './fonts/NotoSansMono.woff2';

export const createTheme = (paletteMode: PaletteMode): Theme => {
  const MuiCssBaselineStyleOverrides = `
    html, body {
      font-size: 14px;
      height: 100%;
      overscroll-behavior: none;
    }
    #root {
      height: 100%;
    }

    /* cyrillic-ext */
    @font-face {
      font-family: 'Roboto Flex';
      font-style: normal;
      font-weight: 100 1000;
      font-stretch: 100%;
      font-display: swap;
      src: url(${robotoFlexWoff2}) format('woff2');
      unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
    }
    /* cyrillic */
    @font-face {
      font-family: 'Roboto Flex';
      font-style: normal;
      font-weight: 100 1000;
      font-stretch: 100%;
      font-display: swap;
      src: url(${robotoFlexWoff2}) format('woff2');
      unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
    }
    /* greek */
    @font-face {
      font-family: 'Roboto Flex';
      font-style: normal;
      font-weight: 100 1000;
      font-stretch: 100%;
      font-display: swap;
      src: url(${robotoFlexWoff2}) format('woff2');
      unicode-range: U+0370-0377, U+037A-037F, U+0384-038A, U+038C, U+038E-03A1, U+03A3-03FF;
    }
    /* vietnamese */
    @font-face {
      font-family: 'Roboto Flex';
      font-style: normal;
      font-weight: 100 1000;
      font-stretch: 100%;
      font-display: swap;
      src: url(${robotoFlexWoff2}) format('woff2');
      unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
    }
    /* latin-ext */
    @font-face {
      font-family: 'Roboto Flex';
      font-style: normal;
      font-weight: 100 1000;
      font-stretch: 100%;
      font-display: swap;
      src: url(${robotoFlexWoff2}) format('woff2');
      unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
    }
    /* latin */
    @font-face {
      font-family: 'Roboto Flex';
      font-style: normal;
      font-weight: 100 1000;
      font-stretch: 100%;
      font-display: swap;
      src: url(${robotoFlexWoff2}) format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }

    /* cyrillic-ext */
    @font-face {
      font-family: 'Noto Sans Mono';
      font-style: normal;
      font-weight: 100 900;
      font-stretch: 100%;
      font-display: swap;
      src: url(${notoSansMonoWoff2}) format('woff2');
      unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
    }
    /* cyrillic */
    @font-face {
      font-family: 'Noto Sans Mono';
      font-style: normal;
      font-weight: 100 900;
      font-stretch: 100%;
      font-display: swap;
      src: url(${notoSansMonoWoff2}) format('woff2');
      unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
    }
    /* greek-ext */
    @font-face {
      font-family: 'Noto Sans Mono';
      font-style: normal;
      font-weight: 100 900;
      font-stretch: 100%;
      font-display: swap;
      src: url(${notoSansMonoWoff2}) format('woff2');
      unicode-range: U+1F00-1FFF;
    }
    /* greek */
    @font-face {
      font-family: 'Noto Sans Mono';
      font-style: normal;
      font-weight: 100 900;
      font-stretch: 100%;
      font-display: swap;
      src: url(${notoSansMonoWoff2}) format('woff2');
      unicode-range: U+0370-0377, U+037A-037F, U+0384-038A, U+038C, U+038E-03A1, U+03A3-03FF;
    }
    /* vietnamese */
    @font-face {
      font-family: 'Noto Sans Mono';
      font-style: normal;
      font-weight: 100 900;
      font-stretch: 100%;
      font-display: swap;
      src: url(${notoSansMonoWoff2}) format('woff2');
      unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
    }
    /* latin-ext */
    @font-face {
      font-family: 'Noto Sans Mono';
      font-style: normal;
      font-weight: 100 900;
      font-stretch: 100%;
      font-display: swap;
      src: url(${notoSansMonoWoff2}) format('woff2');
      unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
    }
    /* latin */
    @font-face {
      font-family: 'Noto Sans Mono';
      font-style: normal;
      font-weight: 100 900;
      font-stretch: 100%;
      font-display: swap;
      src: url(${notoSansMonoWoff2}) format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
  `;

  const themeOptions: ThemeOptions = {
    ...(process.env.NODE_ENV === 'test' && { transitions: { create: () => 'none' } }),
    epi: {
      tree: {
        font: 'bold 0.7rem "Noto Sans Mono"',
      },
      lineList: {
        font: '0.8rem "Noto Sans Mono"',
      },
    },
    spacing: 8,
    components: {
      MuiTooltip: {
        defaultProps: {
          enterDelay: 500,
          enterNextDelay: 500,
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            textDecoration: 'underline',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            fontWeight: 'bold',
          },
        },
        defaultProps: {
          variant: 'contained',
          color: 'primary',
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            fontWeight: 'bold',
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'filled',
          size: 'small',
          fullWidth: true,
        },
      },
      MuiAutocomplete: {
        defaultProps: {
          size: 'small',
          fullWidth: true,
        },
      },
      MuiToggleButtonGroup: {
        defaultProps: {
          size: 'small',
        },
      },
      MuiFormControl: {
        defaultProps: {
          variant: 'filled',
          size: 'small',
          fullWidth: true,
        },
      },
      MuiAlertTitle: {
        styleOverrides: {
          root: {
            color: 'inherit',
            fontWeight: 'bold',
            marginBottom: 0,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: '#c9defc',
          },
        },
      },
      MuiFilledInput: {
        styleOverrides: {
          root: {
            backgroundColor: 'rgba(186,214,237,0.2)',
            '&:hover': {
              backgroundColor: 'rgba(186,214,237,0.6)',
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(186,214,237,0.3)',
            },
            '&.Mui-disabled': {
              backgroundColor: 'rgba(186,214,237,0.1)',
            },
            '&.Mui-error': {
              backgroundColor: 'rgba(240,180,186,0.4)',
              '&:hover': {
                backgroundColor: 'rgba(240,180,186,0.6)',
              },
              '&.Mui-focused': {
                backgroundColor: 'rgba(240,180,186,0.6)',
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(240,180,186,0.1)',
              },
              '&:after': {
                borderBottomColor: '#a45c4f',
              },
            },
            '&.Mui-warning': {
              backgroundColor: 'rgb(248,214,140,0.3)',
              '&:hover': {
                backgroundColor: 'rgb(248,214,140,0.6)',
                '@media (hover: none)': {
                  backgroundColor: 'rgb(248,214,140,0.3)',
                },
              },
              '&.Mui-focused': {
                backgroundColor: 'rgb(248,214,140,0.3)',
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgb(248,214,140,0.1)',
              },
              '&:after': {
                borderBottomColor: 'rgb(119,80,21)',
                transform: 'scaleX(1)',
              },
            },
          },
          input: {
            color: '#282245',
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: '#453e6d',
            '&.Mui-error': {
              color: '#a45c4f',
            },
            '&.Mui-warning': {
              color: 'rgb(119,80,21)',
            },
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            color: '#453e6d',
            '&.Mui-error': {
              color: '#ba2818',
            },
            '&.Mui-warning': {
              color: 'rgb(119,80,21)',
            },
          },
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          asterisk: {
            color: '#D90000',
          },
          root: {
            color: '#453e6d',
            '&.Mui-error': {
              color: '#ba2818',
            },
            '&.Mui-warning': {
              color: 'rgb(119,80,21)',
            },
          },
        },
      },
      MuiFormControlLabel: {
        styleOverrides: {
          label: {
            color: '#282245',
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          light: {
            backgroundColor: '#c9defc',
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          caption: {
            fontStyle: 'italic',
          },
          body1: {
            color: 'rgba(0,0,0,0.87)',
            fontSize: '1rem', // 14
          },
          body2: {
            color: 'rgba(0,0,0,0.87)',
            fontSize: '1rem', // 14
          },
          subtitle1: {
            color: 'rgba(0,0,0,0.87)',
            fontSize: '1.286rem', // 18
            fontWeight: 400,
          },
          subtitle2: {
            color: '#171c42',
            fontSize: '1.143rem', // 16
            fontWeight: 700,
          },
          h1: {
            color: '#171c42',
            fontSize: '2.143rem', // 30
            fontWeight: 700,
          },
          h2: {
            color: '#171c42',
            fontSize: '1.857rem', // 26
            fontWeight: 400,
          },
          h3: {
            color: '#171c42',
            fontSize: '1.714rem', // 24
            fontWeight: 700,
          },
          h4: {
            color: '#171c42',
            fontSize: '1.429rem', // 20
            fontWeight: 700,
          },
          h5: {
            color: '#171c42',
            fontSize: '1.286rem', // 16
            fontWeight: 700,
          },
          h6: {
            color: '#171c42',
            fontSize: '1.143rem', // 16
            fontWeight: 400,
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: MuiCssBaselineStyleOverrides,
      },
    },
    typography: {
      fontFamily: 'Roboto Flex',
      fontSize: 10,
      htmlFontSize: 10,
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 640,
        md: 1024,
        lg: 1340,
        xl: 1920,
      },
    },
    palette: {
      mode: paletteMode,
      primary: {
        main: '#3f51b5',
        contrastText: '#fff',
      },
      secondary: {
        main: '#2a2b33',
        contrastText: '#fff',
      },
      divider: '#eeeeee',
      error: {
        main: '#cf0101',
        contrastText: '#fff',
      },
      success: {
        main: '#05B803',
        contrastText: '#fff',
      },
      grey: {
        100: '#eeeeee',
        500: '#777777',
      },
    },
  };

  return muiCreateTheme(themeOptions);
};
