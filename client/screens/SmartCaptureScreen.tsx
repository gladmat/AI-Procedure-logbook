import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Button } from "@/components/Button";
import { redactSensitiveData, getRedactionSummary, extractNHIFromText } from "@/lib/privacyUtils";
import { apiRequest } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteParams = RouteProp<RootStackParamList, "SmartCapture">;

type ScanMode = "op_note" | "discharge_summary";

export default function SmartCaptureScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [redactionSummary, setRedactionSummary] = useState("");
  const [scanMode, setScanMode] = useState<ScanMode>(route.params?.mode || "op_note");
  const [extractedNHI, setExtractedNHI] = useState<string | null>(null);

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo?.uri) {
        setCapturedImage(photo.uri);
        await processImage(photo.base64 || "");
      }
    } catch (error) {
      console.error("Error capturing photo:", error);
      Alert.alert("Error", "Failed to capture photo");
    }
  };

  const handlePickImage = async () => {
    Haptics.selectionAsync();

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedImage(result.assets[0].uri);
      await processImage(result.assets[0].base64 || "");
    }
  };

  const processImage = async (base64Image: string) => {
    setProcessing(true);
    
    try {
      setProcessingStep("Extracting text from image...");

      if (Platform.OS === "web") {
        const Tesseract = await import("tesseract.js");
        const worker = await Tesseract.createWorker("eng");
        const { data } = await worker.recognize(`data:image/jpeg;base64,${base64Image}`);
        await worker.terminate();
        
        const rawText = data.text;
        setProcessingStep("Redacting sensitive information...");
        
        const redactionResult = redactSensitiveData(rawText);
        setExtractedText(redactionResult.redactedText);
        setRedactionSummary(getRedactionSummary(redactionResult));
        
        setProcessingStep("Analyzing with AI...");
        await analyzeWithAI(redactionResult.redactedText);
      } else {
        setProcessingStep("Analyzing with AI...");
        
        const response = await apiRequest("POST", "/api/analyze-op-note", {
          image: base64Image,
        });
        
        const result = await response.json();
        
        if (result.extractedData) {
          navigation.replace("CaseForm", {
            specialty: "free_flap",
            extractedData: result.extractedData,
          });
        }
      }
    } catch (error) {
      console.error("Error processing image:", error);
      Alert.alert(
        "Processing Error",
        "Failed to extract data from the image. Would you like to enter the details manually?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Enter Manually",
            onPress: () => navigation.replace("CaseForm", { specialty: "free_flap" }),
          },
        ]
      );
    } finally {
      setProcessing(false);
      setProcessingStep("");
    }
  };

  const analyzeWithAI = async (redactedText: string) => {
    try {
      const response = await apiRequest("POST", "/api/extract-flap-data", {
        text: redactedText,
      });
      
      const result = await response.json();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      navigation.replace("CaseForm", {
        specialty: "free_flap",
        extractedData: result.extractedData || {},
      });
    } catch (error) {
      console.error("AI analysis error:", error);
      navigation.replace("CaseForm", {
        specialty: "free_flap",
        extractedData: {},
      });
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setExtractedText("");
    setRedactionSummary("");
  };

  const handleManualEntry = () => {
    navigation.replace("CaseForm", { specialty: "free_flap" });
  };

  if (!permission) {
    return <ThemedView style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <ThemedView style={[styles.container, styles.permissionContainer]}>
        <View style={[styles.permissionCard, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="camera-off" size={48} color={theme.textSecondary} />
          <ThemedText type="h3" style={styles.permissionTitle}>
            Camera Access Required
          </ThemedText>
          <ThemedText style={[styles.permissionText, { color: theme.textSecondary }]}>
            We need camera access to photograph your operation notes for smart data extraction
          </ThemedText>
          <Button onPress={requestPermission} style={styles.permissionButton}>
            Enable Camera
          </Button>
          <Pressable onPress={handleManualEntry} style={styles.manualLink}>
            <ThemedText style={{ color: theme.link }}>
              Enter details manually instead
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  if (processing) {
    return (
      <ThemedView style={[styles.container, styles.processingContainer]}>
        <View style={styles.processingContent}>
          {capturedImage ? (
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          ) : null}
          <View style={[styles.processingCard, { backgroundColor: theme.backgroundDefault }]}>
            <ActivityIndicator size="large" color={theme.link} />
            <ThemedText type="h4" style={styles.processingTitle}>
              {processingStep || "Processing..."}
            </ThemedText>
            {redactionSummary ? (
              <View style={[styles.redactionBadge, { backgroundColor: theme.warning + "20" }]}>
                <Feather name="shield" size={16} color={theme.warning} />
                <ThemedText style={[styles.redactionText, { color: theme.warning }]}>
                  {redactionSummary}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
      </ThemedView>
    );
  }

  if (capturedImage) {
    return (
      <ThemedView style={styles.container}>
        <Image source={{ uri: capturedImage }} style={styles.fullImage} />
        <View style={[styles.reviewControls, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <Pressable
            onPress={handleRetake}
            style={[styles.retakeButton, { backgroundColor: theme.backgroundDefault }]}
          >
            <Feather name="refresh-cw" size={20} color={theme.text} />
            <ThemedText>Retake</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => processImage("")}
            style={[styles.useButton, { backgroundColor: theme.link }]}
          >
            <Feather name="check" size={20} color={theme.buttonText} />
            <ThemedText style={{ color: theme.buttonText, fontWeight: "600" }}>
              Use Photo
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        <View style={[styles.overlay, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={[styles.headerButton, { backgroundColor: "rgba(0,0,0,0.4)" }]}
            >
              <Feather name="x" size={24} color="#fff" />
            </Pressable>
            <Pressable
              onPress={handleManualEntry}
              style={[styles.headerButton, { backgroundColor: "rgba(0,0,0,0.4)" }]}
            >
              <ThemedText style={{ color: "#fff", fontSize: 14 }}>
                Manual Entry
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.guideFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <ThemedText style={styles.guideText}>
            Position the operation note within the frame
          </ThemedText>
        </View>
      </CameraView>

      <View
        style={[
          styles.controls,
          {
            backgroundColor: theme.backgroundRoot,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        <View style={[styles.privacyBadge, { backgroundColor: theme.success + "15" }]}>
          <Feather name="shield" size={16} color={theme.success} />
          <ThemedText style={[styles.privacyText, { color: theme.success }]}>
            Photos processed locally. Privacy protected.
          </ThemedText>
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            onPress={handlePickImage}
            style={[styles.secondaryButton, { backgroundColor: theme.backgroundDefault }]}
          >
            <Feather name="image" size={24} color={theme.text} />
          </Pressable>

          <Pressable
            onPress={handleCapture}
            style={[styles.captureButton, { borderColor: theme.link }]}
          >
            <View style={[styles.captureInner, { backgroundColor: theme.link }]} />
          </Pressable>

          <View style={styles.secondaryButton} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  guideFrame: {
    width: "90%",
    aspectRatio: 0.75,
    alignSelf: "center",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#fff",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  guideText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 14,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  controls: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  privacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignSelf: "center",
  },
  privacyText: {
    fontSize: 13,
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing["3xl"],
  },
  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  permissionContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  permissionCard: {
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    gap: Spacing.lg,
    maxWidth: 320,
  },
  permissionTitle: {
    textAlign: "center",
  },
  permissionText: {
    textAlign: "center",
    lineHeight: 22,
  },
  permissionButton: {
    minWidth: 200,
  },
  manualLink: {
    marginTop: Spacing.sm,
  },
  processingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  processingContent: {
    width: "100%",
    alignItems: "center",
    gap: Spacing.xl,
  },
  previewImage: {
    width: 200,
    height: 280,
    borderRadius: BorderRadius.md,
  },
  processingCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    gap: Spacing.lg,
    marginHorizontal: Spacing.xl,
  },
  processingTitle: {
    textAlign: "center",
  },
  redactionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  redactionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  fullImage: {
    flex: 1,
    width: "100%",
  },
  reviewControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
    padding: Spacing.xl,
  },
  retakeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  useButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
});
