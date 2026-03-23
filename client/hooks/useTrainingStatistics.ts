import { useState, useCallback, useMemo } from "react";
import { InteractionManager } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/contexts/AuthContext";
import { isConsultantLevel } from "@/lib/roleDefaults";
import {
  getAllRevealedPairs,
  type RevealedPairWithContext,
} from "@/lib/assessmentStorage";
import {
  computeLearningCurves,
  computeTeachingAggregate,
  computeCalibrationScore,
  computeTrainingOverview,
  computeEntrustmentDistribution,
  type ProcedureLearningCurve,
  type TeachingAggregate,
  type CalibrationScore,
  type TrainingOverviewStats,
} from "@/lib/assessmentAnalytics";

export interface UseTrainingStatisticsReturn {
  isLoading: boolean;
  isEmpty: boolean;
  isConsultant: boolean;
  learningCurves: ProcedureLearningCurve[];
  teachingAggregate: TeachingAggregate | null;
  calibrationScore: CalibrationScore | null;
  trainingOverview: TrainingOverviewStats | null;
  entrustmentDistribution: { level: number; count: number }[];
  allPairs: RevealedPairWithContext[];
}

export function useTrainingStatistics(): UseTrainingStatisticsReturn {
  const { profile } = useAuth();
  const [pairs, setPairs] = useState<RevealedPairWithContext[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isConsultant = isConsultantLevel(profile?.careerStage);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(async () => {
        setIsLoading(true);
        try {
          const data = await getAllRevealedPairs();
          setPairs(data);
        } catch (error) {
          console.error("Error loading assessment pairs:", error);
        } finally {
          setIsLoading(false);
        }
      });
      return () => task.cancel();
    }, []),
  );

  const isEmpty = pairs.length === 0;

  const learningCurves = useMemo(
    () => (isEmpty ? [] : computeLearningCurves(pairs)),
    [pairs, isEmpty],
  );

  const teachingAggregate = useMemo<TeachingAggregate | null>(
    () => (isEmpty ? null : computeTeachingAggregate(pairs)),
    [pairs, isEmpty],
  );

  const calibrationScore = useMemo<CalibrationScore | null>(
    () => (isEmpty ? null : computeCalibrationScore(pairs)),
    [pairs, isEmpty],
  );

  const trainingOverview = useMemo<TrainingOverviewStats | null>(
    () => (isEmpty ? null : computeTrainingOverview(pairs)),
    [pairs, isEmpty],
  );

  const entrustmentDistribution = useMemo(
    () => (isEmpty ? [] : computeEntrustmentDistribution(pairs)),
    [pairs, isEmpty],
  );

  return {
    isLoading,
    isEmpty,
    isConsultant,
    learningCurves,
    teachingAggregate,
    calibrationScore,
    trainingOverview,
    entrustmentDistribution,
    allPairs: pairs,
  };
}
