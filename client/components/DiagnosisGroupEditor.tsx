import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { v4 as uuidv4 } from "uuid";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  DiagnosisGroup,
  CaseProcedure,
  Specialty,
  SPECIALTY_LABELS,
  PROCEDURE_TYPES,
  Role,
  FractureEntry,
  DiagnosisClinicalDetails,
} from "@/types/case";
import { PickerField } from "@/components/FormField";
import { SnomedSearchPicker } from "@/components/SnomedSearchPicker";
import { getDiagnosisStaging, DiagnosisStagingConfig } from "@/lib/snomedApi";
import { DiagnosisClinicalFields } from "@/components/DiagnosisClinicalFields";
import { FractureClassificationWizard } from "@/components/FractureClassificationWizard";
import { ProcedureEntryCard } from "@/components/ProcedureEntryCard";
import { DiagnosisPicker } from "@/components/DiagnosisPicker";
import { ProcedureSuggestions } from "@/components/ProcedureSuggestions";
import { getAoToSnomedSuggestion } from "@/data/aoToSnomedMapping";
import {
  hasDiagnosisPicklist,
  getActiveProcedureIds,
  evaluateSuggestions,
  findDiagnosisById,
} from "@/lib/diagnosisPicklists";
import type { DiagnosisPicklistEntry } from "@/types/diagnosis";
import { findPicklistEntry } from "@/lib/procedurePicklist";
import { SectionHeader } from "@/components/SectionHeader";
import { DiagnosisSuggestions } from "@/components/DiagnosisSuggestions";
import { HandTraumaStructurePicker } from "@/components/hand-trauma/HandTraumaStructurePicker";
import { MultiLesionEditor } from "@/components/MultiLesionEditor";
import type { LesionInstance, LesionPathologyType } from "@/types/case";

interface DiagnosisGroupEditorProps {
  group: DiagnosisGroup;
  index: number;
  isOnly: boolean;
  onChange: (updatedGroup: DiagnosisGroup) => void;
  onDelete: () => void;
}

