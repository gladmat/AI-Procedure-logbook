import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Pressable,
  ActivityIndicator,
  Platform,
  TextInput,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { FormField, SelectField } from "@/components/FormField";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getCase, saveCase } from "@/lib/storage";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import {
  ExcisionCompleteness,
  EXCISION_COMPLETENESS_LABELS,
  SkinLesionExcisionDetails,
} from "@/types/case";

type RouteParams = RouteProp<RootStackParamList, "HistologyCapture">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const COMPLETENESS_OPTIONS = Object.entries(EXCISION_COMPLETENESS_LABELS).map(
  ([value, label]) => ({ value, label })
);

interface ExtractedHistologyData {
  histologyDiagnosis: string;
  peripheralMarginMm: number | null;
  deepMarginMm: number | null;
  excisionCompleteness: ExcisionCompleteness;
  confidence: number;
}

export default function HistologyCaptureScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const cameraRef = useRef<CameraView>(null);

  const { caseId, procedureIndex } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [diagnosis, setDiagnosis] = useState("");
  const [peripheralMargin, setPeripheralMargin] = useState("");
  const [deepMargin, setDeepMargin] = useState("");
  const [completeness, setCompleteness] = useState<ExcisionCompleteness>("uncertain");
  const [confidence, setConfidence] = useState(0);

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo?.uri) {
        setCapturedImage(photo.uri);
        if (photo.base64) {
          await processImage(photo.base64);
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setCapturedImage(asset.uri);
        if (asset.base64) {
          await processImage(asset.base64);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const processImage = async (base64Image: string) => {
    setProcessing(true);

    try {
      const response = await fetch(
        new URL("/api/analyze-histology", getApiUrl()).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Image }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to analyze histology report");
      }

      const data = await response.json();
      const extracted: ExtractedHistologyData = data.extractedData;

      setDiagnosis(extracted.histologyDiagnosis || "");
      setPeripheralMargin(
        extracted.peripheralMarginMm !== null
          ? String(extracted.peripheralMarginMm)
          : ""
      );
      setDeepMargin(
        extracted.deepMarginMm !== null ? String(extracted.deepMarginMm) : ""
      );
      setCompleteness(extracted.excisionCompleteness || "uncertain");
      setConfidence(extracted.confidence || 0);

      setShowConfirmation(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error processing image:", error);
      Alert.alert(
        "Processing Failed",
        "Could not extract data from the image. Please try again or enter the data manually.",
        [
          { text: "Try Again", onPress: () => setCapturedImage(null) },
          { text: "Enter Manually", onPress: () => setShowConfirmation(true) },
        ]
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!diagnosis.trim()) {
      Alert.alert("Required", "Please enter the histology diagnosis");
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const caseData = await getCase(caseId);
      if (!caseData) {
        throw new Error("Case not found");
      }

      const histologyDetails: SkinLesionExcisionDetails = {
        histologyDiagnosis: diagnosis.trim(),
        peripheralMarginMm: peripheralMargin ? parseFloat(peripheralMargin) : undefined,
        deepMarginMm: deepMargin ? parseFloat(deepMargin) : undefined,
        excisionCompleteness: completeness,
        histologyReportCapturedAt: new Date().toISOString(),
      };

      if (procedureIndex !== undefined && caseData.procedures && caseData.procedures[procedureIndex]) {
        caseData.procedures[procedureIndex].clinicalDetails = {
          ...caseData.procedures[procedureIndex].clinicalDetails,
          ...histologyDetails,
        };
      } else {
        caseData.clinicalDetails = {
          ...caseData.clinicalDetails,
          ...histologyDetails,
        };
      }

      if (!caseData.pathologicalDiagnosis || !caseData.pathologicalDiagnosis.displayName) {
        caseData.pathologicalDiagnosis = {
          displayName: diagnosis.trim(),
          date: new Date().toISOString(),
        };
      }

      await saveCase(caseData);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved", "Histology results have been added to the case", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error saving histology data:", error);
      Alert.alert("Error", "Failed to save histology data. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setShowConfirmation(false);
    setDiagnosis("");
    setPeripheralMargin("");
    setDeepMargin("");
    setCompleteness("uncertain");
    setConfidence(0);
  };

  if (!permission) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.link} />
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={[styles.centered, { paddingHorizontal: Spacing.lg }]}>
        <Feather name="camera-off" size={48} color={theme.textSecondary} />
        <ThemedText style={[styles.permissionText, { color: theme.text }]}>
          Camera access is required to capture histology reports
        </ThemedText>
        <Button onPress={requestPermission}>Enable Camera</Button>
      </ThemedView>
    );
  }

  if (showConfirmation) {
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
        <View style={styles.headerSection}>
          <ThemedText style={[styles.title, { color: theme.text }]}>
            Review Histology Results
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Please review and confirm the extracted data
          </ThemedText>
          {confidence > 0 ? (
            <View
              style={[
                styles.confidenceBadge,
                {
                  backgroundColor:
                    confidence > 0.6
                      ? theme.success + "20"
                      : confidence > 0.3
                      ? theme.warning + "20"
                      : theme.error + "20",
                },
              ]}
            >
              <Feather
                name={confidence > 0.6 ? "check-circle" : "alert-circle"}
                size={14}
                color={
                  confidence > 0.6
                    ? theme.success
                    : confidence > 0.3
                    ? theme.warning
                    : theme.error
                }
              />
              <ThemedText
                style={[
                  styles.confidenceText,
                  {
                    color:
                      confidence > 0.6
                        ? theme.success
                        : confidence > 0.3
                        ? theme.warning
                        : theme.error,
                  },
                ]}
              >
                {confidence > 0.6
                  ? "High confidence"
                  : confidence > 0.3
                  ? "Medium confidence"
                  : "Low confidence"}{" "}
                - please verify
              </ThemedText>
            </View>
          ) : null}
        </View>

        {capturedImage ? (
          <Card style={styles.imagePreviewCard}>
            <Image
              source={{ uri: capturedImage }}
              style={styles.previewImage}
              contentFit="contain"
            />
          </Card>
        ) : null}

        <View style={styles.formSection}>
          <FormField
            label="Histology Diagnosis"
            value={diagnosis}
            onChangeText={setDiagnosis}
            placeholder="e.g., Basal cell carcinoma, nodular type"
            required
            multiline
          />

          <View style={styles.marginRow}>
            <View style={styles.marginField}>
              <FormField
                label="Peripheral Margin (mm)"
                value={peripheralMargin}
                onChangeText={setPeripheralMargin}
                placeholder="e.g., 2.5"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.marginField}>
              <FormField
                label="Deep Margin (mm)"
                value={deepMargin}
                onChangeText={setDeepMargin}
                placeholder="e.g., 1.5"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <SelectField
            label="Excision Completeness"
            value={completeness}
            options={COMPLETENESS_OPTIONS}
            onSelect={(value) => setCompleteness(value as ExcisionCompleteness)}
          />
        </View>

        <View style={styles.buttonRow}>
          <Button
            variant="outline"
            onPress={retakePhoto}
            style={styles.retakeButton}
          >
            Retake Photo
          </Button>
          <Button
            onPress={handleSave}
            disabled={saving}
            style={styles.saveButton}
          >
            {saving ? "Saving..." : "Confirm & Save"}
          </Button>
        </View>
      </KeyboardAwareScrollViewCompat>
    );
  }

  return (
    <View style={[styles.cameraContainer, { backgroundColor: theme.backgroundRoot }]}>
      {capturedImage ? (
        <View style={styles.processingContainer}>
          <Image
            source={{ uri: capturedImage }}
            style={styles.capturedImage}
            contentFit="contain"
          />
          {processing ? (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color={theme.buttonText} />
              <ThemedText style={styles.processingText}>
                Analyzing histology report...
              </ThemedText>
            </View>
          ) : null}
        </View>
      ) : (
        <>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          >
            <View style={styles.cameraOverlay}>
              <View style={[styles.guideBorder, { borderColor: theme.link }]} />
            </View>
          </CameraView>

          <View
            style={[
              styles.controlsContainer,
              {
                backgroundColor: theme.backgroundRoot,
                paddingBottom: insets.bottom + Spacing.lg,
              },
            ]}
          >
            <ThemedText style={[styles.instructionText, { color: theme.textSecondary }]}>
              Position the histology report within the frame
            </ThemedText>

            <View style={styles.captureRow}>
              <Pressable
                onPress={pickImage}
                style={[styles.galleryButton, { backgroundColor: theme.backgroundDefault }]}
              >
                <Feather name="image" size={24} color={theme.text} />
              </Pressable>

              <Pressable
                onPress={takePhoto}
                style={[styles.captureButton, { borderColor: theme.link }]}
              >
                <View style={[styles.captureInner, { backgroundColor: theme.link }]} />
              </Pressable>

              <View style={styles.galleryButton} />
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
  },
  permissionText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  guideBorder: {
    width: "85%",
    aspectRatio: 0.7,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: BorderRadius.lg,
  },
  controlsContainer: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  instructionText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  captureRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing["2xl"],
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  galleryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  processingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  capturedImage: {
    width: "100%",
    height: "100%",
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  processingText: {
    color: "#fff",
    fontSize: 16,
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
  },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    alignSelf: "flex-start",
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: "500",
  },
  imagePreviewCard: {
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 200,
  },
  formSection: {
    gap: Spacing.md,
  },
  marginRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  marginField: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  retakeButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});
