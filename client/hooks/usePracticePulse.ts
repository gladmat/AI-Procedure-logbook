import { useMemo } from "react";
import { Case } from "@/types/case";
import type { CaseSummary } from "@/types/caseSummary";
import {
  calculatePracticePulse,
  type PracticePulseData,
} from "@/lib/dashboardSelectors";

export type { PracticePulseData } from "@/lib/dashboardSelectors";

export function usePracticePulse(
  cases: (Case | CaseSummary)[],
): PracticePulseData {
  return useMemo(() => calculatePracticePulse(cases), [cases]);
}
