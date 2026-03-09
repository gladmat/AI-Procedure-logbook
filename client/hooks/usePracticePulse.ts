import { useMemo } from "react";
import { Case } from "@/types/case";

export interface PracticePulseData {
  totalCases: {
    count: number;
  };
  thisWeek: {
    count: number;
    dailyDots: boolean[];
    todayIndex: number;
  };
  completion: {
    percentage: number;
  };
}

export function usePracticePulse(cases: Case[]): PracticePulseData {
  return useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // --- Total Cases (lifetime) ---
    const totalCount = cases.length;

    // --- This Week (ISO: Mon=0 .. Sun=6) ---
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Mon=0..Sun=6

    // Monday of current week
    const monday = new Date(today);
    monday.setDate(monday.getDate() - todayIndex);

    const dailyDots: boolean[] = [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];
    let thisWeekCount = 0;

    for (const c of cases) {
      const d = new Date(c.procedureDate);
      const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const diffMs = dDate.getTime() - monday.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 6) {
        dailyDots[diffDays] = true;
        thisWeekCount++;
      }
    }

    // --- Completion (last 90 days) ---
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    let totalLast90 = 0;
    let completedLast90 = 0;

    for (const c of cases) {
      const d = new Date(c.procedureDate);
      if (d >= ninetyDaysAgo) {
        totalLast90++;
        if (c.outcome != null) {
          completedLast90++;
        }
      }
    }

    const percentage =
      totalLast90 === 0 ? 0 : Math.round((completedLast90 / totalLast90) * 100);

    return {
      totalCases: { count: totalCount },
      thisWeek: { count: thisWeekCount, dailyDots, todayIndex },
      completion: { percentage },
    };
  }, [cases]);
}
