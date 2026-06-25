import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';

/**
 * 拼豆设计系统主题。
 * 设计取向:画布上的拼豆作品本身色彩丰富,因此界面外壳保持克制,
 * 只用一个温暖的品牌主色(莓果 Berry),让用户的作品成为主角。
 */
const light = {
  dark: false,
  colors: {
    background: '#F7F4EF', // 温暖纸张
    surface: '#FFFFFF',
    'surface-variant': '#EFEAE3',
    'on-surface-variant': '#5A5660',
    primary: '#C8456B', // 莓果 Berry — 品牌主色
    secondary: '#15A08C', // 拼豆板薄荷绿 Teal
    accent: '#F2A03D', // 暖橙点缀(用于豆子高光等)
    error: '#D14343',
    info: '#3A86C8',
    success: '#15A08C',
    warning: '#E0A100',
    'on-surface': '#2C2A33',
    'on-background': '#2C2A33',
  },
  variables: {
    'border-color': '#2C2A33',
    'border-opacity': 0.1,
  },
};

const dark = {
  dark: true,
  colors: {
    background: '#1B1A21',
    surface: '#26242E',
    'surface-variant': '#322F3B',
    'on-surface-variant': '#B7B2BE',
    primary: '#E5779A', // 暗色下提亮的莓果
    secondary: '#2DBFAA',
    accent: '#F4B45F',
    error: '#F0807F',
    info: '#6BA9DE',
    success: '#2DBFAA',
    warning: '#F0C03A',
    'on-surface': '#ECEAF0',
    'on-background': '#ECEAF0',
  },
  variables: {
    'border-color': '#FFFFFF',
    'border-opacity': 0.12,
  },
};

export const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: { light, dark },
  },
  defaults: {
    VBtn: {
      rounded: 'lg',
      style: 'text-transform: none; letter-spacing: 0.01em; font-weight: 600;',
    },
    VCard: { rounded: 'xl' },
    VChip: { rounded: 'lg' },
    VTextField: { rounded: 'lg' },
    VSelect: { rounded: 'lg' },
    VAlert: { rounded: 'lg' },
  },
  icons: {
    defaultSet: 'mdi',
  },
});