export function DiagnosisGroupEditor({ group, index, isOnly, onChange, onDelete }: DiagnosisGroupEditorProps) {
  const { theme } = useTheme();
  const initializedRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [groupSpecialty, setGroupSpecialty] = useState<Specialty>(group.specialty);
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState<{ conceptId: string; term: string } | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [diagnosisStaging, setDiagnosisStaging] = useState<DiagnosisStagingConfig | null>(null);
  const [stagingValues, setStagingValues] = useState<Record<string, string>>(group.diagnosisStagingSelections || {});
  const [diagnosisClinicalDetails, setDiagnosisClinicalDetails] = useState<DiagnosisClinicalDetails>(group.diagnosisClinicalDetails || {});
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisPicklistEntry | null>(null);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<Set<string>>(new Set());
  const [procedures, setProcedures] = useState<CaseProcedure[]>(group.procedures);
  const [fractures, setFractures] = useState<FractureEntry[]>(group.fractures || []);
  const [isFractureCase, setIsFractureCase] = useState(group.fractures ? group.fractures.length > 0 : false);
  const [showFractureWizardFromCheckbox, setShowFractureWizardFromCheckbox] = useState(false);
  const [snomedSuggestion, setSnomedSuggestion] = useState<{ searchTerm: string; displayName: string } | null>(null);
  const [isMultiLesion, setIsMultiLesion] = useState<boolean>(group.isMultiLesion ?? false);
  const [lesionInstances, setLesionInstances] = useState<LesionInstance[]>(group.lesionInstances ?? []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (group.diagnosis?.snomedCtCode) {
      setPrimaryDiagnosis({ conceptId: group.diagnosis.snomedCtCode, term: group.diagnosis.displayName });
    } else if (group.diagnosis?.displayName) {
      setDiagnosis(group.diagnosis.displayName);
    }

    if (group.diagnosisPicklistId) {
      const dx = findDiagnosisById(group.diagnosisPicklistId);
      if (dx) {
        setSelectedDiagnosis(dx);
        const procIds = group.procedures
          .map(p => p.picklistEntryId)
          .filter(Boolean) as string[];
        setSelectedSuggestionIds(new Set(procIds));
      }
    }
  }, [group]);

  const hasFractureSubcategory = groupSpecialty === "hand_surgery" && procedures.some(
    (p) => p.subcategory === "Fracture & Joint Fixation"
  );

  useEffect(() => {
    if (!hasFractureSubcategory) {
      setFractures([]);
      setIsFractureCase(false);
    }
  }, [hasFractureSubcategory]);

  useEffect(() => {
    const fetchStaging = async () => {
      if (primaryDiagnosis) {
        const staging = await getDiagnosisStaging(primaryDiagnosis.conceptId, primaryDiagnosis.term);
        setDiagnosisStaging(staging);
        if (!initializedRef.current) {
          setStagingValues({});
        }
      } else {
        setDiagnosisStaging(null);
        setStagingValues({});
      }
    };
    fetchStaging();
  }, [primaryDiagnosis]);

  useEffect(() => {
    if (!initializedRef.current) return;

    const assembled: DiagnosisGroup = {
      id: group.id,
      sequenceOrder: group.sequenceOrder,
      specialty: groupSpecialty,
      diagnosis: primaryDiagnosis
        ? { snomedCtCode: primaryDiagnosis.conceptId, displayName: primaryDiagnosis.term }
        : (diagnosis.trim() ? { displayName: diagnosis.trim() } : undefined),
      diagnosisPicklistId: selectedDiagnosis?.id || undefined,
      diagnosisStagingSelections: Object.keys(stagingValues).length > 0 ? stagingValues : undefined,
      diagnosisClinicalDetails: Object.keys(diagnosisClinicalDetails).length > 0 ? diagnosisClinicalDetails : undefined,
      procedureSuggestionSource: selectedDiagnosis ? "picklist" : "manual",
      fractures: fractures.length > 0 ? fractures : undefined,
      procedures,
      isMultiLesion,
      lesionInstances: isMultiLesion ? lesionInstances : undefined,
    };
    onChangeRef.current(assembled);
  }, [
    groupSpecialty, primaryDiagnosis, diagnosis, selectedDiagnosis,
    stagingValues, diagnosisClinicalDetails, fractures, procedures,
    isMultiLesion, lesionInstances,
    group.id, group.sequenceOrder,
  ]);

  const buildDefaultProcedures = useCallback((): CaseProcedure[] => ([
    {
      id: uuidv4(),
      sequenceOrder: 1,
      procedureName: PROCEDURE_TYPES[groupSpecialty]?.[0] || "",
      specialty: groupSpecialty,
      surgeonRole: "PS",
    },
  ]), [groupSpecialty]);

  const handleDiagnosisSelect = useCallback((dx: DiagnosisPicklistEntry) => {
    setSelectedDiagnosis(dx);
    setPrimaryDiagnosis({ conceptId: dx.snomedCtCode, term: dx.displayName });
    setDiagnosis(dx.displayName);
    setStagingValues({});

    const activeIds = getActiveProcedureIds(dx, {});
    setSelectedSuggestionIds(new Set(activeIds));

    const newProcedures: CaseProcedure[] = activeIds.map((picklistId, idx) => {
      const entry = findPicklistEntry(picklistId);
      return {
        id: uuidv4(),
        sequenceOrder: idx + 1,
        procedureName: entry?.displayName || "",
        specialty: groupSpecialty,
        surgeonRole: "PS" as Role,
        picklistEntryId: picklistId,
        snomedCtCode: entry?.snomedCtCode,
        snomedCtDisplay: entry?.snomedCtDisplay,
        subcategory: entry?.subcategory,
        tags: entry?.tags,
      };
    });
    setProcedures(newProcedures.length > 0 ? newProcedures : buildDefaultProcedures());
  }, [groupSpecialty, buildDefaultProcedures]);

  const handleStagingChangeForSuggestions = useCallback((systemName: string, value: string) => {
    const newStagingValues = { ...stagingValues, [systemName]: value };
    setStagingValues(newStagingValues);

    if (selectedDiagnosis) {
      const evaluated = evaluateSuggestions(selectedDiagnosis, newStagingValues);
      const activeIds = new Set(evaluated.filter((s) => s.isActive).map((s) => s.procedurePicklistId));
      const allSuggestionIds = new Set(evaluated.map((s) => s.procedurePicklistId));

      const manuallySelected = new Set<string>();
      selectedSuggestionIds.forEach((id) => {
        if (!allSuggestionIds.has(id) || activeIds.has(id)) {
          manuallySelected.add(id);
        }
      });
      const newSelected = new Set([...activeIds, ...manuallySelected]);

      const idsToAdd = [...activeIds].filter(
        (id) => !procedures.some((p) => p.picklistEntryId === id)
      );

      const conditionalIds = new Set(
        evaluated.filter((s) => s.isConditional).map((s) => s.procedurePicklistId)
      );
      const idsToRemove = new Set(
        [...conditionalIds].filter((id) => !activeIds.has(id) && !manuallySelected.has(id))
      );

      setProcedures((prev) => {
        let updated = prev.filter((p) => !p.picklistEntryId || !idsToRemove.has(p.picklistEntryId));
        if (idsToAdd.length > 0) {
          const addedProcedures: CaseProcedure[] = idsToAdd.map((picklistId) => {
            const entry = findPicklistEntry(picklistId);
            return {
              id: uuidv4(),
              sequenceOrder: 1,
              procedureName: entry?.displayName || "",
              specialty: groupSpecialty,
              surgeonRole: "PS" as Role,
              picklistEntryId: picklistId,
              snomedCtCode: entry?.snomedCtCode,
              snomedCtDisplay: entry?.snomedCtDisplay,
              subcategory: entry?.subcategory,
              tags: entry?.tags,
            };
          });
          updated = [...updated, ...addedProcedures];
        }
        return updated.map((p, i) => ({ ...p, sequenceOrder: i + 1 }));
      });
      setSelectedSuggestionIds(newSelected);
    }
  }, [stagingValues, selectedDiagnosis, selectedSuggestionIds, procedures, groupSpecialty]);

  const handleToggleProcedureSuggestion = useCallback((procedurePicklistId: string, isSelected: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSelected) {
      setSelectedSuggestionIds((prev) => new Set([...prev, procedurePicklistId]));
      const entry = findPicklistEntry(procedurePicklistId);
      if (entry && !procedures.some((p) => p.picklistEntryId === procedurePicklistId)) {
        const newProc: CaseProcedure = {
          id: uuidv4(),
          sequenceOrder: procedures.length + 1,
          procedureName: entry.displayName,
          specialty: groupSpecialty,
          surgeonRole: "PS" as Role,
          picklistEntryId: procedurePicklistId,
          snomedCtCode: entry.snomedCtCode,
          snomedCtDisplay: entry.snomedCtDisplay,
          subcategory: entry.subcategory,
          tags: entry.tags,
        };
        setProcedures((prev) => [...prev, newProc]);
      }
    } else {
      setSelectedSuggestionIds((prev) => {
        const next = new Set(prev);
        next.delete(procedurePicklistId);
        return next;
      });
      setProcedures((prev) => {
        const filtered = prev.filter((p) => p.picklistEntryId !== procedurePicklistId);
        return filtered.map((p, i) => ({ ...p, sequenceOrder: i + 1 }));
      });
    }
  }, [procedures, groupSpecialty]);

  const procedurePicklistIds = useMemo(
    () => procedures
      .map((p) => p.picklistEntryId)
      .filter((id): id is string => !!id),
    [procedures]
  );

  const showDiagnosisSuggestions =
    procedurePicklistIds.length > 0 &&
    !selectedDiagnosis &&
    !primaryDiagnosis;

  const handleReverseDiagnosisSelect = useCallback((dx: DiagnosisPicklistEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setSelectedDiagnosis(dx);
    setPrimaryDiagnosis({ conceptId: dx.snomedCtCode, term: dx.displayName });
    setDiagnosis(dx.displayName);
    setStagingValues({});

    const activeIds = getActiveProcedureIds(dx, {});

    setProcedures((prev) => {
      const existingPicklistIds = new Set(
        prev
          .map((p) => p.picklistEntryId)
          .filter((id): id is string => !!id)
      );

      const newProcedures: CaseProcedure[] = [];
      for (const picklistId of activeIds) {
        if (!existingPicklistIds.has(picklistId)) {
          const entry = findPicklistEntry(picklistId);
          if (entry) {
            newProcedures.push({
              id: uuidv4(),
              sequenceOrder: prev.length + newProcedures.length + 1,
              procedureName: entry.displayName,
              specialty: groupSpecialty,
              surgeonRole: "PS" as Role,
              picklistEntryId: picklistId,
              snomedCtCode: entry.snomedCtCode,
              snomedCtDisplay: entry.snomedCtDisplay,
              subcategory: entry.subcategory,
              tags: entry.tags,
            });
          }
        }
      }

      const allIds = new Set([...existingPicklistIds, ...activeIds]);
      setSelectedSuggestionIds(allIds);

      if (newProcedures.length > 0) {
        return [...prev, ...newProcedures];
      }
      return prev;
    });
  }, [groupSpecialty]);

  const addProcedure = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newProcedure: CaseProcedure = {
      id: uuidv4(),
      sequenceOrder: procedures.length + 1,
      procedureName: "",
      specialty: groupSpecialty,
      surgeonRole: "PS",
    };
    setProcedures((prev) => [...prev, newProcedure]);
  };

  const updateProcedure = (updated: CaseProcedure) => {
    setProcedures((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const removeProcedure = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcedures((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      return filtered.map((p, idx) => ({ ...p, sequenceOrder: idx + 1 }));
    });
  };

  const moveProcedureUp = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProcedures((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx <= 0) return prev;
      const newArr = [...prev];
      [newArr[idx - 1], newArr[idx]] = [newArr[idx], newArr[idx - 1]];
      return newArr.map((p, i) => ({ ...p, sequenceOrder: i + 1 }));
    });
  };

  const moveProcedureDown = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProcedures((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const newArr = [...prev];
      [newArr[idx], newArr[idx + 1]] = [newArr[idx + 1], newArr[idx]];
      return newArr.map((p, i) => ({ ...p, sequenceOrder: i + 1 }));
    });
  };

  const handleFractureCheckboxToggle = (checked: boolean) => {
    setIsFractureCase(checked);
    if (checked) {
      setShowFractureWizardFromCheckbox(true);
    } else {
      setFractures([]);
      setSnomedSuggestion(null);
    }
  };

  const handleFractureWizardSave = async (newFractures: FractureEntry[]) => {
    setFractures(newFractures);
    setShowFractureWizardFromCheckbox(false);

    if (newFractures.length > 0) {
      const firstFracture = newFractures[0];
      const suggestion = getAoToSnomedSuggestion(firstFracture.aoCode);
      setSnomedSuggestion(suggestion);

      if (suggestion) {
        setPrimaryDiagnosis({ conceptId: "", term: suggestion.displayName });
        setDiagnosis(suggestion.displayName);
      }
    }
  };

  const handleFractureWizardClose = () => {
    setShowFractureWizardFromCheckbox(false);
    if (fractures.length === 0) {
      setIsFractureCase(false);
    }
  };

  const handleSpecialtyChange = (newSpecialty: string) => {
    const s = newSpecialty as Specialty;
    setGroupSpecialty(s);
    setPrimaryDiagnosis(null);
    setDiagnosis("");
    setDiagnosisStaging(null);
    setStagingValues({});
    setDiagnosisClinicalDetails({});
    setSelectedDiagnosis(null);
    setSelectedSuggestionIds(new Set());
    setFractures([]);
    setIsFractureCase(false);
    setSnomedSuggestion(null);
    setProcedures([{
      id: uuidv4(),
      sequenceOrder: 1,
      procedureName: PROCEDURE_TYPES[s]?.[0] || "",
      specialty: s,
      surgeonRole: "PS",
    }]);
  };

  const specialtyOptions = Object.entries(SPECIALTY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  function deriveDefaultPathologyType(
    dx: DiagnosisPicklistEntry | null,
  ): LesionPathologyType {
    if (!dx) return "bcc";
    const id = dx.id.toLowerCase();
    if (id.includes("melanoma")) return "melanoma";
    if (id.includes("scc")) return "scc";
    if (id.includes("bcc")) return "bcc";
    if (id.includes("benign") || id.includes("naevus") || id.includes("cyst")) return "benign";
    return "bcc";
  }

  return (
    <View style={[styles.groupContainer, !isOnly ? { borderColor: theme.border } : undefined]}>
      {!isOnly ? (
        <View style={styles.groupHeader}>
          <ThemedText style={[styles.groupTitle, { color: theme.textSecondary }]}>
            Diagnosis Group {index + 1}
          </ThemedText>
          {!isOnly ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onDelete();
              }}
              hitSlop={8}
            >
              <Feather name="trash-2" size={18} color={theme.error} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {index > 0 ? (
        <PickerField
          label="Specialty"
          value={groupSpecialty}
          options={specialtyOptions}
          onSelect={handleSpecialtyChange}
        />
      ) : null}

      <SectionHeader title="Primary Diagnosis" subtitle={hasDiagnosisPicklist(groupSpecialty) ? "Select from structured list or search SNOMED CT" : "SNOMED CT coded diagnosis"} />

      {hasDiagnosisPicklist(groupSpecialty) ? (
        <DiagnosisPicker
          specialty={groupSpecialty}
          selectedDiagnosisId={selectedDiagnosis?.id}
          onSelect={handleDiagnosisSelect}
        />
      ) : null}

      {hasFractureSubcategory ? (
        <View style={styles.fractureCheckboxContainer}>
          <Pressable
            style={styles.fractureCheckboxRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleFractureCheckboxToggle(!isFractureCase);
            }}
          >
            <View style={[
              styles.checkbox,
              {
                borderColor: isFractureCase ? theme.link : theme.border,
                backgroundColor: isFractureCase ? theme.link : "transparent"
              }
            ]}>
              {isFractureCase ? (
                <Feather name="check" size={14} color="#FFF" />
              ) : null}
            </View>
            <ThemedText style={[styles.fractureCheckboxLabel, { color: theme.text }]}>
              Fracture Case
            </ThemedText>
          </Pressable>
          {isFractureCase && fractures.length > 0 ? (
            <View style={styles.fractureSummary}>
              {fractures.map((f) => (
                <View
                  key={f.id}
                  style={[styles.fractureSummaryChip, { backgroundColor: theme.backgroundTertiary }]}
                >
                  <ThemedText style={[styles.fractureSummaryText, { color: theme.text }]}>
                    {f.boneName}
                  </ThemedText>
                  <View style={[styles.aoCodeChip, { backgroundColor: theme.link }]}>
                    <ThemedText style={styles.aoCodeChipText}>{f.aoCode}</ThemedText>
                  </View>
                </View>
              ))}
              <Pressable
                style={[styles.editFracturesButton, { borderColor: theme.link }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowFractureWizardFromCheckbox(true);
                }}
              >
                <Feather name="edit-2" size={14} color={theme.link} />
                <ThemedText style={[styles.editFracturesText, { color: theme.link }]}>
                  Edit
                </ThemedText>
              </Pressable>
            </View>
          ) : null}
          {isFractureCase && snomedSuggestion && primaryDiagnosis ? (
            <View style={[styles.suggestionBanner, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="zap" size={16} color={theme.link} />
              <ThemedText style={[styles.suggestionText, { color: theme.textSecondary }]}>
                Auto-suggested from AO code
              </ThemedText>
            </View>
          ) : null}
        </View>
      ) : null}

      <SnomedSearchPicker
        label="Search Diagnosis"
        value={primaryDiagnosis || undefined}
        onSelect={setPrimaryDiagnosis}
        searchType="diagnosis"
        specialty={groupSpecialty}
        placeholder="Search for diagnosis (e.g., fracture, Dupuytren)..."
      />

      {showDiagnosisSuggestions ? (
        <DiagnosisSuggestions
          procedurePicklistIds={procedurePicklistIds}
          specialty={groupSpecialty}
          onSelect={handleReverseDiagnosisSelect}
        />
      ) : null}

      {diagnosisStaging && diagnosisStaging.stagingSystems.length > 0 ? (
        <View style={styles.stagingContainer}>
          <ThemedText style={[styles.stagingTitle, { color: theme.textSecondary }]}>
            Classification / Staging
          </ThemedText>
          {diagnosisStaging.stagingSystems.map((system) => (
            <PickerField
              key={system.name}
              label={system.name}
              value={stagingValues[system.name] || ""}
              options={system.options.map((opt) => ({
                value: opt.value,
                label: opt.description ? `${opt.label} - ${opt.description}` : opt.label,
              }))}
              onSelect={(value) => {
                if (selectedDiagnosis) {
                  handleStagingChangeForSuggestions(system.name, value);
                } else {
                  setStagingValues((prev) => ({ ...prev, [system.name]: value }));
                }
              }}
              placeholder={`Select ${system.name.toLowerCase()}...`}
            />
          ))}
        </View>
      ) : null}

      {selectedDiagnosis ? (
        <ProcedureSuggestions
          diagnosis={selectedDiagnosis}
          stagingSelections={stagingValues}
          selectedProcedureIds={selectedSuggestionIds}
          onToggle={handleToggleProcedureSuggestion}
        />
      ) : null}

      {primaryDiagnosis ? (
        <DiagnosisClinicalFields
          diagnosis={{
            snomedCtCode: primaryDiagnosis.conceptId,
            displayName: primaryDiagnosis.term,
            clinicalDetails: diagnosisClinicalDetails,
          }}
          onDiagnosisChange={(updatedDiagnosis) => {
            setDiagnosisClinicalDetails(updatedDiagnosis.clinicalDetails || {});
          }}
          specialty={groupSpecialty}
          fractures={fractures}
          onFracturesChange={setFractures}
          showFractureClassification={hasFractureSubcategory}
        />
      ) : null}

      {groupSpecialty === "hand_surgery" && selectedDiagnosis?.clinicalGroup === "trauma" ? (
        <HandTraumaStructurePicker
          value={diagnosisClinicalDetails.handTrauma || {}}
          onChange={(handTrauma) =>
            setDiagnosisClinicalDetails((prev) => ({ ...prev, handTrauma }))
          }
          selectedDiagnosis={selectedDiagnosis}
          procedures={procedures}
          onProceduresChange={setProcedures}
        />
      ) : null}

      <SectionHeader title="Procedures Performed" />

      <ThemedText style={[styles.sectionDescription, { color: theme.textSecondary }]}>
        Add all procedures performed during this surgery. Each procedure can have its own specialty and SNOMED CT code.
      </ThemedText>

      {(selectedDiagnosis?.hasEnhancedHistology || groupSpecialty === "general" || groupSpecialty === "head_neck") ? (
        <View style={{ marginBottom: Spacing.md }}>
          <Pressable
            onPress={() => {
              const newValue = !isMultiLesion;
              setIsMultiLesion(newValue);
              if (newValue && lesionInstances.length === 0) {
                setLesionInstances([
                  {
                    id: uuidv4(),
                    site: "",
                    pathologyType: deriveDefaultPathologyType(selectedDiagnosis),
                    reconstruction: "primary_closure",
                    marginStatus: "pending",
                    histologyConfirmed: false,
                  },
                ]);
              }
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: BorderRadius.sm,
              borderWidth: 1,
              borderColor: isMultiLesion ? theme.link : theme.border,
              backgroundColor: isMultiLesion ? theme.link + "10" : theme.backgroundDefault,
            }}
          >
            <Feather
              name={isMultiLesion ? "check-square" : "square"}
              size={18}
              color={isMultiLesion ? theme.link : theme.textSecondary}
            />
            <View style={{ flex: 1 }}>
              <ThemedText
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: isMultiLesion ? theme.link : theme.text,
                }}
              >
                Multiple lesions in this session
              </ThemedText>
              <ThemedText style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                Log each excision site separately
              </ThemedText>
            </View>
          </Pressable>
        </View>
      ) : null}

      {isMultiLesion ? (
        <MultiLesionEditor
          lesions={lesionInstances}
          onChange={setLesionInstances}
          defaultPathologyType={deriveDefaultPathologyType(selectedDiagnosis)}
        />
      ) : (
        <>
          {procedures.map((proc, idx) => (
            <ProcedureEntryCard
              key={proc.id}
              procedure={proc}
              index={idx}
              isOnlyProcedure={procedures.length === 1}
              onUpdate={updateProcedure}
              onDelete={() => removeProcedure(proc.id)}
              onMoveUp={() => moveProcedureUp(proc.id)}
              onMoveDown={() => moveProcedureDown(proc.id)}
              canMoveUp={idx > 0}
              canMoveDown={idx < procedures.length - 1}
            />
          ))}

          <Pressable
            style={[styles.addButton, { borderColor: theme.link }]}
            onPress={addProcedure}
          >
            <Feather name="plus" size={18} color={theme.link} />
            <ThemedText style={[styles.addButtonText, { color: theme.link }]}>
              Add Another Procedure
            </ThemedText>
          </Pressable>
        </>
      )}

      <FractureClassificationWizard
        visible={showFractureWizardFromCheckbox}
        onClose={handleFractureWizardClose}
        onSave={handleFractureWizardSave}
        initialFractures={fractures}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  groupContainer: {
    marginBottom: Spacing.md,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fractureCheckboxContainer: {
    marginBottom: Spacing.md,
  },
  fractureCheckboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.xs,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  fractureCheckboxLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  fractureSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    alignItems: "center",
  },
  fractureSummaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  fractureSummaryText: {
    fontSize: 13,
    fontWeight: "500",
  },
  aoCodeChip: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  aoCodeChipText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  editFracturesButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  editFracturesText: {
    fontSize: 12,
    fontWeight: "500",
  },
  suggestionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  suggestionText: {
    fontSize: 13,
  },
  stagingContainer: {
    marginBottom: Spacing.md,
    paddingTop: Spacing.sm,
  },
  stagingTitle: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: Spacing.md,
  },
  sectionDescription: {
    fontSize: 13,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
