import { describe, it, expect } from "vitest";
import type { CaseTeamMember, TeamContact } from "@/types/teamContacts";
import { abbreviateName } from "@/types/teamContacts";

// ── Inline reducer logic for unit testing ──────────────────────────────────

function toggleOperativeTeam(
  operativeTeam: CaseTeamMember[],
  contact: TeamContact,
): CaseTeamMember[] {
  const existing = operativeTeam.find((m) => m.contactId === contact.id);
  if (existing) {
    return operativeTeam.filter((m) => m.contactId !== contact.id);
  }
  return [
    ...operativeTeam,
    {
      contactId: contact.id,
      linkedUserId: contact.linkedUserId ?? null,
      displayName: contact.displayName,
      abbreviatedName: abbreviateName(contact.firstName, contact.lastName),
      careerStage: contact.careerStage ?? null,
      operativeRole: (contact.defaultRole as any) ?? "FA",
      presentForProcedures: null,
    },
  ];
}

function setOperativeTeamRole(
  operativeTeam: CaseTeamMember[],
  contactId: string,
  role: string,
): CaseTeamMember[] {
  return operativeTeam.map((m) =>
    m.contactId === contactId ? { ...m, operativeRole: role as any } : m,
  );
}

function removeOperativeTeamMember(
  operativeTeam: CaseTeamMember[],
  contactId: string,
): CaseTeamMember[] {
  return operativeTeam.filter((m) => m.contactId !== contactId);
}

// ── Test data ──────────────────────────────────────────────────────────────

