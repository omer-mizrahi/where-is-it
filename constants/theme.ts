/**
 * Theme colors for "איפה זה?" – Premium dark (navy/slate + blue primary).
 * RTL-first; use with textAlign: 'right' and writingDirection: 'rtl' where needed.
 */

import { Platform } from 'react-native';

const primaryBlue = '#3B82F6';
const tintColorLight = '#2563eb';
const tintColorDark = primaryBlue;

export const Colors = {
  light: {
    text: '#0f172a',
    background: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    muted: '#64748b',
    tint: tintColorLight,
    icon: '#64748b',
    tabIconDefault: '#64748b',
    tabIconSelected: tintColorLight,
    primary: primaryBlue,
  },
  dark: {
    text: '#ffffff',
    background: '#141824',
    card: '#1E2436',
    border: 'transparent',
    muted: '#94a3b8',
    tint: tintColorDark,
    icon: '#94a3b8',
    tabIconDefault: '#64748b',
    tabIconSelected: tintColorDark,
    primary: primaryBlue,
  },
};

/** RTL text and layout – use for headings, paragraphs, inputs */
export const RTL = {
  text: { textAlign: 'right' as const },
  input: { textAlign: 'right' as const, writingDirection: 'rtl' as const },
  row: { flexDirection: 'row' as const },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
