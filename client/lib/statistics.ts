import { Case, Specialty, Role, FreeFlapDetails, ClavienDindoGrade } from "@/types/case";

export type TimePeriod = "all_time" | "this_year" | "last_6_months" | "last_12_months" | "custom";

export interface StatisticsFilters {
  specialty: Specialty | "all";
  timePeriod: TimePeriod;
  customStartDate?: string;
  customEndDate?: string;
  facility: string | "all";
  role: Role | "all";
}

export interface BaseStatistics {
  totalCases: number;
  averageDurationMinutes: number | null;
  complicationRate: number;
  casesByMonth: { month: string; count: number }[];
  casesByFacility: { facility: string; count: number }[];
  followUpCompletionRate: number;
}

export interface FreeFlapStatistics extends BaseStatistics {
  flapSurvivalRate: number;
  averageIschemiaTimeMinutes: number | null;
  casesByFlapType: { flapType: string; count: number }[];
  casesByIndication: { indication: string; count: number }[];
  takeBackRate: number;
}

export interface HandTraumaStatistics extends BaseStatistics {
  casesByInjuryMechanism: { mechanism: string; count: number }[];
  nerveRepairCount: number;
  tendonRepairCount: number;
}

export interface BodyContouringStatistics extends BaseStatistics {
  averageResectionWeightGrams: number | null;
}

export type SpecialtyStatistics = BaseStatistics | FreeFlapStatistics | HandTraumaStatistics | BodyContouringStatistics;

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  all_time: "All Time",
  this_year: "This Year",
  last_6_months: "Last 6 Months",
  last_12_months: "Last 12 Months",
  custom: "Custom Range",
};

export const ROLE_FILTER_LABELS: Record<Role | "all", string> = {
  all: "All Roles",
  primary: "Primary Surgeon",
  supervising: "Teaching/Supervising",
  assistant: "Assistant",
  trainee: "Trainee",
};

function isWithinTimePeriod(dateString: string, timePeriod: TimePeriod, customStart?: string, customEnd?: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  
  switch (timePeriod) {
    case "all_time":
      return true;
    case "this_year":
      return date.getFullYear() === now.getFullYear();
    case "last_6_months": {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return date >= sixMonthsAgo;
    }
    case "last_12_months": {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      return date >= twelveMonthsAgo;
    }
    case "custom":
      if (customStart && customEnd) {
        const start = new Date(customStart);
        const end = new Date(customEnd);
        return date >= start && date <= end;
      }
      return true;
    default:
      return true;
  }
}

function getPrimaryRole(caseData: Case): Role {
  if (caseData.procedures && caseData.procedures.length > 0) {
    return caseData.procedures[0].surgeonRole;
  }
  if (caseData.teamMembers && caseData.teamMembers.length > 0) {
    const primary = caseData.teamMembers.find(m => m.role === "primary");
    if (primary) return "primary";
    const supervising = caseData.teamMembers.find(m => m.role === "supervising");
    if (supervising) return "supervising";
  }
  return "primary";
}

export function filterCases(cases: Case[], filters: StatisticsFilters): Case[] {
  return cases.filter(c => {
    if (filters.specialty !== "all" && c.specialty !== filters.specialty) {
      return false;
    }
    
    if (!isWithinTimePeriod(c.procedureDate, filters.timePeriod, filters.customStartDate, filters.customEndDate)) {
      return false;
    }
    
    if (filters.facility !== "all" && c.facility !== filters.facility) {
      return false;
    }
    
    if (filters.role !== "all") {
      const caseRole = getPrimaryRole(c);
      if (caseRole !== filters.role) {
        return false;
      }
    }
    
    return true;
  });
}

