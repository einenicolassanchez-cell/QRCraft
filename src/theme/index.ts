import { Platform } from 'react-native';

export const colors = {
  background: '#0F172A',
  backgroundDeep: '#080F1F',
  surface: '#1E293B',
  surfaceRaised: '#263449',
  surfaceSoft: '#172033',
  primary: '#0284C7',
  primaryBright: '#38BDF8',
  accent: '#10B981',
  accentSoft: 'rgba(16, 185, 129, 0.16)',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textFaint: '#64748B',
  border: '#334155',
  borderSoft: 'rgba(148, 163, 184, 0.14)',
  danger: '#EF4444',
  dangerSoft: 'rgba(239, 68, 68, 0.14)',
  warning: '#F59E0B',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(2, 6, 23, 0.78)',
  transparent: 'transparent',
} as const;

export const gradients = {
  brand: ['#0284C7', '#0E7490'] as const,
  accent: ['#059669', '#10B981'] as const,
  pro: ['#0284C7', '#10B981'] as const,
  cameraTop: ['rgba(8, 15, 31, 0.96)', 'rgba(8, 15, 31, 0.55)', 'transparent'] as const,
  cameraBottom: ['transparent', 'rgba(8, 15, 31, 0.82)', 'rgba(8, 15, 31, 0.98)'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 32,
  full: 999,
} as const;

export const typography = {
  hero: {
    fontSize: 30,
    fontWeight: '800' as const,
    letterSpacing: -0.6,
    color: colors.text,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    letterSpacing: -0.4,
    color: colors.text,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  subheading: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  caption: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.textFaint,
    letterSpacing: 0.4,
  },
} as const;

export const shadow = {
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.24,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 4 },
    default: {},
  }),
  floating: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.36,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
    },
    android: { elevation: 10 },
    default: {},
  }),
};

export const QR_COLORS = [
  '#0F172A',
  '#000000',
  '#0284C7',
  '#0369A1',
  '#0E7490',
  '#2563EB',
  '#4338CA',
  '#6D28D9',
  '#10B981',
  '#047857',
  '#4D7C0F',
  '#7C3AED',
  '#DC2626',
  '#B91C1C',
  '#DB2777',
  '#BE185D',
  '#EA580C',
  '#A16207',
  '#78350F',
  '#475569',
] as const;

export const QR_BACKGROUNDS = [
  '#FFFFFF',
  '#F8FAFC',
  '#E2E8F0',
  '#DBEAFE',
  '#E0F2FE',
  '#CFFAFE',
  '#DCFCE7',
  '#D1FAE5',
  '#ECFCCB',
  '#FEF3C7',
  '#FFEDD5',
  '#FCE7F3',
  '#EDE9FE',
] as const;
