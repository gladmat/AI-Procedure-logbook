import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  Platform,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { v4 as uuidv4 } from "uuid";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { OperativeMediaItem, OperativeMediaType, OPERATIVE_MEDIA_TYPE_LABELS } from "@/types/case";

interface OperativeMediaSectionProps {
  media: OperativeMediaItem[];
  onMediaChange: (media: OperativeMediaItem[]) => void;
  maxItems?: number;
}

const MEDIA_TYPE_OPTIONS: { value: OperativeMediaType; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { value: "intraoperative_photo", label: "Intraop Photo", icon: "camera" },
  { value: "xray", label: "X-ray", icon: "file" },
  { value: "ct_scan", label: "CT Scan", icon: "layers" },
  { value: "mri", label: "MRI", icon: "activity" },
  { value: "diagram", label: "Diagram", icon: "edit-3" },
  { value: "document", label: "Document", icon: "file-text" },
  { value: "other", label: "Other", icon: "paperclip" },
];

export function OperativeMediaSection({
  media,
  onMediaChange,
  maxItems = 20,
}: OperativeMediaSectionProps) {
  const { theme } = useTheme();
  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [pendingMediaUri, setPendingMediaUri] = useState<string | null>(null);
  const [pendingMimeType, setPendingMimeType] = useState<string>("image/jpeg");
  const [captionInput, setCaptionInput] = useState("");
  const [selectedType, setSelectedType] = useState<OperativeMediaType>("intraoperative_photo");

  const canAddMore = media.length < maxItems;

  const handleCameraCapture = async () => {
    if (!cameraPermission?.granted) {
      if (cameraPermission?.canAskAgain !== false) {
        const result = await requestCameraPermission();
        if (!result.granted) return;
      } else {
        Alert.alert(
          "Camera Permission Required",
          "Please enable camera access in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            ...(Platform.OS !== "web"
              ? [{ text: "Open Settings", onPress: async () => {
                  try {
                    const { Linking } = await import("react-native");
                    await Linking.openSettings();
                  } catch (e) {}
                }}]
              : []),
          ]
        );
        return;
      }
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setPendingMediaUri(asset.uri);
        setPendingMimeType(asset.mimeType || "image/jpeg");
        setSelectedType("intraoperative_photo");
        setCaptionInput("");
        setShowTypeModal(true);
      }
    } catch (error) {
      console.error("Error capturing image:", error);
      Alert.alert("Error", "Failed to capture image. Please try again.");
    }
  };

  const handleGalleryPick = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setPendingMediaUri(asset.uri);
        setPendingMimeType(asset.mimeType || "image/jpeg");
        setSelectedType("intraoperative_photo");
        setCaptionInput("");
        setShowTypeModal(true);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const handleConfirmMedia = () => {
    if (!pendingMediaUri) return;

    const newMedia: OperativeMediaItem = {
      id: uuidv4(),
      localUri: pendingMediaUri,
      mimeType: pendingMimeType,
      mediaType: selectedType,
      caption: captionInput.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onMediaChange([...media, newMedia]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowTypeModal(false);
    setPendingMediaUri(null);
    setCaptionInput("");
  };

  const handleRemove = (mediaId: string) => {
    Alert.alert("Remove Media", "Are you sure you want to remove this?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onMediaChange(media.filter((m) => m.id !== mediaId));
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="image" size={18} color={theme.link} />
          <ThemedText style={styles.headerTitle}>
            Operative Media
          </ThemedText>
        </View>
        <ThemedText style={[styles.countBadge, { color: theme.textSecondary }]}>
          {media.length} / {maxItems}
        </ThemedText>
      </View>

      {media.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.previewContainer}
        >
          {media.map((item) => (
            <View
              key={item.id}
              style={[styles.previewItem, { backgroundColor: theme.backgroundDefault }]}
            >
              <Image
                source={{ uri: item.localUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <View style={[styles.typeBadge, { backgroundColor: theme.link }]}>
                <ThemedText style={styles.typeBadgeText}>
                  {OPERATIVE_MEDIA_TYPE_LABELS[item.mediaType]}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => handleRemove(item.id)}
                style={[styles.removeButton, { backgroundColor: theme.error }]}
                hitSlop={8}
              >
                <Feather name="x" size={12} color="#fff" />
              </Pressable>
              {item.caption ? (
                <View style={[styles.captionOverlay, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
                  <ThemedText style={styles.captionText} numberOfLines={2}>
                    {item.caption}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          ))}
          {canAddMore ? (
            <View style={styles.addButtonsColumn}>
              <Pressable
                onPress={handleCameraCapture}
                style={[styles.smallAddButton, { backgroundColor: theme.link }]}
              >
                <Feather name="camera" size={18} color={theme.buttonText} />
              </Pressable>
              <Pressable
                onPress={handleGalleryPick}
                style={[styles.smallAddButton, { backgroundColor: theme.backgroundDefault }]}
              >
                <Feather name="image" size={18} color={theme.text} />
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.buttonRow}>
            <Pressable
              onPress={handleCameraCapture}
              style={[styles.addButton, { backgroundColor: theme.link }]}
            >
              <Feather name="camera" size={20} color={theme.buttonText} />
              <ThemedText style={[styles.addButtonText, { color: theme.buttonText }]}>
                Take Photo
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleGalleryPick}
              style={[styles.addButton, { backgroundColor: theme.backgroundDefault }]}
            >
              <Feather name="image" size={20} color={theme.text} />
              <ThemedText style={styles.addButtonText}>From Gallery</ThemedText>
            </Pressable>
          </View>
          <ThemedText style={[styles.placeholderText, { color: theme.textSecondary }]}>
            Add intraoperative photos, X-rays, or other imaging
          </ThemedText>
        </View>
      )}

      <Modal
        visible={showTypeModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTypeModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowTypeModal(false)}
        >
          <Pressable onPress={() => {}} style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Add Media</ThemedText>
              <Pressable onPress={() => setShowTypeModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            {pendingMediaUri ? (
              <Image
                source={{ uri: pendingMediaUri }}
                style={styles.modalPreview}
                resizeMode="contain"
              />
            ) : null}

            <ThemedText style={styles.fieldLabel}>
              Media Type
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.typeChipsContainer}
            >
              {MEDIA_TYPE_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedType(option.value);
                  }}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor:
                        selectedType === option.value
                          ? theme.link
                          : theme.backgroundRoot,
                      borderColor:
                        selectedType === option.value
                          ? theme.link
                          : theme.border,
                    },
                  ]}
                >
                  <Feather
                    name={option.icon}
                    size={14}
                    color={selectedType === option.value ? theme.buttonText : theme.text}
                  />
                  <ThemedText
                    style={[
                      styles.typeChipText,
                      {
                        color: selectedType === option.value ? theme.buttonText : theme.text,
                      },
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>

            <ThemedText style={styles.fieldLabel}>
              Caption (optional)
            </ThemedText>
            <TextInput
              value={captionInput}
              onChangeText={setCaptionInput}
              placeholder="e.g., Pre-fixation view, Flap inset..."
              placeholderTextColor={theme.textTertiary}
              style={[
                styles.captionInputField,
                {
                  backgroundColor: theme.backgroundRoot,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              multiline
              numberOfLines={2}
            />

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setShowTypeModal(false)}
                style={[styles.modalButton, { backgroundColor: theme.backgroundRoot }]}
              >
                <ThemedText>Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleConfirmMedia}
                style={[styles.modalButton, { backgroundColor: theme.link }]}
              >
                <ThemedText style={{ color: theme.buttonText, fontWeight: "600" }}>
                  Add Media
                </ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerTitle: {
    fontWeight: "600",
  },
  countBadge: {
    fontSize: 13,
  },
  previewContainer: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  previewItem: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  typeBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#fff",
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  captionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  captionText: {
    fontSize: 10,
    color: "#fff",
  },
  addButtonsColumn: {
    gap: Spacing.xs,
    justifyContent: "center",
  },
  smallAddButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    gap: Spacing.md,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  addButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  placeholderText: {
    fontSize: 13,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalPreview: {
    width: "100%",
    height: 180,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    backgroundColor: "#000",
  },
  fieldLabel: {
    marginBottom: Spacing.sm,
  },
  typeChipsContainer: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
    marginBottom: Spacing.md,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  captionInputField: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    minHeight: 60,
    marginBottom: Spacing.lg,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