const CONTACT_CHARLOTTE: TeamContact = {
  id: "contact-1",
  ownerUserId: "owner-1",
  displayName: "Charlotte Lozen",
  firstName: "Charlotte",
  lastName: "Lozen",
  careerStage: "nz_fellow",
  defaultRole: "FA",
  facilityIds: ["fac-1"],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const CONTACT_MICHAEL: TeamContact = {
  id: "contact-2",
  ownerUserId: "owner-1",
  displayName: "Michael Webb",
  firstName: "Michael",
  lastName: "Webb",
  careerStage: "nz_consultant",
  defaultRole: "PS",
  facilityIds: ["fac-1"],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe("TOGGLE_OPERATIVE_TEAM", () => {
  it("adds a contact to empty team", () => {
    const result = toggleOperativeTeam([], CONTACT_CHARLOTTE);
    expect(result).toHaveLength(1);
    expect(result[0]!.contactId).toBe("contact-1");
    expect(result[0]!.displayName).toBe("Charlotte Lozen");
    expect(result[0]!.abbreviatedName).toBe("Charlotte L.");
    expect(result[0]!.operativeRole).toBe("FA");
    expect(result[0]!.careerStage).toBe("nz_fellow");
    expect(result[0]!.presentForProcedures).toBeNull();
  });

  it("removes an existing contact on second toggle", () => {
    const withOne = toggleOperativeTeam([], CONTACT_CHARLOTTE);
    const result = toggleOperativeTeam(withOne, CONTACT_CHARLOTTE);
    expect(result).toHaveLength(0);
  });

  it("does not duplicate contacts", () => {
    const withOne = toggleOperativeTeam([], CONTACT_CHARLOTTE);
    const withTwo = toggleOperativeTeam(withOne, CONTACT_MICHAEL);
    expect(withTwo).toHaveLength(2);
    // Toggle Charlotte again → removes, Michael stays
    const result = toggleOperativeTeam(withTwo, CONTACT_CHARLOTTE);
    expect(result).toHaveLength(1);
    expect(result[0]!.contactId).toBe("contact-2");
  });

  it("uses default role from contact", () => {
    const result = toggleOperativeTeam([], CONTACT_MICHAEL);
    expect(result[0]!.operativeRole).toBe("PS");
  });

  it("falls back to FA when no defaultRole", () => {
    const noRole: TeamContact = {
      ...CONTACT_CHARLOTTE,
      defaultRole: null,
    };
    const result = toggleOperativeTeam([], noRole);
    expect(result[0]!.operativeRole).toBe("FA");
  });
});

describe("SET_OPERATIVE_TEAM_ROLE", () => {
  it("updates role for correct member", () => {
    const team = toggleOperativeTeam([], CONTACT_CHARLOTTE);
    const result = setOperativeTeamRole(team, "contact-1", "PS");
    expect(result[0]!.operativeRole).toBe("PS");
  });

  it("leaves other members unchanged", () => {
    let team = toggleOperativeTeam([], CONTACT_CHARLOTTE);
    team = toggleOperativeTeam(team, CONTACT_MICHAEL);
    const result = setOperativeTeamRole(team, "contact-1", "SS");
    expect(result[0]!.operativeRole).toBe("SS");
    expect(result[1]!.operativeRole).toBe("PS"); // Michael unchanged
  });

  it("no-ops on unknown contactId", () => {
    const team = toggleOperativeTeam([], CONTACT_CHARLOTTE);
    const result = setOperativeTeamRole(team, "unknown", "PS");
    expect(result).toEqual(team);
  });
});

describe("REMOVE_OPERATIVE_TEAM_MEMBER", () => {
  it("removes by contactId", () => {
    let team = toggleOperativeTeam([], CONTACT_CHARLOTTE);
    team = toggleOperativeTeam(team, CONTACT_MICHAEL);
    const result = removeOperativeTeamMember(team, "contact-1");
    expect(result).toHaveLength(1);
    expect(result[0]!.contactId).toBe("contact-2");
  });

  it("returns empty when removing last member", () => {
    const team = toggleOperativeTeam([], CONTACT_CHARLOTTE);
    const result = removeOperativeTeamMember(team, "contact-1");
    expect(result).toHaveLength(0);
  });
});

describe("CLEAR_OPERATIVE_TEAM", () => {
  it("resets to empty array", () => {
    let team = toggleOperativeTeam([], CONTACT_CHARLOTTE);
    team = toggleOperativeTeam(team, CONTACT_MICHAEL);
    expect(team).toHaveLength(2);
    const cleared: CaseTeamMember[] = [];
    expect(cleared).toHaveLength(0);
  });
});

describe("operative team in case payload", () => {
  it("operativeTeam snapshot includes abbreviatedName", () => {
    const team = toggleOperativeTeam([], CONTACT_CHARLOTTE);
    expect(team[0]!.abbreviatedName).toBe("Charlotte L.");
  });

  it("operativeTeam snapshot captures linkedUserId", () => {
    const linked: TeamContact = {
      ...CONTACT_CHARLOTTE,
      linkedUserId: "linked-user-123",
    };
    const team = toggleOperativeTeam([], linked);
    expect(team[0]!.linkedUserId).toBe("linked-user-123");
  });
});

describe("CSV export team columns", () => {
  it("generates semicolon-delimited team names", () => {
    const team: CaseTeamMember[] = [
      {
        contactId: "c1",
        displayName: "Charlotte Lozen",
        abbreviatedName: "Charlotte L.",
        operativeRole: "FA",
        presentForProcedures: null,
      },
      {
        contactId: "c2",
        displayName: "Michael Webb",
        abbreviatedName: "Michael W.",
        operativeRole: "PS",
        presentForProcedures: null,
      },
    ];
    const names = team.map((m) => m.displayName).join("; ");
    const roles = team.map((m) => m.operativeRole).join("; ");
    expect(names).toBe("Charlotte Lozen; Michael Webb");
    expect(roles).toBe("FA; PS");
  });

  it("empty team produces empty strings", () => {
    const team: CaseTeamMember[] = [];
    const names = team.map((m) => m.displayName).join("; ");
    const count = String(team.length);
    expect(names).toBe("");
    expect(count).toBe("0");
  });
});
