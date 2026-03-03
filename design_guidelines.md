# Opus — Design Guidelines

## Brand Identity

**Name:** Opus
**Tagline:** "Your life's work, documented."
**Aesthetic:** Charcoal + Amber. Dark-mode-first. Surgical precision meets digital elegance. Think Bloomberg Terminal meets Linear.

## Design System

### Charcoal + Amber Palette
- Dark mode primary. Light mode secondary.
- Amber accent < 10% of screen surface. Marks: CTAs, active states, selected items, the brand. Everything else is monochromatic.
- Full token definitions in `client/constants/theme.ts`

### Typography
- SF Pro (system font) for all in-app text
- SF Mono for numerical data in tables, dashboards, stats
- Weight variation for hierarchy, NOT color variation
- Brand/marketing: Satoshi Bold for headlines, Inter for web

### Specialty Colors
Each surgical specialty has a unique color used for badges, icons, and chart segments. Defined in `theme.specialty`. Colors are pastel on dark mode, deeper on light mode.

### Component Patterns
- **Cards**: `backgroundElevated` + `border` + `BorderRadius.md` (14px). No shadows in dark mode.
- **Primary buttons**: Amber background, charcoal text, 48pt min height
- **Secondary buttons**: Transparent, border emphasis, body text color
- **Badges/pills**: Specialty color at 15% opacity bg, full color text, full radius
- **Tab bar**: `backgroundDefault`, amber active indicator, textTertiary inactive
- **Touch targets**: 48x48pt minimum everywhere

### Logo
The Interrupted Circle — a geometric circle with a single precise gap. Amber stroke on charcoal. Represents the surgeon's deliberate intervention and the "O" of Opus.

### Navigation
Tab Bar (4 tabs): Dashboard (Cases), Add Case (+), Analytics, Settings
