import { useMemo } from "react";
import type { EpisodeWithCases } from "@/hooks/useActiveEpisodes";
import type { Case } from "@/types/case";
import {
  buildAttentionItems,
  type AttentionItem,
} from "@/lib/dashboardSelectors";

export type { AttentionItem } from "@/lib/dashboardSelectors";

export function useAttentionItems(
  cases: Case[],
  episodesWithCases: EpisodeWithCases[],
  selectedSpecialty: string | null,
): AttentionItem[] {
  return useMemo(
    () => buildAttentionItems(cases, episodesWithCases, selectedSpecialty),
    [cases, episodesWithCases, selectedSpecialty],
  );
}
