export interface TrainingOption {
  id: string;
  name: string;
  detail?: string;
}

export const TRAINING_OPTIONS: TrainingOption[] = [
  {
    id: "iscp",
    name: "ISCP",
    detail: "Intercollegiate Surgical Curriculum Programme (UK/Ireland)",
  },
  {
    id: "febopras",
    name: "FEBOPRAS",
    detail: "European Board of Plastic, Reconstructive and Aesthetic Surgery",
  },
  {
    id: "acgme",
    name: "ACGME",
    detail: "Accreditation Council for Graduate Medical Education (USA)",
  },
  {
    id: "racs",
    name: "RACS",
    detail: "Royal Australasian College of Surgeons (ANZ)",
  },
  { id: "other", name: "Other" },
  { id: "none", name: "Not currently in training" },
];
