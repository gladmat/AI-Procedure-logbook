import type { OperativeMediaItem } from "@/types/case";

import { parseIsoDateValue } from "@/lib/dateValues";

export function serializeDraftOperativeMedia(
  operativeMedia: OperativeMediaItem[],
): OperativeMediaItem[] | undefined {
  return operativeMedia.length > 0 ? operativeMedia : undefined;
}

export function restoreDraftProcedureDate(
  procedureDate?: string,
): string | undefined {
  return procedureDate && parseIsoDateValue(procedureDate)
    ? procedureDate
    : undefined;
}

export function restoreDraftOperativeMedia(
  operativeMedia?: OperativeMediaItem[],
): OperativeMediaItem[] {
  return operativeMedia ?? [];
}
