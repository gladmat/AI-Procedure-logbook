import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { OperativeMediaItem, OPERATIVE_MEDIA_TYPE_LABELS } from "@/types/case";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useMediaCallback } from "@/contexts/MediaCallbackContext";

interface OperativeMediaSectionProps {
  media: OperativeMediaItem[];
  onMediaChange: (media: OperativeMediaItem[]) => void;
  maxItems?: number;
}

export function OperativeMediaSection({
  media,
  onMediaChange,
  maxItems = 20,
}: OperativeMediaSectionProps) {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { registerGenericCallback } = useMediaCallback();
  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();

  const canAddMore = media.length < maxItems;

  const navigateToAddMedia = (uri: string, mimeType: string) => {
    const callbackId = registerGenericCallback((newMedia: OperativeMediaItem) => {
      onMediaChange([...media, newMedia]);
    });
    navigation.navigate("AddOperativeMedia", {
      imageUri: uri,
      mimeType,
      callbackId,
    });
  };

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
        navigateToAddMedia(asset.uri, asset.mimeType || "image/jpeg");
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
        navigateToAddMedia(asset.uri, asset.mimeType || "image/jpeg");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
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
                <Feather name="camera" size={18} color="#fff" />
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
              <Feather name="camera" size={20} color="#fff" />
              <ThemedText style={[styles.addButtonText, { color: "#fff" }]}>
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
});
