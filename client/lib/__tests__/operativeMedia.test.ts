import { describe, expect, it } from "vitest";

import {
  attachmentsToOperativeMedia,
  operativeMediaToAttachments,
} from "@/lib/operativeMedia";
import type { MediaAttachment, OperativeMediaItem } from "@/types/case";

describe("operativeMedia mapping", () => {
  it("maps operative media into attachment categories", () => {
    const media: OperativeMediaItem[] = [
      {
        id: "media-1",
        localUri: "encrypted-media:1",
        mimeType: "image/jpeg",
        mediaType: "xray",
        createdAt: "2026-03-09T00:00:00Z",
        caption: "Pre-fixation",
      },
    ];

    const attachments = operativeMediaToAttachments(media);

    expect(attachments).toEqual<MediaAttachment[]>([
      {
        id: "media-1",
        localUri: "encrypted-media:1",
        mimeType: "image/jpeg",
        createdAt: "2026-03-09T00:00:00Z",
        caption: "Pre-fixation",
        category: "xray",
        thumbnailUri: undefined,
        timestamp: undefined,
      },
    ]);
  });

  it("maps attachments back into operative media types", () => {
    const attachments: MediaAttachment[] = [
      {
        id: "attachment-1",
        localUri: "encrypted-media:2",
        mimeType: "image/jpeg",
        createdAt: "2026-03-09T00:00:00Z",
        category: "preop",
      },
    ];

    const media = attachmentsToOperativeMedia(attachments);

    expect(media[0]?.mediaType).toBe("preoperative_photo");
    expect(media[0]?.localUri).toBe("encrypted-media:2");
  });
});