export function calculateBaseStatistics(cases: Case[]): BaseStatistics {
  const totalCases = cases.length;
  
  const durationsMinutes = cases
    .map(c => c.surgeryTiming?.durationMinutes)
    .filter((d): d is number => d !== undefined && d !== null && d > 0);
  
  const averageDurationMinutes = durationsMinutes.length > 0
    ? Math.round(durationsMinutes.reduce((a, b) => a + b, 0) / durationsMinutes.length)
    : null;
  
  const casesWithComplications = cases.filter(c => 
    c.hasComplications === true || 
    (c.complications && c.complications.length > 0) ||
    c.returnToTheatre === true
  ).length;
  const complicationRate = totalCases > 0 ? (casesWithComplications / totalCases) * 100 : 0;
  
  const casesByMonthMap = new Map<string, number>();
  cases.forEach(c => {
    const date = new Date(c.procedureDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    casesByMonthMap.set(monthKey, (casesByMonthMap.get(monthKey) || 0) + 1);
  });
  const casesByMonth = Array.from(casesByMonthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([month, count]) => ({ month, count }));
  
  const casesByFacilityMap = new Map<string, number>();
  cases.forEach(c => {
    if (c.facility) {
      casesByFacilityMap.set(c.facility, (casesByFacilityMap.get(c.facility) || 0) + 1);
    }
  });
  const casesByFacility = Array.from(casesByFacilityMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([facility, count]) => ({ facility, count }));
  
  const casesNeedingFollowUp = cases.filter(c => {
    const daysSinceProcedure = Math.floor(
      (Date.now() - new Date(c.procedureDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceProcedure >= 30;
  });
  const casesWithFollowUpComplete = casesNeedingFollowUp.filter(c => c.complicationsReviewed === true);
  const followUpCompletionRate = casesNeedingFollowUp.length > 0
    ? (casesWithFollowUpComplete.length / casesNeedingFollowUp.length) * 100
    : 100;
  
  return {
    totalCases,
    averageDurationMinutes,
    complicationRate,
    casesByMonth,
    casesByFacility,
    followUpCompletionRate,
  };
}

export function calculateFreeFlapStatistics(cases: Case[]): FreeFlapStatistics {
  const base = calculateBaseStatistics(cases);
  
  const freeFlapCases = cases.filter(c => c.specialty === "free_flap");
  
  const casesWithOutcome = freeFlapCases.filter(c => {
    const complications = c.complications || [];
    const hasFlapLoss = complications.some(comp => 
      comp.description.toLowerCase().includes("flap loss") ||
      comp.description.toLowerCase().includes("total loss") ||
      comp.clavienDindoGrade === "V"
    );
    return c.complicationsReviewed || hasFlapLoss;
  });
  
  const flapLossCases = casesWithOutcome.filter(c => {
    const complications = c.complications || [];
    return complications.some(comp => 
      comp.description.toLowerCase().includes("flap loss") ||
      comp.description.toLowerCase().includes("total loss")
    );
  });
  
  const flapSurvivalRate = casesWithOutcome.length > 0
    ? ((casesWithOutcome.length - flapLossCases.length) / casesWithOutcome.length) * 100
    : 100;
  
  const ischemiaTimesMinutes = freeFlapCases
    .map(c => {
      if (c.procedures) {
        for (const proc of c.procedures) {
          const details = proc.clinicalDetails as FreeFlapDetails | undefined;
          if (details?.ischemiaTimeMinutes) {
            return details.ischemiaTimeMinutes;
          }
        }
      }
      const details = c.clinicalDetails as FreeFlapDetails | undefined;
      return details?.ischemiaTimeMinutes;
    })
    .filter((t): t is number => t !== undefined && t !== null && t > 0);
  
  const averageIschemiaTimeMinutes = ischemiaTimesMinutes.length > 0
    ? Math.round(ischemiaTimesMinutes.reduce((a, b) => a + b, 0) / ischemiaTimesMinutes.length)
    : null;
  
  const flapTypeMap = new Map<string, number>();
  freeFlapCases.forEach(c => {
    const flapType = c.procedureType || "Unknown";
    flapTypeMap.set(flapType, (flapTypeMap.get(flapType) || 0) + 1);
  });
  const casesByFlapType = Array.from(flapTypeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([flapType, count]) => ({ flapType, count }));
  
  const indicationMap = new Map<string, number>();
  freeFlapCases.forEach(c => {
    let indication = "Unknown";
    if (c.procedures) {
      for (const proc of c.procedures) {
        const details = proc.clinicalDetails as FreeFlapDetails | undefined;
        if (details?.indication) {
          indication = details.indication;
          break;
        }
      }
    } else {
      const details = c.clinicalDetails as FreeFlapDetails | undefined;
      if (details?.indication) indication = details.indication;
    }
    indicationMap.set(indication, (indicationMap.get(indication) || 0) + 1);
  });
  const casesByIndication = Array.from(indicationMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([indication, count]) => ({ indication, count }));
  
  const takeBackCases = freeFlapCases.filter(c => c.returnToTheatre === true);
  const takeBackRate = freeFlapCases.length > 0
    ? (takeBackCases.length / freeFlapCases.length) * 100
    : 0;
  
  return {
    ...base,
    flapSurvivalRate,
    averageIschemiaTimeMinutes,
    casesByFlapType,
    casesByIndication,
    takeBackRate,
  };
}

export function calculateHandTraumaStatistics(cases: Case[]): HandTraumaStatistics {
  const base = calculateBaseStatistics(cases);
  
  const handTraumaCases = cases.filter(c => c.specialty === "hand_trauma");
  
  const mechanismMap = new Map<string, number>();
  handTraumaCases.forEach(c => {
    const procedureType = c.procedureType || "Unknown";
    mechanismMap.set(procedureType, (mechanismMap.get(procedureType) || 0) + 1);
  });
  const casesByInjuryMechanism = Array.from(mechanismMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([mechanism, count]) => ({ mechanism, count }));
  
  const nerveRepairCount = handTraumaCases.filter(c => 
    c.procedureType?.toLowerCase().includes("nerve")
  ).length;
  
  const tendonRepairCount = handTraumaCases.filter(c => 
    c.procedureType?.toLowerCase().includes("tendon")
  ).length;
  
  return {
    ...base,
    casesByInjuryMechanism,
    nerveRepairCount,
    tendonRepairCount,
  };
}

export function calculateBodyContouringStatistics(cases: Case[]): BodyContouringStatistics {
  const base = calculateBaseStatistics(cases);
  
  const bodyContouringCases = cases.filter(c => c.specialty === "body_contouring");
  
  const resectionWeights: number[] = [];
  bodyContouringCases.forEach(c => {
    if (c.procedures) {
      c.procedures.forEach(proc => {
        const details = proc.clinicalDetails as { resectionWeightGrams?: number } | undefined;
        if (details?.resectionWeightGrams) {
          resectionWeights.push(details.resectionWeightGrams);
        }
      });
    }
  });
  
  const averageResectionWeightGrams = resectionWeights.length > 0
    ? Math.round(resectionWeights.reduce((a, b) => a + b, 0) / resectionWeights.length)
    : null;
  
  return {
    ...base,
    averageResectionWeightGrams,
  };
}

export function calculateStatistics(cases: Case[], specialty: Specialty | "all"): SpecialtyStatistics {
  switch (specialty) {
    case "free_flap":
      return calculateFreeFlapStatistics(cases);
    case "hand_trauma":
      return calculateHandTraumaStatistics(cases);
    case "body_contouring":
      return calculateBodyContouringStatistics(cases);
    default:
      return calculateBaseStatistics(cases);
  }
}

export function getUniqueFacilities(cases: Case[]): string[] {
  const facilities = new Set<string>();
  cases.forEach(c => {
    if (c.facility) {
      facilities.add(c.facility);
    }
  });
  return Array.from(facilities).sort();
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}
