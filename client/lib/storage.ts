import AsyncStorage from "@react-native-async-storage/async-storage";
import { Case, TimelineEvent, CountryCode } from "@/types/case";

const CASES_KEY = "@surgical_logbook_cases";
const TIMELINE_KEY = "@surgical_logbook_timeline";
const USER_KEY = "@surgical_logbook_user";
const SETTINGS_KEY = "@surgical_logbook_settings";
const CASE_DRAFT_KEY_PREFIX = "@surgical_logbook_case_draft_";

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
    const data = await AsyncStorage.getItem(CASES_KEY);
    if (!data) return [];
    return JSON.parse(data);
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
    
    await AsyncStorage.setItem(CASES_KEY, JSON.stringify(cases));
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

export async function deleteCase(id: string): Promise<void> {
  try {
    const cases = await getCases();
    const filtered = cases.filter((c) => c.id !== id);
    await AsyncStorage.setItem(CASES_KEY, JSON.stringify(filtered));
    
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
