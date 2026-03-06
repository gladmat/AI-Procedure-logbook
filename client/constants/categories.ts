// client/constants/categories.ts
// 12 procedure categories — locked taxonomy

export const PROCEDURE_CATEGORIES = [
  { id: 'breast', label: 'Breast' },
  { id: 'hand_wrist', label: 'Hand & Wrist' },
  { id: 'head_neck', label: 'Head & Neck' },
  { id: 'cleft_cranio', label: 'Cleft & Craniofacial' },
  { id: 'skin_cancer', label: 'Skin Cancer' },
  { id: 'orthoplastic', label: 'Orthoplastic & Limb' },
  { id: 'burns', label: 'Burns' },
  { id: 'lymphoedema', label: 'Lymphoedema' },
  { id: 'body_contouring', label: 'Body Contouring' },
  { id: 'aesthetics', label: 'Aesthetics' },
  { id: 'peripheral_nerve', label: 'Peripheral Nerve' },
  { id: 'general', label: 'General / Other' },
] as const;

export type CategoryId = (typeof PROCEDURE_CATEGORIES)[number]['id'];
