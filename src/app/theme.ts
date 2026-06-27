import type { ThemeConfig } from 'antd';

/**
 * Ant Design tokens tuned to sit on top of the Pre-Flight design system in
 * globals.css. Primary stays Jiga's teal (#01b39e) so the tool feels native to
 * their product; the rest aligns antd's defaults (radius, type, borders) with
 * the custom UI.
 */
export const jigaTheme: ThemeConfig = {
  token: {
    colorPrimary: '#01b39e',
    colorInfo: '#01b39e',
    colorText: '#131a1c',
    colorTextSecondary: 'rgba(19, 26, 28, 0.64)',
    colorBorder: '#e8edef',
    colorBorderSecondary: '#f1f4f6',
    borderRadius: 10,
    fontSize: 14,
    controlHeight: 38,
    fontFamily:
      "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Button: { fontWeight: 500, primaryShadow: 'none', defaultShadow: 'none', controlHeight: 38 },
  },
};
