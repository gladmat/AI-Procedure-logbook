import { describe, expect, it } from "vitest";

import {
  migrateOperativeMediaType,
  migrateMediaCategory,
  resolveMediaTag,
} from "@/lib/mediaTagMigration";
import { MEDIA_TAG_REGISTRY, getRelevantGroups } from "@/types/media";
import type { MediaCategory, OperativeMediaType } from "@/types/case";
import type { MediaTag, MediaTagGroup } from "@/types/media";

// ═══════════════════════════════════════════════════════════
// migrateOperativeMediaType
// ═══════════════════════════════════════════════════════════

describe("migrateOperativeMediaType", () => {
  const ALL_OPERATIVE_MEDIA_TYPES: OperativeMediaType[] = [
    "preoperative_photo",
    "intraoperative_photo",
    "xray",
    "ct_scan",
    "mri",
    "diagram",
    "document",
    "other",
  ];

  it("maps all 8 OperativeMediaType values to valid MediaTags", () => {
    for (const type of ALL_OPERATIVE_MEDIA_TYPES) {
      const tag = migrateOperativeMediaType(type);
      expect(tag in MEDIA_TAG_REGISTRY).toBe(true);
    }
  });

  it("maps preoperative_photo to preop_clinical", () => {
    expect(migrateOperativeMediaType("preoperative_photo")).toBe(
      "preop_clinical",
    );
  });

  it("maps intraoperative_photo to intraop", () => {
    expect(migrateOperativeMediaType("intraoperative_photo")).toBe("intraop");
  });

  it("maps xray to xray_preop", () => {
    expect(migrateOperativeMediaType("xray")).toBe("xray_preop");
  });

  it("maps ct_scan to ct_scan", () => {
    expect(migrateOperativeMediaType("ct_scan")).toBe("ct_scan");
  });

  it("maps mri to mri", () => {
    expect(migrateOperativeMediaType("mri")).toBe("mri");
  });

  it("maps diagram to diagram", () => {
    expect(migrateOperativeMediaType("diagram")).toBe("diagram");
  });

  it("maps document to document", () => {
    expect(migrateOperativeMediaType("document")).toBe("document");
  });

  it("maps other to other", () => {
    expect(migrateOperativeMediaType("other")).toBe("other");
  });

  it("returns other for unknown type", () => {
    expect(migrateOperativeMediaType("nonexistent" as OperativeMediaType)).toBe(
      "other",
    );
  });
});

// ═══════════════════════════════════════════════════════════
// migrateMediaCategory
// ═══════════════════════════════════════════════════════════

describe("migrateMediaCategory", () => {
  const ALL_MEDIA_CATEGORIES: MediaCategory[] = [
    "preop",
    "flap_harvest",
    "flap_inset",
    "anastomosis",
    "closure",
    "immediate_postop",
    "flap_planning",
    "xray",
    "preop_xray",
    "intraop_xray",
    "postop_xray",
    "ct_angiogram",
    "ultrasound",
    "discharge_wound",
    "discharge_donor",
    "followup_photo",
    "donor_site",
    "complication",
    "revision",
    "other",
  ];

  it("maps all 20 MediaCategory values to valid MediaTags", () => {
    for (const category of ALL_MEDIA_CATEGORIES) {
      const tag = migrateMediaCategory(category);
      expect(
        tag in MEDIA_TAG_REGISTRY,
        `${category} mapped to invalid tag: ${tag}`,
      ).toBe(true);
    }
  });

  it("maps preop to preop_clinical", () => {
    expect(migrateMediaCategory("preop")).toBe("preop_clinical");
  });

  it("maps flap_harvest to flap_harvest", () => {
    expect(migrateMediaCategory("flap_harvest")).toBe("flap_harvest");
  });

  it("maps anastomosis to anastomosis", () => {
    expect(migrateMediaCategory("anastomosis")).toBe("anastomosis");
  });

  it("maps closure to donor_closure", () => {
    expect(migrateMediaCategory("closure")).toBe("donor_closure");
  });

  it("maps xray to xray_preop", () => {
    expect(migrateMediaCategory("xray")).toBe("xray_preop");
  });

  it("maps preop_xray to xray_preop", () => {
    expect(migrateMediaCategory("preop_xray")).toBe("xray_preop");
  });

  it("maps intraop_xray to xray_intraop", () => {
    expect(migrateMediaCategory("intraop_xray")).toBe("xray_intraop");
  });

  it("maps postop_xray to xray_postop", () => {
    expect(migrateMediaCategory("postop_xray")).toBe("xray_postop");
  });

  it("maps ct_angiogram to ct_angiogram", () => {
    expect(migrateMediaCategory("ct_angiogram")).toBe("ct_angiogram");
  });

  it("maps ultrasound to ultrasound", () => {
    expect(migrateMediaCategory("ultrasound")).toBe("ultrasound");
  });

  // Extended mappings (beyond original blueprint)
  it("maps discharge_wound to discharge", () => {
    expect(migrateMediaCategory("discharge_wound")).toBe("discharge");
  });

  it("maps discharge_donor to discharge", () => {
    expect(migrateMediaCategory("discharge_donor")).toBe("discharge");
  });

  it("maps followup_photo to scar_followup", () => {
    expect(migrateMediaCategory("followup_photo")).toBe("scar_followup");
  });

  it("maps donor_site to donor_site", () => {
    expect(migrateMediaCategory("donor_site")).toBe("donor_site");
  });

  it("maps complication to wound_postop", () => {
    expect(migrateMediaCategory("complication")).toBe("wound_postop");
  });

  it("maps revision to intraop", () => {
    expect(migrateMediaCategory("revision")).toBe("intraop");
  });

  it("returns other for unknown category", () => {
    expect(migrateMediaCategory("nonexistent" as MediaCategory)).toBe("other");
  });
});

