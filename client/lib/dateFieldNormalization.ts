import { normalizeDateOnlyValue } from "./dateValues";
import type { TimelineEvent } from "@/types/case";
import type { TreatmentEpisode } from "@/types/episode";

export function normalizeStoredDateOnlyValue(
  value?: string,
): string | undefined {
  if (value === undefined) return undefined;
  return normalizeDateOnlyValue(value) ?? value;
}

export function normalizeEpisodeDateOnlyFields(
  episode: TreatmentEpisode,
): TreatmentEpisode {
  const onsetDate = normalizeStoredDateOnlyValue(episode.onsetDate);

  // Reconcile pendingAction / pendingActions for backward compat
  let pendingActions = episode.pendingActions;
  let pendingAction = episode.pendingAction;
  let pendingChanged = false;

  if (pendingActions && pendingActions.length > 0) {
    // Array is source of truth — reconcile singular
    if (pendingAction !== pendingActions[0]) {
      pendingAction = pendingActions[0];
      pendingChanged = true;
    }
  } else if (pendingAction) {
    // Legacy: singular only — promote to array
    pendingActions = [pendingAction];
    pendingChanged = true;
  }

  if (onsetDate === episode.onsetDate && !pendingChanged) {
    return episode;
  }

  return {
    ...episode,
    onsetDate: onsetDate ?? episode.onsetDate,
    ...(pendingChanged ? { pendingAction, pendingActions } : {}),
  };
}

export function normalizeTimelineEventDateOnlyFields(
  event: TimelineEvent,
): TimelineEvent {
  const nextReviewDate = normalizeStoredDateOnlyValue(
    event.woundAssessmentData?.nextReviewDate,
  );

  if (nextReviewDate === event.woundAssessmentData?.nextReviewDate) {
    return event;
  }

  return {
    ...event,
    woundAssessmentData: event.woundAssessmentData
      ? {
          ...event.woundAssessmentData,
          nextReviewDate,
        }
      : event.woundAssessmentData,
  };
}
