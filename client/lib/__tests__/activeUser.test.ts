import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  setActiveUserId,
  getActiveUserId,
  getActiveUserIdOrNull,
  onActiveUserChange,
  userScopedAsyncKey,
  userScopedSecureKey,
} from "../activeUser";

const TEST_USER_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const TEST_USER_STRIPPED = "a1b2c3d4e5f67890abcdef1234567890";

describe("activeUser", () => {
  beforeEach(() => {
    setActiveUserId(null);
  });

  describe("setActiveUserId / getActiveUserId", () => {
    it("returns the set user ID", () => {
      setActiveUserId(TEST_USER_ID);
      expect(getActiveUserId()).toBe(TEST_USER_ID);
    });

    it("throws when no user is set", () => {
      expect(() => getActiveUserId()).toThrow(
        "No active user — storage access requires login",
      );
    });
  });

  describe("getActiveUserIdOrNull", () => {
    it("returns null when no user is set", () => {
      expect(getActiveUserIdOrNull()).toBeNull();
    });

    it("returns user ID when set", () => {
      setActiveUserId(TEST_USER_ID);
      expect(getActiveUserIdOrNull()).toBe(TEST_USER_ID);
    });
  });

  describe("onActiveUserChange", () => {
    it("fires listener when user changes", () => {
      const listener = vi.fn();
      onActiveUserChange(listener);

      setActiveUserId(TEST_USER_ID);
      expect(listener).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it("fires listener on clear", () => {
      setActiveUserId(TEST_USER_ID);
      const listener = vi.fn();
      onActiveUserChange(listener);

      setActiveUserId(null);
      expect(listener).toHaveBeenCalledWith(null);
    });

    it("does not fire on same value", () => {
      setActiveUserId(TEST_USER_ID);
      const listener = vi.fn();
      onActiveUserChange(listener);

      setActiveUserId(TEST_USER_ID);
      expect(listener).not.toHaveBeenCalled();
    });

    it("unsubscribes", () => {
      const listener = vi.fn();
      const unsub = onActiveUserChange(listener);
      unsub();

      setActiveUserId(TEST_USER_ID);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("userScopedAsyncKey", () => {
    it("appends :: and userId to base key", () => {
      setActiveUserId(TEST_USER_ID);
      expect(userScopedAsyncKey("@my_key")).toBe(`@my_key::${TEST_USER_ID}`);
    });

    it("throws when no user set", () => {
      expect(() => userScopedAsyncKey("@my_key")).toThrow();
    });
  });

  describe("userScopedSecureKey", () => {
    it("appends _ and stripped userId to base key", () => {
      setActiveUserId(TEST_USER_ID);
      expect(userScopedSecureKey("my_key")).toBe(
        `my_key_${TEST_USER_STRIPPED}`,
      );
    });

    it("strips dashes from UUID", () => {
      setActiveUserId(TEST_USER_ID);
      const key = userScopedSecureKey("k");
      expect(key).not.toContain("-");
    });

    it("throws when no user set", () => {
      expect(() => userScopedSecureKey("my_key")).toThrow();
    });
  });
});
