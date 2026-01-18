import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { HeaderButton } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import { v4 as uuidv4 } from "uuid";
import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { 
  TimelineEvent, 
  TimelineEventType, 
  TIMELINE_EVENT_TYPE_LABELS 
} from "@/types/case";
import { FormField, SelectField } from "@/components/FormField";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/Button";
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

export default function AddTimelineEventScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const { caseId } = route.params;

  const [saving, setSaving] = useState(false);
  const [eventType, setEventType] = useState<TimelineEventType | "">("");
  const [note, setNote] = useState("");

  const handleSave = async () => {
    if (!eventType) {
      Alert.alert("Required Field", "Please select an event type");
      return;
    }
    if (!note.trim()) {
      Alert.alert("Required Field", "Please enter a note");
      return;
    }

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
      <SectionHeader
        title="Timeline Event"
        subtitle="Record a post-operative event"
      />

      <SelectField
        label="Event Type"
        value={eventType}
        options={EVENT_TYPES}
        onSelect={(value) => setEventType(value as TimelineEventType)}
        required
      />

      <FormField
        label="Note"
        value={note}
        onChangeText={setNote}
        placeholder="Describe the event..."
        multiline
        required
      />

      <View style={styles.buttonContainer}>
        <Button onPress={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Add Event"}
        </Button>
      </View>
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
  buttonContainer: {
    marginTop: Spacing.xl,
  },
});
