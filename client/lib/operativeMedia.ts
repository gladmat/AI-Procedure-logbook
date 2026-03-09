import type {
  MediaAttachment,
  MediaCategory,
  OperativeMediaItem,
  OperativeMediaType,
} from "@/types/case";

export const MEDIA_TYPE_TO_CATEGORY: Record<OperativeMediaType, MediaCategory> =
  {
    preoperative_photo: "preop",
    intraoperative_photo: "immediate_postop",
    xray: "xray",
    ct_scan: "ct_angiogram",
    mri: "ultrasound",
    diagram: "other",
    document: "other",
    other: "other",
  };

export const CATEGORY_TO_MEDIA_TYPE: Partial<
  Record<MediaCategory, OperativeMediaType>
> = {
  preop: "preoperative_photo",
  flap_harvest: "intraoperative_photo",
  flap_inset: "intraoperative_photo",
  anastomosis: "intraoperative_photo",
  closure: "intraoperative_photo",
  immediate_postop: "intraoperative_photo",
  flap_planning: "preoperative_photo",
  xray: "xray",
  preop_xray: "xray",
  intraop_xray: "xray",
  postop_xray: "xray",
  ct_angiogram: "ct_scan",
  ultrasound: "other",
  other: "other",
};

export function operativeMediaToAttachments(
  media: OperativeMediaItem[],
): MediaAttachment[] {
  return media.map((item) => ({
    id: item.id,
    localUri: item.localUri,
    thumbnailUri: item.thumbnailUri,
    mimeType: item.mimeType,
    caption: item.caption,
    createdAt: item.createdAt,
    category: MEDIA_TYPE_TO_CATEGORY[item.mediaType],
    timestamp: item.timestamp,
  }));
}

export function attachmentsToOperativeMedia(
  attachments: MediaAttachment[],
): OperativeMediaItem[] {
  return attachments.map((attachment) => ({
    id: attachment.id,
    localUri: attachment.localUri,
    thumbnailUri: attachment.thumbnailUri,
    mimeType: attachment.mimeType,
    caption: attachment.caption,
    createdAt: attachment.createdAt,
    timestamp: attachment.timestamp,
    mediaType:
      (attachment.category && CATEGORY_TO_MEDIA_TYPE[attachment.category]) ||
      "intraoperative_photo",
  }));
}
