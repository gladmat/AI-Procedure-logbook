import { useMemo } from "react";
import { Case } from "@/types/case";
import {
  calculatePracticePulse,
  type PracticePulseData,
} from "@/lib/dashboardSelectors";

export type { PracticePulseData } from "@/lib/dashboardSelectors";

export function usePracticePulse(cases: Case[]): PracticePulseData {
  return useMemo(() => calculatePracticePulse(cases), [cases]);
}
