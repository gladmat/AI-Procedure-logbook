import React, { useState } from "react";
import { View, StyleSheet, Alert, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { v4 as uuidv4 } from "uuid";
import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  TimelineEvent,
  TimelineEventType,
  TIMELINE_EVENT_TYPE_LABELS,
  FollowUpInterval,
  FOLLOW_UP_INTERVAL_LABELS,
  MediaAttachment,
  PROMData,
  ComplicationEntry,
  ClavienDindoGrade,
  CLAVIEN_DINDO_LABELS,
} from "@/types/case";
import { FormField, SelectField } from "@/components/FormField";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/Button";
import { MediaCapture } from "@/components/MediaCapture";
import { PROMEntryForm } from "@/components/PROMEntryForm";
import { saveTimelineEvent } from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteParams = RouteProp<RootStackParamList, "AddTimelineEvent">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const EVENT_TYPES: { value: TimelineEventType; label: string }[] = Object.entries(
  TIMELINE_EVENT_TYPE_LABELS
).map(([value, label]) => ({
  value: value as TimelineEventType,
  label,
}));

const SKIN_LESION_PROCEDURE_NAMES = [
  "skin lesion excision",
  "lesion excision",
  "excision of skin lesion",
  "excision biopsy",
  "excisional biopsy",
  "wide local excision",
];

const FOLLOW_UP_INTERVALS: { value: FollowUpInterval; label: string }[] =
  Object.entries(FOLLOW_UP_INTERVAL_LABELS).map(([value, label]) => ({
    value: value as FollowUpInterval,
    label,
  }));

const CLAVIEN_DINDO_OPTIONS: { value: ClavienDindoGrade; label: string }[] =
  Object.entries(CLAVIEN_DINDO_LABELS).map(([value, label]) => ({
    value: value as ClavienDindoGrade,
    label,
  }));

