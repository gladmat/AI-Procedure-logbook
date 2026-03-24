import { describe, it, expect } from "vitest";
import { z } from "zod";

// Inline schema to test validation logic without importing from routes
const invitationSchema = z.object({
  contactId: z.string().min(1),
  email: z.string().email(),
});

describe("invitationSchema", () => {
  it("accepts valid invitation", () => {
    const result = invitationSchema.safeParse({
      contactId: "contact-uuid-123",
      email: "charlotte@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing contactId", () => {
    const result = invitationSchema.safeParse({
      email: "charlotte@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty contactId", () => {
    const result = invitationSchema.safeParse({
      contactId: "",
      email: "charlotte@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = invitationSchema.safeParse({
      contactId: "contact-uuid-123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = invitationSchema.safeParse({
      contactId: "contact-uuid-123",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = invitationSchema.safeParse({
      contactId: "contact-uuid-123",
      email: "",
    });
    expect(result.success).toBe(false);
  });
});
