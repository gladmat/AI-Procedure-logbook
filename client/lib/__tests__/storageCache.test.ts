import { beforeEach, describe, expect, it, vi } from "vitest";
import { setActiveUserId } from "../activeUser";

import type { Case, DiagnosisGroup, Specialty } from "@/types/case";
import type { CaseSummary } from "@/types/caseSummary";

const asyncStorageState = new Map<string, string>();
const asyncStorageReads: string[] = [];

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => {
      asyncStorageReads.push(key);
      return asyncStorageState.get(key) ?? null;
    }),
    setItem: vi.fn(async (key: string, value: string) => {
      asyncStorageState.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      asyncStorageState.delete(key);
    }),
    multiRemove: vi.fn(async (keys: string[]) => {
      for (const key of keys) {
        asyncStorageState.delete(key);
      }
    }),
    getAllKeys: vi.fn(async () => [...asyncStorageState.keys()]),
  },
}));

vi.mock("react-native", () => ({
  InteractionManager: {
    runAfterInteractions: (callback: () => void) => {
      callback();
      return { cancel: vi.fn() };
    },
  },
}));

vi.mock("expo-crypto", () => ({
  digestStringAsync: vi.fn(async () => "legacy-hash"),
  getRandomBytesAsync: vi.fn(async (size: number) => new Uint8Array(size)),
  CryptoDigestAlgorithm: {
    SHA256: "sha256",
  },
  CryptoEncoding: {
    HEX: "hex",
  },
}));

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => {}),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
}));

vi.mock("@noble/hashes/hmac.js", () => ({
  hmac: vi.fn(() => new Uint8Array(32)),
}));

vi.mock("@noble/hashes/sha2.js", () => ({
  sha256: {},
}));

vi.mock("@noble/hashes/utils.js", () => ({
  bytesToHex: vi.fn(() => "hmac-hash"),
  hexToBytes: vi.fn(() => new Uint8Array(32)),
  randomBytes: vi.fn(() => new Uint8Array(32)),
  utf8ToBytes: vi.fn(() => new Uint8Array(0)),
}));

vi.mock("@/lib/encryption", () => ({
  decryptData: vi.fn(async (value: string) => value),
  encryptData: vi.fn(async (value: string) => value),
}));

vi.mock("@/lib/mediaStorage", () => ({
  canonicalizePersistedMediaUris: vi.fn(async (value: unknown) => value),
  clearAllMediaStorage: vi.fn(async () => {}),
  deleteMultipleEncryptedMedia: vi.fn(async () => {}),
}));

const TEST_USER_ID = "test-user-00000000-0000-0000-0000";
const CASE_INDEX_KEY = `@surgical_logbook_case_index::${TEST_USER_ID}`;
const CASE_PREFIX = `@surgical_logbook_case_`;
const CASE_SPECIALTY_REPAIR_KEY = "@surgical_logbook_case_specialty_repair_v1";
const CASE_SUMMARIES_KEY = `@surgical_logbook_case_summaries_v1::${TEST_USER_ID}`;

function scopedCaseKey(caseId: string): string {
  return `${CASE_PREFIX}${caseId}::${TEST_USER_ID}`;
}

function makeDiagnosisGroup(
  specialty: Specialty,
  sequenceOrder: number,
): DiagnosisGroup {
  return {
    id: `group-${specialty}-${sequenceOrder}`,
    sequenceOrder,
    specialty,
    procedures: [
      {
        id: `procedure-${specialty}-${sequenceOrder}`,
        sequenceOrder: 1,
        procedureName: `${specialty} procedure`,
        specialty,
        surgeonRole: "PS",
      },
    ],
  } as DiagnosisGroup;
}

function makeCase(overrides: Partial<Case> = {}): Case {
  const specialty = overrides.specialty ?? "general";

  return {
    id: overrides.id ?? "case-1",
    patientIdentifier: overrides.patientIdentifier ?? "TEST001",
    procedureDate: overrides.procedureDate ?? "2026-03-11",
    facility: overrides.facility ?? "Test Hospital",
    specialty,
    procedureType: overrides.procedureType ?? "Procedure",
    diagnosisGroups: overrides.diagnosisGroups ?? [
      makeDiagnosisGroup(specialty, 1),
    ],
    schemaVersion: overrides.schemaVersion ?? 5,
    createdAt: overrides.createdAt ?? "2026-03-11T00:00:00Z",
    updatedAt: overrides.updatedAt ?? "2026-03-11T00:00:00Z",
    ...overrides,
  } as Case;
}

function makeSummary(overrides: Partial<CaseSummary> = {}): CaseSummary {
  return {
    id: overrides.id ?? "case-1",
    procedureDate: overrides.procedureDate ?? "2026-03-11",
    createdAt: overrides.createdAt ?? "2026-03-11T00:00:00Z",
    updatedAt: overrides.updatedAt ?? "2026-03-11T00:00:00Z",
    patientIdentifier: overrides.patientIdentifier ?? "TEST001",
    specialty: overrides.specialty ?? "general",
    specialties: overrides.specialties ?? ["general"],
    outcomeRecorded: overrides.outcomeRecorded ?? false,
    procedureNames: overrides.procedureNames ?? ["Procedure"],
    operativeMediaCount: overrides.operativeMediaCount ?? 0,
    canAddHistology: overrides.canAddHistology ?? false,
    needsHistology: overrides.needsHistology ?? false,
    hasSevereHandInfection: overrides.hasSevereHandInfection ?? false,
    searchableText:
      overrides.searchableText ?? "test001 procedure test hospital",
    ...overrides,
  };
}

