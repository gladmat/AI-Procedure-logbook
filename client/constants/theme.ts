import { Platform } from "react-native";

// ── Raw Color Scales ─────────────────────────────────────────────────────────

export const palette = {
  charcoal: {
    950: "#0F1419",
    900: "#1A1F26",
    850: "#242B33",
    800: "#2E3740",
    750: "#3D4753",
    700: "#4B5563",
    500: "#64748B",
    400: "#94A3B8",
    200: "#E2E8F0",
    100: "#F1F5F9",
    50: "#F8FAFC",
  },
  amber: {
    900: "#78350F",
    700: "#B45309",
    600: "#D97706",
    500: "#F59E0B",
    200: "#FDE68A",
    50: "#FEF3C7",
  },
  white: "#FFFFFF",
  black: "#000000",
} as const;

// ── Theme Colors ─────────────────────────────────────────────────────────────

export const Colors = {
  light: {
    text: "#0F1419",
    textSecondary: "#475569",
    textTertiary: "#94A3B8",
    buttonText: "#0F1419",
    tabIconDefault: "#94A3B8",
    tabIconSelected: "#B45309",
    link: "#B45309",
    linkPressed: "#D97706",
    backgroundRoot: "#F8FAFC",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#F1F5F9",
    backgroundTertiary: "#E2E8F0",
    backgroundElevated: "#FFFFFF",
    success: "#16A34A",
    warning: "#EA580C",
    error: "#DC2626",
    info: "#0369A1",
    border: "#E2E8F0",
    cardShadow: "rgba(15,20,25,0.1)",
    rolePrimary: "#B45309",
    roleSupervising: "#7C3AED",
    roleAssistant: "#16A34A",
    roleTrainee: "#F59E0B",
  },
  dark: {
    text: "#F0F2F4",
    textSecondary: "#94A3B8",
    textTertiary: "#64748B",
    buttonText: "#0F1419",
    tabIconDefault: "#64748B",
    tabIconSelected: "#D97706",
    link: "#D97706",
    linkPressed: "#F59E0B",
    backgroundRoot: "#0F1419",
    backgroundDefault: "#1A1F26",
    backgroundSecondary: "#242B33",
    backgroundTertiary: "#2E3740",
    backgroundElevated: "#1A1F26",
    success: "#15803D",
    warning: "#FB923C",
    error: "#DC2626",
    info: "#0284C7",
    border: "#2E3740",
    cardShadow: "rgba(0,0,0,0.35)",
    rolePrimary: "#D97706",
    roleSupervising: "#A78BFA",
    roleAssistant: "#15803D",
    roleTrainee: "#FBBF24",
  },
};

// ── Spacing ──────────────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
  touchTarget: 48,
};

// ── Border Radius ────────────────────────────────────────────────────────────

export const BorderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  "2xl": 40,
  full: 9999,
};

// ── Typography ───────────────────────────────────────────────────────────────

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Typography = {
  display: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  bodySemibold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
    letterSpacing: 0.1,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  mono: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500" as const,
    fontFamily: Fonts?.mono,
  },
};

// ── Shadows ──────────────────────────────────────────────────────────────────

export const Shadows = {
  card: {
    shadowColor: palette.charcoal[950],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  floating: {
    shadowColor: palette.charcoal[950],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modal: {
    shadowColor: palette.charcoal[950],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
};
