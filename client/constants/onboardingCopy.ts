// client/constants/onboardingCopy.ts
// All onboarding UI strings in one place. Components import from here — no hardcoded strings in JSX.

export const copy = {
  welcome: {
    appName: 'Opus',
    tagline: "Your life's work, documented.",
    cta: 'Get Started',
    signIn: 'Already have an account? Sign in',
  },

  features: {
    skip: 'Skip',
    continue: 'Continue',
    createAccount: 'Create Account',
    slides: [
      {
        headline: 'Log any case in under 60 seconds.',
        body: 'Procedure autocomplete, smart defaults, and structured SNOMED CT coding \u2014 built for the pace of a surgical day.',
      },
      {
        headline: "One case. The whole team's logbook.",
        body: 'Log once \u2014 every team member gets credit. Peer-verified cases, distributed logging, and no duplicate entry.',
      },
      {
        headline: 'One logbook. Every registry. Any country.',
        body: 'Opus captures a superset of data that satisfies the major plastic and hand surgery registries and training programmes worldwide. Export and filter exactly as each programme requires.',
      },
    ],
  },

  auth: {
    headline: 'Create your account',
    subhead: 'Your data is encrypted and never shared.',
    appleBtn: 'Sign in with Apple',
    divider: 'or',
    emailBtn: 'Continue with email',
    legal:
      'By continuing you agree to our Terms of Service and Privacy Policy.',
  },

  categories: {
    headline: 'What do you operate on?',
    subhead:
      "We'll surface the right procedures first. You can change this any time.",
    cta: 'Continue',
    skip: 'Skip for now',
  },

  training: {
    headline: 'Are you in a training programme?',
    subhead:
      "We'll format your exports to match your portfolio requirements.",
    cta: 'Continue',
    skip: 'Not in training \u2014 skip',
    options: [
      {
        id: 'iscp',
        label: 'ISCP',
        detail:
          'Intercollegiate Surgical Curriculum Programme (UK/Ireland)',
      },
      {
        id: 'febopras',
        label: 'FEBOPRAS',
        detail:
          'European Board of Plastic, Reconstructive and Aesthetic Surgery',
      },
      {
        id: 'acgme',
        label: 'ACGME',
        detail:
          'Accreditation Council for Graduate Medical Education (USA)',
      },
      {
        id: 'racs',
        label: 'RACS',
        detail: 'Royal Australasian College of Surgeons (ANZ)',
      },
      {
        id: 'other',
        label: 'Other',
        detail: 'Specify your programme',
      },
    ],
  },

  hospital: {
    headline: 'Where do you work?',
    subhead: 'This helps with regional coding and audit formats.',
    placeholder: 'Search hospital or institution\u2026',
    cta: 'Continue',
    skip: 'Skip for now',
  },

  privacy: {
    headline: 'Your data, your control.',
    points: [
      {
        icon: 'lock.shield.fill',
        title: 'End-to-end encrypted',
        detail:
          'AES-256 at rest. TLS 1.3 in transit. Your operative record stays yours.',
      },
      {
        icon: 'wifi.slash',
        title: 'Works offline',
        detail:
          "Log cases anywhere \u2014 theatre, ward, or ward round. Syncs when you're back online.",
      },
      {
        icon: 'nosign',
        title: 'No ads. No tracking. No data sales.',
        detail:
          'Ever. Opus is funded by subscriptions, not your data.',
      },
      {
        icon: 'cross.circle',
        title: 'Built for healthcare data standards',
        detail:
          'Designed to support GDPR, HIPAA, and NZ Health Information Privacy Code.',
      },
    ],
    closing:
      "Built by surgeons, for surgeons. Your operative record is your legacy \u2014 we treat it that way.",
    cta: 'Start logging',
  },
} as const;
