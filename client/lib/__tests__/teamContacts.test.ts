import { describe, it, expect } from "vitest";
import {
  abbreviateName,
  TEAM_MEMBER_ROLE_LABELS,
  TEAM_MEMBER_ROLE_SHORT,
  type TeamMemberOperativeRole,
} from "@/types/teamContacts";

describe("abbreviateName", () => {
  it("abbreviates a normal name", () => {
    expect(abbreviateName("Charlotte", "Lozen")).toBe("Charlotte L.");
  });

  it("handles single-character last name", () => {
    expect(abbreviateName("John", "X")).toBe("John X.");
  });

  it("handles empty last name", () => {
    expect(abbreviateName("Solo", "")).toBe("Solo");
  });

  it("preserves full first name", () => {
    expect(abbreviateName("Jean-Pierre", "Dupont")).toBe("Jean-Pierre D.");
  });
});

describe("TeamMemberOperativeRole labels", () => {
  const allRoles: TeamMemberOperativeRole[] = ["PS", "FA", "SS", "US", "SA"];

  it("every role has a full label", () => {
    for (const role of allRoles) {
      expect(TEAM_MEMBER_ROLE_LABELS[role]).toBeDefined();
      expect(TEAM_MEMBER_ROLE_LABELS[role].length).toBeGreaterThan(0);
    }
  });

  it("every role has a short label", () => {
    for (const role of allRoles) {
      expect(TEAM_MEMBER_ROLE_SHORT[role]).toBe(role);
    }
  });

  it("PS = Primary Surgeon", () => {
    expect(TEAM_MEMBER_ROLE_LABELS.PS).toBe("Primary Surgeon");
  });

  it("FA = First Assistant", () => {
    expect(TEAM_MEMBER_ROLE_LABELS.FA).toBe("First Assistant");
  });

  it("SS = Scrubbed Supervisor", () => {
    expect(TEAM_MEMBER_ROLE_LABELS.SS).toBe("Scrubbed Supervisor");
  });

  it("US = Unscrubbed Supervisor", () => {
    expect(TEAM_MEMBER_ROLE_LABELS.US).toBe("Unscrubbed Supervisor");
  });

  it("SA = Surgical Assistant", () => {
    expect(TEAM_MEMBER_ROLE_LABELS.SA).toBe("Surgical Assistant");
  });
});
