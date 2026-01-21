import AsyncStorage from "@react-native-async-storage/async-storage";
import { Case, TimelineEvent, CountryCode, ComplicationEntry } from "@/types/case";
import { encryptData, decryptData, isEncrypted } from "./encryption";

const CASES_KEY = "@surgical_logbook_cases";
const TIMELINE_KEY = "@surgical_logbook_timeline";
const USER_KEY = "@surgical_logbook_user";
const SETTINGS_KEY = "@surgical_logbook_settings";
const CASE_DRAFT_KEY_PREFIX = "@surgical_logbook_case_draft_";
const ENCRYPTED_CASES_KEY = "@surgical_logbook_cases_encrypted";

export interface LocalUser {
  id: string;
  name: string;
  email?: string;
}

export interface AppSettings {
  countryCode: CountryCode;
  defaultFacility?: string;
  showLocalCodes: boolean;
  exportFormat: "json" | "csv" | "fhir";
}

export type CaseDraft = Partial<Case>;

export async function getCases(): Promise<Case[]> {
  try {
    const encryptedData = await AsyncStorage.getItem(ENCRYPTED_CASES_KEY);
    if (encryptedData) {
      const decrypted = await decryptData(encryptedData);
      return JSON.parse(decrypted);
    }
    
    const legacyData = await AsyncStorage.getItem(CASES_KEY);
    if (legacyData) {
      const cases = JSON.parse(legacyData);
      const encrypted = await encryptData(JSON.stringify(cases));
      await AsyncStorage.setItem(ENCRYPTED_CASES_KEY, encrypted);
      await AsyncStorage.removeItem(CASES_KEY);
      return cases;
    }
    
    return [];
  } catch (error) {
    console.error("Error reading cases:", error);
    return [];
  }
}

export async function getCase(id: string): Promise<Case | null> {
  const cases = await getCases();
  return cases.find((c) => c.id === id) || null;
}

export async function saveCase(caseData: Case): Promise<void> {
  try {
    const cases = await getCases();
    const existingIndex = cases.findIndex((c) => c.id === caseData.id);
    
    if (existingIndex >= 0) {
      cases[existingIndex] = { ...caseData, updatedAt: new Date().toISOString() };
    } else {
      cases.unshift(caseData);
    }
    
    const encrypted = await encryptData(JSON.stringify(cases));
    await AsyncStorage.setItem(ENCRYPTED_CASES_KEY, encrypted);
  } catch (error) {
    console.error("Error saving case:", error);
    throw error;
  }
}

function getCaseDraftKey(specialty: Case["specialty"]): string {
  return `${CASE_DRAFT_KEY_PREFIX}${specialty}`;
}

export async function getCaseDraft(specialty: Case["specialty"]): Promise<CaseDraft | null> {
  try {
    const data = await AsyncStorage.getItem(getCaseDraftKey(specialty));
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading case draft:", error);
    return null;
  }
}

export async function saveCaseDraft(
  specialty: Case["specialty"],
  draft: CaseDraft
): Promise<void> {
  try {
    await AsyncStorage.setItem(getCaseDraftKey(specialty), JSON.stringify(draft));
  } catch (error) {
    console.error("Error saving case draft:", error);
    throw error;
  }
}

export async function clearCaseDraft(specialty: Case["specialty"]): Promise<void> {
  try {
    await AsyncStorage.removeItem(getCaseDraftKey(specialty));
  } catch (error) {
    console.error("Error clearing case draft:", error);
    throw error;
  }
}