// ═══════════════════════════════════════════════════════════
// resolveMediaTag
// ═══════════════════════════════════════════════════════════

describe("resolveMediaTag", () => {
  it("prefers tag when present and valid", () => {
    expect(
      resolveMediaTag({
        tag: "flap_harvest",
        category: "preop",
        mediaType: "xray",
      }),
    ).toBe("flap_harvest");
  });

  it("falls back to category when tag is absent", () => {
    expect(
      resolveMediaTag({
        category: "anastomosis",
        mediaType: "intraoperative_photo",
      }),
    ).toBe("anastomosis");
  });

  it("falls back to mediaType when tag and category are absent", () => {
    expect(
      resolveMediaTag({
        mediaType: "ct_scan",
      }),
    ).toBe("ct_scan");
  });

  it('returns "other" when all fields are absent', () => {
    expect(resolveMediaTag({})).toBe("other");
  });

  it("ignores invalid tag and falls back to category", () => {
    expect(
      resolveMediaTag({
        tag: "totally_invalid_tag" as MediaTag,
        category: "flap_inset",
      }),
    ).toBe("flap_inset");
  });

  it("ignores invalid tag and falls back to mediaType", () => {
    expect(
      resolveMediaTag({
        tag: "totally_invalid_tag" as MediaTag,
        mediaType: "mri",
      }),
    ).toBe("mri");
  });
});

// ═══════════════════════════════════════════════════════════
// Registry completeness
// ═══════════════════════════════════════════════════════════

describe("registry completeness", () => {
  it("has no duplicate tags in the registry", () => {
    const tags = Object.keys(MEDIA_TAG_REGISTRY);
    const unique = new Set(tags);
    expect(tags.length).toBe(unique.size);
  });

  it("all migrateOperativeMediaType outputs exist in registry", () => {
    const types: OperativeMediaType[] = [
      "preoperative_photo",
      "intraoperative_photo",
      "xray",
      "ct_scan",
      "mri",
      "diagram",
      "document",
      "other",
    ];
    for (const type of types) {
      const tag = migrateOperativeMediaType(type);
      expect(tag in MEDIA_TAG_REGISTRY).toBe(true);
    }
  });

  it("all migrateMediaCategory outputs exist in registry", () => {
    const categories: MediaCategory[] = [
      "preop",
      "flap_harvest",
      "flap_inset",
      "anastomosis",
      "closure",
      "immediate_postop",
      "flap_planning",
      "xray",
      "preop_xray",
      "intraop_xray",
      "postop_xray",
      "ct_angiogram",
      "ultrasound",
      "discharge_wound",
      "discharge_donor",
      "followup_photo",
      "donor_site",
      "complication",
      "revision",
      "other",
    ];
    for (const cat of categories) {
      const tag = migrateMediaCategory(cat);
      expect(tag in MEDIA_TAG_REGISTRY).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════
// getRelevantGroups
// ═══════════════════════════════════════════════════════════

describe("getRelevantGroups", () => {
  it("always includes temporal, imaging, and other", () => {
    const groups = getRelevantGroups();
    expect(groups).toContain("temporal");
    expect(groups).toContain("imaging");
    expect(groups).toContain("other");
  });

  it("includes flap_surgery for free_flap procedureTag", () => {
    const groups = getRelevantGroups(undefined, ["free_flap"]);
    expect(groups).toContain("flap_surgery");
  });

  it("includes flap_surgery for microsurgery procedureTag", () => {
    const groups = getRelevantGroups(undefined, ["microsurgery"]);
    expect(groups).toContain("flap_surgery");
  });

  it("does not include skin_cancer for skin_cancer specialty alone (diagnosis-driven only)", () => {
    const groups = getRelevantGroups("skin_cancer");
    expect(groups).not.toContain("skin_cancer");
  });

  it("includes skin_cancer for hasSkinCancerAssessment regardless of specialty", () => {
    const groups = getRelevantGroups("orthoplastic", undefined, true);
    expect(groups).toContain("skin_cancer");
  });

  it("includes skin_cancer for hasSkinCancerAssessment with no specialty", () => {
    const groups = getRelevantGroups(undefined, undefined, true);
    expect(groups).toContain("skin_cancer");
  });

  it("includes skin_cancer for hasSkinCancerAssessment with skin_cancer specialty", () => {
    const groups = getRelevantGroups("skin_cancer", undefined, true);
    expect(groups).toContain("skin_cancer");
  });

  it("includes aesthetic for aesthetics specialty", () => {
    const groups = getRelevantGroups("aesthetics");
    expect(groups).toContain("aesthetic");
  });

  it("includes aesthetic for breast specialty", () => {
    const groups = getRelevantGroups("breast");
    expect(groups).toContain("aesthetic");
  });

  it("includes hand_function for hand_wrist specialty", () => {
    const groups = getRelevantGroups("hand_wrist");
    expect(groups).toContain("hand_function");
  });

  it("does not include specialty groups for burns", () => {
    const groups = getRelevantGroups("burns");
    expect(groups).not.toContain("flap_surgery");
    expect(groups).not.toContain("skin_cancer");
    expect(groups).not.toContain("aesthetic");
    expect(groups).not.toContain("hand_function");
  });

  it("does not include skin_cancer for head_neck or general without assessment", () => {
    expect(getRelevantGroups("head_neck")).not.toContain("skin_cancer");
    expect(getRelevantGroups("general")).not.toContain("skin_cancer");
  });
});
