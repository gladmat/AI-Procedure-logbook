import { describe, expect, it } from "vitest";

import {
  buildOperativeMediaItemRecord,
  isPersistedMediaUriValue,
  resolveOperativeMediaSavePlan,
} from "@/lib/operativeMediaForm";

describe("operativeMediaForm", () => {
  it("recognizes v2 persisted media URIs", () => {
    expect(isPersistedMediaUriValue("opus-media:v2-id")).toBe(true);
    expect(isPersistedMediaUriValue("file:///tmp/photo.jpg")).toBe(false);
    expect(isPersistedMediaUriValue("encrypted-media:legacy-id")).toBe(false);
  });

  it("reuses the original opus-media URI during an unchanged edit", () => {
    expect(
      resolveOperativeMediaSavePlan({
        editMode: true,
        originalUri: "opus-media:123",
        currentUri: "opus-media:123",
      }),
    ).toEqual({
      reuseExistingUri: true,
      uriToDeleteAfterCommit: undefined,
    });
  });

  it("marks the original URI for deletion when an edited item is replaced", () => {
    expect(
      resolveOperativeMediaSavePlan({
        editMode: true,
        originalUri: "opus-media:123",
        currentUri: "file:///tmp/replacement.jpg",
      }),
    ).toEqual({
      reuseExistingUri: false,
      uriToDeleteAfterCommit: "opus-media:123",
    });
  });

  it("preserves the provided createdAt value when building the saved item", () => {
    const item = buildOperativeMediaItemRecord({
      id: "media-1",
      localUri: "opus-media:123",
      mimeType: "image/jpeg",
      tag: "flap_harvest",
      caption: "  flap raised  ",
      timestamp: "2026-03-10T12:00:00.000Z",
      createdAt: "2026-02-01T08:00:00.000Z",
    });

    expect(item.createdAt).toBe("2026-02-01T08:00:00.000Z");
    expect(item.tag).toBe("flap_harvest");
    expect(item.caption).toBe("flap raised");
  });
});