export async function updateCase(id: string, updates: Partial<Case>): Promise<void> {
  try {
    const cases = await getCases();
    const index = cases.findIndex((c) => c.id === id);
    if (index >= 0) {
      cases[index] = { 
        ...cases[index], 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      const encrypted = await encryptData(JSON.stringify(cases));
      await AsyncStorage.setItem(ENCRYPTED_CASES_KEY, encrypted);
    }
  } catch (error) {
    console.error("Error updating case:", error);
    throw error;
  }
}

export function getCasesPendingFollowUp(cases: Case[]): Case[] {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return cases.filter((c) => {
    if (c.complicationsReviewed) return false;
    const procedureDate = new Date(c.procedureDate);
    return procedureDate <= thirtyDaysAgo;
  });
}

export async function markNoComplications(caseId: string): Promise<void> {
  await updateCase(caseId, {
    complicationsReviewed: true,
    complicationsReviewedAt: new Date().toISOString(),
    hasComplications: false,
    complications: [],
  });
}

export async function findCasesByPatientId(patientId: string): Promise<Case[]> {
  const cases = await getCases();
  const normalizedId = patientId.toUpperCase().replace(/\s/g, "");
  return cases.filter((c) => {
    const casePatientId = c.patientIdentifier?.toUpperCase().replace(/\s/g, "") || "";
    return casePatientId === normalizedId;
  });
}

export async function findCaseByPatientIdAndDate(
  patientId: string,
  procedureDate: string
): Promise<Case | null> {
  const matches = await findCasesByPatientId(patientId);
  if (matches.length === 0) return null;
  
  const targetDate = new Date(procedureDate).toDateString();
  const exactMatch = matches.find((c) => {
    const caseDate = new Date(c.procedureDate).toDateString();
    return caseDate === targetDate;
  });
  
  if (exactMatch) return exactMatch;
  
  const withinWeek = matches.filter((c) => {
    const caseDate = new Date(c.procedureDate);
    const target = new Date(procedureDate);
    const diffDays = Math.abs(caseDate.getTime() - target.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  });
  
  if (withinWeek.length === 1) return withinWeek[0];
  
  return null;
}

export async function recordComplications(
  caseId: string,
  complications: ComplicationEntry[]
): Promise<void> {
  await updateCase(caseId, {
    complicationsReviewed: true,
    complicationsReviewedAt: new Date().toISOString(),
    hasComplications: complications.length > 0,
    complications,
  });
}

export async function deleteCase(id: string): Promise<void> {
  try {
    const cases = await getCases();
    const filtered = cases.filter((c) => c.id !== id);
    const encrypted = await encryptData(JSON.stringify(filtered));
    await AsyncStorage.setItem(ENCRYPTED_CASES_KEY, encrypted);
    
    const events = await getTimelineEvents(id);
    for (const event of events) {
      await deleteTimelineEvent(event.id);
    }
  } catch (error) {
    console.error("Error deleting case:", error);
    throw error;
  }
}

export async function getTimelineEvents(caseId: string): Promise<TimelineEvent[]> {
  try {
    const data = await AsyncStorage.getItem(TIMELINE_KEY);
    if (!data) return [];
    const allEvents: TimelineEvent[] = JSON.parse(data);
    return allEvents.filter((e) => e.caseId === caseId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("Error reading timeline events:", error);
    return [];
  }
}

export async function saveTimelineEvent(event: TimelineEvent): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(TIMELINE_KEY);
    const events: TimelineEvent[] = data ? JSON.parse(data) : [];
    events.unshift(event);
    await AsyncStorage.setItem(TIMELINE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error("Error saving timeline event:", error);
    throw error;
  }
}

export async function deleteTimelineEvent(id: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(TIMELINE_KEY);
    if (!data) return;
    const events: TimelineEvent[] = JSON.parse(data);
    const filtered = events.filter((e) => e.id !== id);
    await AsyncStorage.setItem(TIMELINE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting timeline event:", error);
    throw error;
  }
}

export async function getLocalUser(): Promise<LocalUser | null> {
  try {
    const data = await AsyncStorage.getItem(USER_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading user:", error);
    return null;
  }
}

export async function saveLocalUser(user: LocalUser): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Error saving user:", error);
    throw error;
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([CASES_KEY, TIMELINE_KEY, USER_KEY, SETTINGS_KEY]);
  } catch (error) {
    console.error("Error clearing data:", error);
    throw error;
  }
}

export async function exportCasesAsJSON(): Promise<string> {
  const cases = await getCases();
  return JSON.stringify(cases, null, 2);
}

const DEFAULT_SETTINGS: AppSettings = {
  countryCode: "GB",
  showLocalCodes: true,
  exportFormat: "json",
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (error) {
    console.error("Error reading settings:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  try {
    const current = await getSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
}

export async function getCountryCode(): Promise<CountryCode> {
  const settings = await getSettings();
  return settings.countryCode;
}