export default function AddTimelineEventScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const { caseId, initialEventType, isSkinLesion } = route.params;

  const [saving, setSaving] = useState(false);
  const [eventType, setEventType] = useState<TimelineEventType | "">(
    initialEventType || ""
  );
  const [note, setNote] = useState("");
  const [followUpInterval, setFollowUpInterval] = useState<FollowUpInterval | "">(
    ""
  );
  const [mediaAttachments, setMediaAttachments] = useState<MediaAttachment[]>(
    []
  );
  const [promData, setPromData] = useState<PROMData>({
    questionnaire: "dash",
  });
  const [complicationDescription, setComplicationDescription] = useState("");
  const [complicationGrade, setComplicationGrade] =
    useState<ClavienDindoGrade>("none");
  const [complicationManagement, setComplicationManagement] = useState("");

  const getSubtitle = () => {
    switch (eventType) {
      case "photo":
        return "Add follow-up photos to document progress";
      case "imaging":
        return "Add X-rays or other imaging results";
      case "prom":
        return "Record patient-reported outcome measure";
      case "complication":
        return "Document a complication";
      case "follow_up_visit":
        return "Record a follow-up visit";
      default:
        return "Record a post-operative event";
    }
  };

  const validateForm = (): boolean => {
    if (!eventType) {
      Alert.alert("Required Field", "Please select an event type");
      return false;
    }

    if (eventType === "photo" || eventType === "imaging") {
      if (mediaAttachments.length === 0) {
        Alert.alert(
          "Required Field",
          eventType === "photo"
            ? "Please add at least one photo"
            : "Please add at least one image"
        );
        return false;
      }
    }

    if (eventType === "prom") {
      if (!promData.score && promData.score !== 0) {
        Alert.alert("Required Field", "Please enter a PROM score");
        return false;
      }
    }

    if (eventType === "complication") {
      if (!complicationDescription.trim()) {
        Alert.alert("Required Field", "Please describe the complication");
        return false;
      }
    }

    if (eventType === "follow_up_visit") {
      if (!followUpInterval) {
        Alert.alert("Required Field", "Please select a follow-up interval");
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const event: TimelineEvent = {
        id: uuidv4(),
        caseId,
        eventType: eventType as TimelineEventType,
        note: note.trim(),
        createdAt: new Date().toISOString(),
      };

      if (eventType === "photo" || eventType === "imaging") {
        event.mediaAttachments = mediaAttachments;
      }

      if (eventType === "prom") {
        event.promData = promData;
      }

      if (eventType === "complication") {
        const complication: ComplicationEntry = {
          id: uuidv4(),
          description: complicationDescription.trim(),
          clavienDindoGrade: complicationGrade,
          dateIdentified: new Date().toISOString(),
          managementNotes: complicationManagement.trim() || undefined,
          resolved: false,
        };
        event.complicationData = complication;
      }

      if (eventType === "follow_up_visit" && followUpInterval) {
        event.followUpInterval = followUpInterval;
      }

      await saveTimelineEvent(event);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error("Error saving event:", error);
      Alert.alert("Error", "Failed to save event. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderEventTypeButtons = () => (
    <View style={styles.eventTypeGrid}>
      {EVENT_TYPES.map((type) => {
        const isSelected = eventType === type.value;
        const icon = getEventTypeIcon(type.value);
        return (
          <Pressable
            key={type.value}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEventType(type.value);
            }}
            style={[
              styles.eventTypeButton,
              {
                backgroundColor: isSelected
                  ? theme.link
                  : theme.backgroundDefault,
              },
            ]}
          >
            <Feather
              name={icon}
              size={22}
              color={isSelected ? theme.buttonText : theme.text}
            />
            <ThemedText
              style={[
                styles.eventTypeLabel,
                { color: isSelected ? theme.buttonText : theme.text },
              ]}
            >
              {type.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );

  const getEventTypeIcon = (type: TimelineEventType): keyof typeof Feather.glyphMap => {
    switch (type) {
      case "photo":
        return "camera";
      case "imaging":
        return "image";
      case "prom":
        return "clipboard";
      case "complication":
        return "alert-triangle";
      case "follow_up_visit":
        return "calendar";
      case "note":
        return "file-text";
      default:
        return "file";
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing["3xl"],
        },
      ]}
    >
      <SectionHeader title="Add to Timeline" subtitle={getSubtitle()} />

      <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
        Entry Type
      </ThemedText>
      {renderEventTypeButtons()}

      {eventType === "photo" || eventType === "imaging" ? (
        <View style={styles.section}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            {eventType === "photo" ? "Photos" : "Imaging"}
          </ThemedText>
          <MediaCapture
            attachments={mediaAttachments}
            onAttachmentsChange={setMediaAttachments}
            mediaType={eventType === "imaging" ? "imaging" : "photo"}
          />
          <FormField
            label="Caption / Notes"
            value={note}
            onChangeText={setNote}
            placeholder="Add notes about these images..."
            multiline
          />
        </View>
      ) : null}

      {eventType === "prom" ? (
        <View style={styles.section}>
          <PROMEntryForm promData={promData} onPromDataChange={setPromData} />
          <FormField
            label="Notes"
            value={note}
            onChangeText={setNote}
            placeholder="Additional notes about this assessment..."
            multiline
          />
        </View>
      ) : null}

      {eventType === "complication" ? (
        <View style={styles.section}>
          <FormField
            label="Description"
            value={complicationDescription}
            onChangeText={setComplicationDescription}
            placeholder="Describe the complication..."
            multiline
            required
          />
          <SelectField
            label="Clavien-Dindo Grade"
            value={complicationGrade}
            options={CLAVIEN_DINDO_OPTIONS}
            onSelect={(value) =>
              setComplicationGrade(value as ClavienDindoGrade)
            }
          />
          <FormField
            label="Management"
            value={complicationManagement}
            onChangeText={setComplicationManagement}
            placeholder="How was this managed?"
            multiline
          />
        </View>
      ) : null}

      {eventType === "follow_up_visit" ? (
        <View style={styles.section}>
          <SelectField
            label="Follow-up Interval"
            value={followUpInterval}
            options={FOLLOW_UP_INTERVALS}
            onSelect={(value) => setFollowUpInterval(value as FollowUpInterval)}
            required
          />
          <MediaCapture
            attachments={mediaAttachments}
            onAttachmentsChange={setMediaAttachments}
            mediaType="photo"
          />
          <FormField
            label="Clinical Notes"
            value={note}
            onChangeText={setNote}
            placeholder="Document the follow-up findings..."
            multiline
          />
        </View>
      ) : null}

      {eventType === "note" ? (
        <View style={styles.section}>
          <FormField
            label="Note"
            value={note}
            onChangeText={setNote}
            placeholder="Record your note..."
            multiline
            required
          />
        </View>
      ) : null}

      {eventType ? (
        <View style={styles.buttonContainer}>
          <Button onPress={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Add to Timeline"}
          </Button>
        </View>
      ) : null}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  eventTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  eventTypeButton: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    minWidth: 100,
    gap: Spacing.xs,
  },
  eventTypeLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  section: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  buttonContainer: {
    marginTop: Spacing.xl,
  },
});
