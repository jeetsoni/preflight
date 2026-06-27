import type { ThemeConfig } from 'antd';

/**
 * Ant Design theme tokens lifted directly from Jiga's live app (read off their
 * CSS custom properties), so this tool renders in their exact visual language:
 *   --colorPrimary / --main-color: #01b39e
 *   --textColorPrimary: #000000e0   --textColorSecondary: #00000073
 *   --borderColor: #d9d9d9
 */
export const jigaTheme: ThemeConfig = {
  token: {
    colorPrimary: '#01b39e',
    colorInfo: '#01b39e',
    colorText: 'rgba(0, 0, 0, 0.88)',
    colorTextSecondary: 'rgba(0, 0, 0, 0.45)',
    colorBorder: '#d9d9d9',
    borderRadius: 6,
    fontSize: 14,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
};
