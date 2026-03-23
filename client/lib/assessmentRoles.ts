import type { SharedCaseData } from "@/types/sharing";

export type AssessorRole = "supervisor" | "trainee";

/**
 * Determine the likely assessor role for the current user based on case context.
 *
 * Heuristic:
 * 1. Owner with SUP_ supervision level → supervisor (they were overseeing)
 * 2. Recipient with SURGEON operative role → trainee (they were operating)
 * 3. Fallback: owner = supervisor, recipient = trainee
 *
 * The UI should allow the user to override this — some cases have the
 * consultant as recipient (e.g. trainee logged the case and shared upward).
 */
export function determineAssessorRole(
  myUserId: string,
  ownerUserId: string,
  recipientUserId: string,
  caseData: SharedCaseData | null,
): AssessorRole {
  const isOwner = myUserId === ownerUserId;

  if (caseData) {
    const supervision = caseData.supervisionLevel;
    if (
      isOwner &&
      typeof supervision === "string" &&
      supervision.startsWith("SUP_")
    ) {
      return "supervisor";
    }

    const role = caseData.operativeRole;
    if (!isOwner && role === "SURGEON") {
      return "trainee";
    }
  }

  // Default: case owner is supervisor, recipient is trainee
  return isOwner ? "supervisor" : "trainee";
}
