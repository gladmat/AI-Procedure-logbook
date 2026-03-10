import type { MediaTag } from "@/types/media";
import type { MediaCategory, OperativeMediaType } from "@/types/case";
import { MEDIA_TAG_REGISTRY } from "@/types/media";

/**
 * Maps legacy OperativeMediaType to the new MediaTag.
 * Used when reading old cases.
 */
export function migrateOperativeMediaType(type: OperativeMediaType): MediaTag {
  const map: Record<OperativeMediaType, MediaTag> = {
    preoperative_photo: "preop_clinical",
    intraoperative_photo: "intraop",
    xray: "xray_preop", // Best guess — no temporal context in old type
    ct_scan: "ct_scan",
    mri: "mri",
    diagram: "diagram",
    document: "document",
    other: "other",
  };
  return map[type] ?? "other";
}

/**
 * Maps legacy MediaCategory to the new MediaTag.
 * More precise than OperativeMediaType since categories had temporal info.
 *
 * Covers all 20 MediaCategory values from client/types/case.ts.
 */
export function migrateMediaCategory(category: MediaCategory): MediaTag {
  const map: Record<MediaCategory, MediaTag> = {
    preop: "preop_clinical",
    flap_harvest: "flap_harvest",
    flap_inset: "flap_inset",
    anastomosis: "anastomosis",
    closure: "donor_closure",
    immediate_postop: "immediate_postop",
    flap_planning: "flap_planning",
    xray: "xray_preop",
    preop_xray: "xray_preop",
    intraop_xray: "xray_intraop",
    postop_xray: "xray_postop",
    ct_angiogram: "ct_angiogram",
    ultrasound: "ultrasound",
    // Extended mappings (not in original blueprint — added for completeness)
    discharge_wound: "discharge",
    discharge_donor: "discharge",
    followup_photo: "scar_followup",
    donor_site: "donor_site",
    complication: "wound_postop",
    revision: "intraop",
    other: "other",
  };
  return map[category] ?? "other";
}

/**
 * Resolves the effective MediaTag for a media item,
 * checking `tag` first, then falling back to legacy fields.
 */
export function resolveMediaTag(item: {
  tag?: MediaTag;
  mediaType?: OperativeMediaType;
  category?: MediaCategory;
}): MediaTag {
  if (item.tag && item.tag in MEDIA_TAG_REGISTRY) return item.tag;
  if (item.category) return migrateMediaCategory(item.category);
  if (item.mediaType) return migrateOperativeMediaType(item.mediaType);
  return "other";
}
