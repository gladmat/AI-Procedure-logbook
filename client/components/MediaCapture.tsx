import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { v4 as uuidv4 } from "uuid";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { MediaAttachment } from "@/types/case";

interface MediaCaptureProps {
  attachments: MediaAttachment[];
  onAttachmentsChange: (attachments: MediaAttachment[]) => void;
  maxAttachments?: number;
  mediaType?: "photo" | "imaging" | "all";
}

export function MediaCapture({
  attachments,
  onAttachmentsChange,
  maxAttachments = 10,
  mediaType = "all",
}: MediaCaptureProps) {
  const { theme } = useTheme();
  const [cameraPermission, requestCameraPermission] =
    ImagePicker.useCameraPermissions();

  const canAddMore = attachments.length < maxAttachments;

  const handleCameraCapture = async () => {
    if (!cameraPermission?.granted) {
      if (cameraPermission?.canAskAgain !== false) {
        const result = await requestCameraPermission();
        if (!result.granted) {
          return;
        }
      } else {
        Alert.alert(
          "Camera Permission Required",
          "Please enable camera access in your device settings to capture photos.",
          [
            { text: "Cancel", style: "cancel" },
            ...(Platform.OS !== "web"
              ? [
                  {
                    text: "Open Settings",
                    onPress: async () => {
                      try {
                        const { Linking } = await import("react-native");
                        await Linking.openSettings();
                      } catch (e) {}
                    },
                  },
                ]
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
        const newAttachment: MediaAttachment = {
          id: uuidv4(),
          localUri: asset.uri,
          mimeType: asset.mimeType || "image/jpeg",
          createdAt: new Date().toISOString(),
        };
        onAttachmentsChange([...attachments, newAttachment]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        allowsMultipleSelection: true,
        selectionLimit: maxAttachments - attachments.length,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newAttachments: MediaAttachment[] = result.assets.map((asset) => ({
          id: uuidv4(),
          localUri: asset.uri,
          mimeType: asset.mimeType || "image/jpeg",
          createdAt: new Date().toISOString(),
        }));
        onAttachmentsChange([...attachments, ...newAttachments]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const handleRemove = (attachmentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAttachmentsChange(attachments.filter((a) => a.id !== attachmentId));
  };

  const handleCaptionEdit = (attachmentId: string) => {
    const attachment = attachments.find((a) => a.id === attachmentId);
    if (!attachment) return;

    Alert.prompt?.(
      "Add Caption",
      "Enter a caption for this image",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: (caption?: string) => {
            if (caption !== undefined) {
              onAttachmentsChange(
                attachments.map((a) =>
                  a.id === attachmentId ? { ...a, caption } : a
                )
              );
            }
          },
        },
      ],
      "plain-text",
      attachment.caption
    );
  };

  const getPlaceholderText = () => {
    switch (mediaType) {
      case "photo":
        return "Add follow-up photos";
      case "imaging":
        return "Add X-ray or imaging";
      default:
        return "Add photos or images";
    }
  };

  return (
    <View style={styles.container}>
      {attachments.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.previewContainer}
        >
          {attachments.map((attachment) => (
            <View
              key={attachment.id}
              style={[
                styles.previewItem,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              <Image
                source={{ uri: attachment.localUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <Pressable
                onPress={() => handleRemove(attachment.id)}
                style={[styles.removeButton, { backgroundColor: theme.error }]}
                hitSlop={8}
              >
                <Feather name="x" size={12} color="#fff" />
              </Pressable>
              {attachment.caption ? (
                <View
                  style={[
                    styles.captionBadge,
                    { backgroundColor: theme.backgroundRoot },
                  ]}
                >
                  <ThemedText style={styles.captionText} numberOfLines={1}>
                    {attachment.caption}
                  </ThemedText>
                </View>
              ) : null}
              <Pressable
                onPress={() => handleCaptionEdit(attachment.id)}
                style={[
                  styles.captionButton,
                  { backgroundColor: theme.backgroundDefault + "cc" },
                ]}
              >
                <Feather name="edit-2" size={10} color={theme.text} />
              </Pressable>
            </View>
          ))}
          {canAddMore ? (
            <View style={styles.addButtonsColumn}>
              <Pressable
                onPress={handleCameraCapture}
                style={[
                  styles.smallAddButton,
                  { backgroundColor: theme.link },
                ]}
              >
                <Feather name="camera" size={18} color={theme.buttonText} />
              </Pressable>
              <Pressable
                onPress={handleGalleryPick}
                style={[
                  styles.smallAddButton,
                  { backgroundColor: theme.backgroundDefault },
                ]}
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
              <ThemedText
                style={[styles.addButtonText, { color: theme.buttonText }]}
              >
                Take Photo
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleGalleryPick}
              style={[
                styles.addButton,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              <Feather name="image" size={20} color={theme.text} />
              <ThemedText style={styles.addButtonText}>From Gallery</ThemedText>
            </Pressable>
          </View>
          <ThemedText
            style={[styles.placeholderText, { color: theme.textSecondary }]}
          >
            {getPlaceholderText()}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  previewContainer: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  previewItem: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
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
  captionButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  captionBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  captionText: {
    fontSize: 10,
  },
  addButtonsColumn: {
    gap: Spacing.xs,
    justifyContent: "center",
  },
  smallAddButton: {
    width: 48,
    height: 48,
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
});
