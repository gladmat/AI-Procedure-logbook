import { describe, expect, it } from "vitest";

import { parseIsoDateValue, toIsoDateValue } from "@/lib/dateValues";

describe("dateValues", () => {
  it("parses valid ISO dates before the year 2000", () => {
    const parsed = parseIsoDateValue("1987-04-12");

    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(1987);
    expect(parsed?.getMonth()).toBe(3);
    expect(parsed?.getDate()).toBe(12);
  });

  it("rejects structurally invalid dates", () => {
    expect(parseIsoDateValue("1987-02-31")).toBeNull();
    expect(parseIsoDateValue("not-a-date")).toBeNull();
  });

  it("round-trips dates back to ISO strings", () => {
    const parsed = parseIsoDateValue("1976-11-08");

    expect(parsed).not.toBeNull();
    expect(toIsoDateValue(parsed!)).toBe("1976-11-08");
  });
});
