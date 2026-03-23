import { describe, expect, it, vi, beforeEach } from "vitest";
import { setActiveUserId } from "../activeUser";
import {
  getAlwaysDeleteAfterImport,
  setAlwaysDeleteAfterImport,
} from "../smartImportPrefs";

// ── Mock AsyncStorage ───────────────────────────────────────

let store: Record<string, string> = {};

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => store[key] ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn(async (key: string) => {
      delete store[key];
    }),
  },
}));

// ── Setup ───────────────────────────────────────────────────

beforeEach(() => {
  store = {};
  setActiveUserId("test-user-00000000-0000-0000-0000");
});

// ── Tests ───────────────────────────────────────────────────

// Storage key is now user-scoped at runtime; use a helper to find the stored value
function storedValue(): string | undefined {
  const key = Object.keys(store).find((k) =>
    k.startsWith("@opus_smart_import_always_delete"),
  );
  return key ? store[key] : undefined;
}

function seedStore(value: string) {
  const key = `@opus_smart_import_always_delete::test-user-00000000-0000-0000-0000`;
  store[key] = value;
}

describe("smartImportPrefs", () => {
  describe("getAlwaysDeleteAfterImport", () => {
    it("returns false by default (no stored value)", async () => {
      expect(await getAlwaysDeleteAfterImport()).toBe(false);
    });

    it("returns false when stored value is not 'true'", async () => {
      seedStore("false");
      expect(await getAlwaysDeleteAfterImport()).toBe(false);
    });

    it("returns false for garbage stored value", async () => {
      seedStore("maybe");
      expect(await getAlwaysDeleteAfterImport()).toBe(false);
    });

    it("returns true when stored value is 'true'", async () => {
      seedStore("true");
      expect(await getAlwaysDeleteAfterImport()).toBe(true);
    });
  });

  describe("setAlwaysDeleteAfterImport", () => {
    it("stores 'true' when enabled", async () => {
      await setAlwaysDeleteAfterImport(true);
      expect(storedValue()).toBe("true");
    });

    it("stores 'false' when disabled", async () => {
      await setAlwaysDeleteAfterImport(false);
      expect(storedValue()).toBe("false");
    });
  });

  describe("round-trip", () => {
    it("set true → read true", async () => {
      await setAlwaysDeleteAfterImport(true);
      expect(await getAlwaysDeleteAfterImport()).toBe(true);
    });

    it("set false → read false", async () => {
      await setAlwaysDeleteAfterImport(false);
      expect(await getAlwaysDeleteAfterImport()).toBe(false);
    });

    it("toggle true → false → read false", async () => {
      await setAlwaysDeleteAfterImport(true);
      await setAlwaysDeleteAfterImport(false);
      expect(await getAlwaysDeleteAfterImport()).toBe(false);
    });

    it("toggle false → true → read true", async () => {
      await setAlwaysDeleteAfterImport(false);
      await setAlwaysDeleteAfterImport(true);
      expect(await getAlwaysDeleteAfterImport()).toBe(true);
    });
  });
});