async function loadStorageModule() {
  vi.resetModules();
  // Re-set active user in the fresh module context
  const { setActiveUserId: setUser } = await import("@/lib/activeUser");
  setUser(TEST_USER_ID);
  return import("@/lib/storage");
}

describe("storage read caching", () => {
  beforeEach(() => {
    asyncStorageState.clear();
    asyncStorageReads.length = 0;
    setActiveUserId(TEST_USER_ID);
  });

  it("reuses cached decrypted cases across repeated getCases calls", async () => {
    const firstCase = makeCase({ id: "case-1" });
    const secondCase = makeCase({
      id: "case-2",
      procedureDate: "2026-03-10",
      patientIdentifier: "TEST002",
    });

    asyncStorageState.set(
      CASE_INDEX_KEY,
      JSON.stringify([
        {
          id: firstCase.id,
          procedureDate: firstCase.procedureDate,
          patientIdentifierHash: "hash-1",
          updatedAt: firstCase.updatedAt,
        },
        {
          id: secondCase.id,
          procedureDate: secondCase.procedureDate,
          patientIdentifierHash: "hash-2",
          updatedAt: secondCase.updatedAt,
        },
      ]),
    );
    asyncStorageState.set(CASE_SPECIALTY_REPAIR_KEY, "1");
    asyncStorageState.set(
      scopedCaseKey(firstCase.id),
      JSON.stringify(firstCase),
    );
    asyncStorageState.set(
      scopedCaseKey(secondCase.id),
      JSON.stringify(secondCase),
    );

    const { getCases } = await loadStorageModule();

    const initialCases = await getCases();
    expect(initialCases).toHaveLength(2);
    expect(
      asyncStorageReads.filter(
        (key) =>
          key === scopedCaseKey(firstCase.id) ||
          key === scopedCaseKey(secondCase.id),
      ),
    ).toHaveLength(2);

    asyncStorageReads.length = 0;

    const cachedCases = await getCases();
    expect(cachedCases).toHaveLength(2);
    expect(asyncStorageReads).toEqual([]);
  });

  it("returns case count from the index without reading case blobs", async () => {
    asyncStorageState.set(
      CASE_INDEX_KEY,
      JSON.stringify([
        {
          id: "case-1",
          procedureDate: "2026-03-11",
          patientIdentifierHash: "hash-1",
          updatedAt: "2026-03-11T00:00:00Z",
        },
        {
          id: "case-2",
          procedureDate: "2026-03-10",
          patientIdentifierHash: "hash-2",
          updatedAt: "2026-03-10T00:00:00Z",
        },
      ]),
    );
    asyncStorageState.set(CASE_SPECIALTY_REPAIR_KEY, "1");

    const { getCaseCount } = await loadStorageModule();
    const count = await getCaseCount();

    expect(count).toBe(2);
    expect(asyncStorageReads).not.toContain(scopedCaseKey("case-1"));
    expect(asyncStorageReads).not.toContain(scopedCaseKey("case-2"));
  });

  it("returns cached case summaries without reading case blobs", async () => {
    asyncStorageState.set(
      CASE_INDEX_KEY,
      JSON.stringify([
        {
          id: "case-1",
          procedureDate: "2026-03-11",
          patientIdentifierHash: "hash-1",
          updatedAt: "2026-03-11T00:00:00Z",
        },
      ]),
    );
    asyncStorageState.set(CASE_SPECIALTY_REPAIR_KEY, "1");
    asyncStorageState.set(
      CASE_SUMMARIES_KEY,
      JSON.stringify({
        version: 1,
        summaries: [makeSummary()],
      }),
    );

    const { getCaseSummaries } = await loadStorageModule();
    const summaries = await getCaseSummaries();

    expect(summaries).toHaveLength(1);
    expect(summaries[0]?.id).toBe("case-1");
    expect(asyncStorageReads).not.toContain(scopedCaseKey("case-1"));
  });

  it("hydrates only requested case ids", async () => {
    const firstCase = makeCase({ id: "case-1" });
    const secondCase = makeCase({
      id: "case-2",
      procedureDate: "2026-03-10",
      patientIdentifier: "TEST002",
    });
    const thirdCase = makeCase({
      id: "case-3",
      procedureDate: "2026-03-09",
      patientIdentifier: "TEST003",
    });

    asyncStorageState.set(CASE_SPECIALTY_REPAIR_KEY, "1");
    asyncStorageState.set(
      scopedCaseKey(firstCase.id),
      JSON.stringify(firstCase),
    );
    asyncStorageState.set(
      scopedCaseKey(secondCase.id),
      JSON.stringify(secondCase),
    );
    asyncStorageState.set(
      scopedCaseKey(thirdCase.id),
      JSON.stringify(thirdCase),
    );

    const { getCasesByIds } = await loadStorageModule();
    const hydrated = await getCasesByIds([firstCase.id, thirdCase.id]);

    expect(hydrated.map((caseData) => caseData.id)).toEqual([
      firstCase.id,
      thirdCase.id,
    ]);
    expect(asyncStorageReads).toContain(scopedCaseKey(firstCase.id));
    expect(asyncStorageReads).toContain(scopedCaseKey(thirdCase.id));
    expect(asyncStorageReads).not.toContain(scopedCaseKey(secondCase.id));
  });
});
