# Surgical Logbook - Design Guidelines

## Brand Identity

**Purpose**: A privacy-first surgical logbook that empowers surgeons to efficiently document complex procedures while maintaining absolute patient confidentiality.

**Aesthetic Direction**: **Clinical Precision** - Clean, authoritative, and trustworthy. Think "operating room sterility meets digital elegance." High contrast for readability in clinical environments, spacious layouts to prevent input errors, and subtle visual cues that reinforce privacy and data security.

**Memorable Element**: The "Smart Capture" camera interface with a live privacy indicator showing real-time redaction of sensitive data before AI processing.

## Navigation Architecture

**Root Navigation**: Tab Bar (4 tabs)
- Dashboard (Cases icon)
- Add Case (Plus icon in center, elevated)
- Analytics (Chart icon)
- Settings (Gear icon)

**Core Action**: Add Case - floating action button when on Dashboard screen, dedicated tab otherwise.

**Screen Hierarchy**:
- Dashboard Stack: Dashboard → Case Detail → Timeline Events
- Add Case Stack: Specialty Selection → Smart Capture → Case Form → Review
- Analytics Stack: Analytics Overview → Specialty-Specific Trends
- Settings Stack: Settings → Profile → Export Data → About

## Screen-by-Screen Specifications

### Dashboard Screen
- **Purpose**: Quick overview of all logged cases with filtering by specialty
- **Header**: Transparent, large title "Cases", right button: Filter icon
- **Layout**: 
  - Scrollable root view with top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
  - Specialty filter chips (horizontal scroll, pills with specialty icons)
  - Card list: Each case card shows patient ID, specialty badge, procedure type, date, your role badge
- **Empty State**: Illustration of operation notes with "No Cases Yet" message
- **Pull-to-refresh**: Enabled

### Add Case - Smart Capture Screen
- **Purpose**: Photograph operation note with live privacy preview
- **Header**: Custom, semi-transparent overlay, left: Back, right: Manual Entry
- **Layout**:
  - Full-screen camera view with safe area guide overlay
  - Bottom sheet (floating): Privacy status indicator, Capture button (large, 72px), Gallery button
  - Real-time OCR preview with redacted sections highlighted in yellow
- **Feedback**: Haptic pulse on successful capture, green check animation

### Add Case - Form Screen
- **Purpose**: Review and edit AI-extracted data
- **Header**: Default navigation, title: "Free Flap Details", right: Save
- **Layout**:
  - Scrollable form with top inset: Spacing.xl (header is opaque)
  - Bottom inset: insets.bottom + Spacing.xl
  - Sections: Patient Info, Risk Factors, Flap Details, Team Members
  - Large touch targets (48px minimum height)
  - Number inputs trigger native numeric keyboards
  - Team members: List with role pills, Add Team Member button at bottom
- **Submit**: Save button in header (primary blue)

### Case Detail Screen
- **Purpose**: Read-only comprehensive view of logged case
- **Header**: Default navigation, title: Patient ID, right: Share icon (exports PDF)
- **Layout**:
  - Scrollable root view with top inset: Spacing.xl
  - Hero section: Specialty badge, procedure date, facility
  - Team roster cards showing roles with confirmation status
  - Expandable sections: Risk Factors, Clinical Details (specialty-specific), Timeline
  - Bottom floating button: Add Timeline Event
- **Empty Timeline**: Illustration of calendar with "No events yet"

### Settings Screen
- **Purpose**: App configuration and data management
- **Header**: Default navigation, title: "Settings"
- **Layout**:
  - Scrollable list with grouped sections
  - Sections: Profile (avatar, name), Data (Export, Backup), Privacy, About
  - Export button: Secondary style with icon
  - Destructive actions (Clear Data) at bottom with warning color

## Color Palette

**Primary**: `#0056D2` (Medical Blue) - Trust, professionalism
**Primary Pressed**: `#003D99` (Darker blue)

**Background**: `#FFFFFF` (White)
**Surface**: `#F8F9FB` (Light gray) - Card backgrounds
**Surface Elevated**: `#FFFFFF` with subtle shadow

**Text Primary**: `#1A1A1A` (Near black)
**Text Secondary**: `#6B7280` (Medium gray)
**Text Tertiary**: `#9CA3AF` (Light gray)

**Semantic Colors**:
- Success: `#059669` (Green) - Confirmed team members, successful captures
- Warning: `#F59E0B` (Amber) - Privacy redaction highlights
- Error: `#DC2626` (Red) - Validation errors
- Info: `#3B82F6` (Blue) - Informational badges

**Role Badges**:
- Primary Surgeon: `#0056D2` (Primary blue)
- Supervising: `#7C3AED` (Purple)
- Assistant: `#059669` (Green)
- Trainee: `#F59E0B` (Amber)

## Typography

**Font**: System font (SF Pro for iOS, Roboto for Android) - Maximum legibility in clinical settings

**Type Scale**:
- **Display**: 32px, Bold - Screen titles
- **Heading 1**: 24px, Semibold - Section headers
- **Heading 2**: 20px, Semibold - Card titles
- **Body**: 16px, Regular - Primary content
- **Body Semibold**: 16px, Semibold - Emphasized content
- **Caption**: 14px, Regular - Secondary info
- **Label**: 12px, Medium, Uppercase - Input labels, badges

## Visual Design

**Touch Targets**: Minimum 48px height, 56px for primary actions
**Corner Radius**: 12px for cards, 8px for buttons, 24px for pills/badges
**Spacing Scale**: xs:4px, sm:8px, md:12px, lg:16px, xl:24px, xxl:32px

**Shadows**:
- Card: shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 3
- Floating Button: shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.15, shadowRadius: 8
- Modal: shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.20, shadowRadius: 16

**Buttons**:
- Primary: Filled with Primary color, white text, subtle shadow
- Secondary: Border with Primary color, Primary text, no fill
- Haptic feedback on all touchable elements

**Icons**: Feather icons from @expo/vector-icons, 24px default size

## Assets to Generate

**icon.png** - App icon featuring a stylized surgical scalpel crossed with a pen/document, Medical Blue gradient
**WHERE USED**: Device home screen

**splash-icon.png** - Simplified version of app icon on white background
**WHERE USED**: App launch screen

**empty-cases.png** - Minimalist illustration of operation notes/surgical clipboard
**WHERE USED**: Dashboard when no cases exist

**empty-timeline.png** - Simple calendar icon with checkmark
**WHERE USED**: Case detail screen when no timeline events

**privacy-shield.png** - Shield icon with lock symbol, subtle blue gradient
**WHERE USED**: Smart Capture screen, Settings privacy section

**specialty-free-flap.png** - Icon representing microsurgery/blood vessel
**WHERE USED**: Specialty badges, filter chips

**specialty-hand.png** - Icon representing hand/fingers
**WHERE USED**: Specialty badges (future module)

**specialty-body.png** - Icon representing body contour
**WHERE USED**: Specialty badges (future module)

**onboarding-camera.png** - Illustration showing phone camera capturing operation note
**WHERE USED**: First-time onboarding screen explaining Smart Capture