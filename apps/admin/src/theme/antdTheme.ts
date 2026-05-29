import type { ThemeConfig } from 'antd';

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#2563EB',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    borderRadius: 8,
    fontFamily: 'Inter, sans-serif',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F8FAFC',
    colorBorder: '#E2E8F0',
  },
  components: {
    Layout: {
      bodyBg: '#F8FAFC',
      headerBg: '#FFFFFF',
      siderBg: '#0F172A',
    },
    Menu: {
      darkItemBg: 'transparent',
      darkItemSelectedBg: '#2563EB',
      darkItemHoverBg: 'rgba(37, 99, 235, 0.15)',
    },
    Table: {
      borderRadius: 8,
    },
  },
};

export const darkTheme: ThemeConfig = {
  ...lightTheme,
  token: {
    ...lightTheme.token,
    colorBgContainer: '#1E293B',
    colorBgLayout: '#0F172A',
    colorBorder: '#334155',
    colorText: '#F1F5F9',
    colorTextSecondary: '#94A3B8',
  },
};
