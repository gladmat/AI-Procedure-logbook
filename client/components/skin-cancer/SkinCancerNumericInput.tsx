/**
 * SkinCancerNumericInput — Re-export of DraftNumericInput for backward compat.
 *
 * The implementation has been extracted to the generic DraftNumericInput.
 * This file keeps all existing skin-cancer imports working.
 */

export {
  DraftNumericInput as SkinCancerNumericInput,
  sanitizeNumericDraft,
  parseNumericDraft,
  formatNumericValue,
} from "@/components/DraftNumericInput";

export type { DraftNumericInputProps as SkinCancerNumericInputProps } from "@/components/DraftNumericInput";
