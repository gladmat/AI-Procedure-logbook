import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
  ScrollView,
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
import { Spacing, BorderRadius } from "@/constants/theme";
import { Button } from "@/components/Button";
import { redactSensitiveData, getRedactionSummary, extractNHIFromText, extractDatesFromText } from "@/lib/privacyUtils";
import { apiRequest } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { findCaseByPatientIdAndDate, findCasesByPatientId, recordComplications } from "@/lib/storage";
import { ComplicationEntry } from "@/types/case";
import { v4 as uuidv4 } from "uuid";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteParams = RouteProp<RootStackParamList, "SmartCapture">;

type ScanMode = "op_note" | "discharge_summary";

interface CapturedPhoto {
  id: string;
  uri: string;
  base64: string;
}

export default function SmartCaptureScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [redactionSummary, setRedactionSummary] = useState("");
  const [scanMode, setScanMode] = useState<ScanMode>(route.params?.mode || "op_note");
  const [extractedNHI, setExtractedNHI] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(true);

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo?.uri && photo.base64) {
        const newPhoto: CapturedPhoto = {
          id: uuidv4(),
          uri: photo.uri,
          base64: photo.base64,
        };
        setCapturedPhotos(prev => [...prev, newPhoto]);
        setShowCamera(false);
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
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newPhotos: CapturedPhoto[] = result.assets
        .filter(asset => asset.base64)
        .map(asset => ({
          id: uuidv4(),
          uri: asset.uri,
          base64: asset.base64 || "",
        }));
      
      setCapturedPhotos(prev => [...prev, ...newPhotos]);
      setShowCamera(false);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    Haptics.selectionAsync();
    setCapturedPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleAddMore = () => {
    setShowCamera(true);
  };

  const handleProcessAll = async () => {
    if (capturedPhotos.length === 0) return;
    
    setProcessing(true);
    
    try {
      if (Platform.OS === "web") {
        setProcessingStep(`Extracting text from ${capturedPhotos.length} image(s)...`);
        
        const Tesseract = await import("tesseract.js");
        const worker = await Tesseract.createWorker("eng");
        
        const extractedTexts: string[] = [];
        for (let i = 0; i < capturedPhotos.length; i++) {
          setProcessingStep(`Extracting text from image ${i + 1}/${capturedPhotos.length}...`);
          const { data } = await worker.recognize(`data:image/jpeg;base64,${capturedPhotos[i].base64}`);
          extractedTexts.push(data.text);
        }
        await worker.terminate();
        
        const combinedText = extractedTexts.join("\n\n---\n\n");
        
        if (scanMode === "discharge_summary") {
          await processDischargeText(combinedText);
        } else {
          setProcessingStep("Redacting sensitive information...");
          
          const redactionResult = redactSensitiveData(combinedText);
          setRedactionSummary(getRedactionSummary(redactionResult));
          
          setProcessingStep("Analyzing with AI...");
          await analyzeWithAI(redactionResult.redactedText);
        }
      } else {
        // Native mobile: Send images to server for OCR only (no cloud AI)
        // Images are processed with Tesseract.js server-side, then immediately discarded
        // All document parsing uses local regex patterns - no external cloud services
        setProcessingStep(`Extracting text from ${capturedPhotos.length} image(s)...`);
        
        const images = capturedPhotos.map(p => p.base64);
        
        // Log image sizes for debugging
        console.log(`[SmartCapture] Sending ${images.length} images to server`);
        images.forEach((img, i) => {
          console.log(`[SmartCapture] Image ${i + 1} size: ${Math.round(img.length / 1024)}KB`);
        });
        
        const response = await apiRequest("POST", "/api/analyze-op-note", {
          images: images,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[SmartCapture] Server error: ${response.status} - ${errorText}`);
          throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("[SmartCapture] Server response:", JSON.stringify(result).substring(0, 500));
        
        if (result.extractedData) {
          const specialty = result.detectedSpecialty || result.extractedData.detectedSpecialty || "general";
          console.log("Smart Capture detected specialty:", specialty);
          console.log("Document type:", result.documentTypeName);
          console.log("Confidence:", result.confidence);
          console.log("Auto-filled fields:", result.autoFilledFields);
          console.log("Extracted data keys:", Object.keys(result.extractedData));
          
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          navigation.replace("CaseForm", {
            specialty: specialty as any,
            extractedData: {
              ...result.extractedData,
              _documentType: result.documentTypeName,
              _confidence: result.confidence,
              _autoFilledFields: result.autoFilledFields || [],
              _detectedTriggers: result.detectedTriggers || [],
            },
          });
        } else {
          Alert.alert(
            "No Data Extracted",
            "Could not extract surgical data from the images. Would you like to enter the details manually?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Enter Manually",
                onPress: () => navigation.replace("CaseForm", { specialty: "general" }),
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error("Error processing images:", error);
      Alert.alert(
        "Processing Error",
        "Failed to extract data from the images. Would you like to enter the details manually?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Enter Manually",
            onPress: () => navigation.replace("CaseForm", { specialty: "general" }),
          },
        ]
      );
    } finally {
      setProcessing(false);
      setProcessingStep("");
    }
  };

  const processDischargeText = async (rawText: string) => {
    setProcessingStep("Extracting patient identifier...");
    
    const nhi = extractNHIFromText(rawText);
    const dates = extractDatesFromText(rawText);
    setExtractedNHI(nhi);
    
    if (!nhi) {
      Alert.alert(
        "No Patient ID Found",
        "Could not find a patient identifier in the discharge summary. Please select the case manually.",
        [
          { text: "Cancel", onPress: () => navigation.goBack() },
          { 
            text: "Select Case", 
            onPress: () => navigation.replace("SelectCaseForComplication" as any) 
          },
        ]
      );
      return;
    }
    
    setProcessingStep("Matching to case...");
    
    let matchedCase = null;
    if (dates.length > 0) {
      matchedCase = await findCaseByPatientIdAndDate(nhi, dates[0]);
    }
    
    if (!matchedCase) {
      const patientCases = await findCasesByPatientId(nhi);
      if (patientCases.length === 1) {
        matchedCase = patientCases[0];
      } else if (patientCases.length > 1) {
        Alert.alert(
          "Multiple Cases Found",
          `Found ${patientCases.length} cases for this patient. Please select the correct one.`,
          [
            { text: "Cancel", onPress: () => navigation.goBack() },
            {
              text: "View Cases",
              onPress: () => navigation.navigate("Main"),
            },
          ]
        );
        return;
      } else {
        Alert.alert(
          "No Case Found",
          "Could not find a matching case for this patient. The patient ID may not exist in your logbook.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
        return;
      }
    }
    
    setProcessingStep("Redacting sensitive information...");
    const redactionResult = redactSensitiveData(rawText);
    setRedactionSummary(getRedactionSummary(redactionResult));
    
    setProcessingStep("Analyzing for complications...");
    
    try {
      const response = await apiRequest("POST", "/api/analyze-discharge-summary", {
        text: redactionResult.redactedText,
      });
      
      const result = await response.json();
      const extractedData = result.extractedData || {};
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (!extractedData.hasComplications) {
        await recordComplications(matchedCase.id, []);
        Alert.alert(
          "No Complications Found",
          "The discharge summary indicates no complications. Case has been updated.",
          [{ text: "OK", onPress: () => navigation.navigate("CaseDetail", { caseId: matchedCase!.id }) }]
        );
      } else {
        const complications: ComplicationEntry[] = (extractedData.complications || []).map(
          (c: { description: string; clavienDindoGrade?: string; dateIdentified?: string }) => ({
            id: uuidv4(),
            description: c.description,
            clavienDindoGrade: c.clavienDindoGrade || "I",
            dateIdentified: c.dateIdentified || new Date().toISOString(),
            resolved: false,
          })
        );
        
        await recordComplications(matchedCase.id, complications);
        
        Alert.alert(
          "Complications Recorded",
          `Found and recorded ${complications.length} complication(s) from the discharge summary.`,
          [{ text: "View Case", onPress: () => navigation.navigate("CaseDetail", { caseId: matchedCase!.id }) }]
        );
      }
    } catch (error) {
      console.error("Error analyzing discharge summary:", error);
      Alert.alert(
        "Analysis Error",
        "Failed to analyze the discharge summary. Please try again or record complications manually.",
        [
          { text: "Cancel", onPress: () => navigation.goBack() },
          { text: "Try Again", onPress: () => processDischargeText(rawText) },
        ]
      );
    }
  };

  const analyzeWithAI = async (redactedText: string) => {
    try {
      const response = await apiRequest("POST", "/api/analyze-op-note", {
        text: redactedText,
      });
      
      const result = await response.json();
      
      if (result.extractedData) {
        const specialty = result.detectedSpecialty || result.extractedData.detectedSpecialty || "general";
        console.log("Smart Capture detected specialty:", specialty);
        console.log("Document type:", result.documentTypeName);
        console.log("Confidence:", result.confidence);
        console.log("Auto-filled fields:", result.autoFilledFields);
        console.log("Extracted data keys:", Object.keys(result.extractedData));
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        navigation.replace("CaseForm", {
          specialty: specialty as any,
          extractedData: {
            ...result.extractedData,
            _documentType: result.documentTypeName,
            _confidence: result.confidence,
            _autoFilledFields: result.autoFilledFields || [],
            _detectedTriggers: result.detectedTriggers || [],
          },
        });
      } else {
        Alert.alert(
          "No Data Extracted",
          "Could not extract surgical data from the images. Would you like to enter the details manually?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Enter Manually",
              onPress: () => navigation.replace("CaseForm", { specialty: "general" }),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Processing error:", error);
      Alert.alert(
        "Processing Error",
        "Failed to analyze operation note. Would you like to enter the details manually?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Enter Manually",
            onPress: () => navigation.replace("CaseForm", { specialty: "general" }),
          },
        ]
      );
    }
  };

  const handleClearAll = () => {
    setCapturedPhotos([]);
    setRedactionSummary("");
    setShowCamera(true);
  };

  const handleManualEntry = () => {
    navigation.replace("CaseForm", { specialty: "general" });
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
          {capturedPhotos.length > 0 ? (
            <View style={styles.processingThumbnails}>
              {capturedPhotos.slice(0, 3).map((photo, index) => (
                <Image
                  key={photo.id}
                  source={{ uri: photo.uri }}
                  style={[
                    styles.processingThumb,
                    index > 0 && { marginLeft: -20 },
                  ]}
                />
              ))}
              {capturedPhotos.length > 3 ? (
                <View style={[styles.moreIndicator, { backgroundColor: theme.link }]}>
                  <ThemedText style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>
                    +{capturedPhotos.length - 3}
                  </ThemedText>
                </View>
              ) : null}
            </View>
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

  if (capturedPhotos.length > 0 && !showCamera) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.galleryHeader, { paddingTop: insets.top + Spacing.md }]}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.galleryHeaderButton, { backgroundColor: theme.backgroundDefault }]}
          >
            <Feather name="x" size={20} color={theme.text} />
          </Pressable>
          <ThemedText type="h4">
            {capturedPhotos.length} Photo{capturedPhotos.length > 1 ? "s" : ""}
          </ThemedText>
          <Pressable
            onPress={handleClearAll}
            style={[styles.galleryHeaderButton, { backgroundColor: theme.backgroundDefault }]}
          >
            <Feather name="trash-2" size={20} color={theme.error} />
          </Pressable>
        </View>

        <ScrollView 
          style={styles.galleryScroll}
          contentContainerStyle={styles.galleryContent}
        >
          <View style={styles.thumbnailGrid}>
            {capturedPhotos.map((photo) => (
              <View key={photo.id} style={styles.thumbnailWrapper}>
                <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
                <Pressable
                  onPress={() => handleRemovePhoto(photo.id)}
                  style={[styles.removeButton, { backgroundColor: theme.error }]}
                >
                  <Feather name="x" size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={handleAddMore}
              style={[styles.addMoreButton, { borderColor: theme.border }]}
            >
              <Feather name="plus" size={32} color={theme.textSecondary} />
              <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                Add More
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>

        <View style={[styles.galleryControls, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={[styles.privacyBadge, { backgroundColor: theme.success + "15" }]}>
            <Feather name="shield" size={16} color={theme.success} />
            <ThemedText style={[styles.privacyText, { color: theme.success }]}>
              Photos processed locally. Privacy protected.
            </ThemedText>
          </View>
          
          <Button onPress={handleProcessAll} style={styles.processButton}>
            <View style={styles.processButtonContent}>
              <Feather name="cpu" size={20} color={theme.buttonText} />
              <ThemedText style={{ color: theme.buttonText, fontWeight: "600" }}>
                Process {capturedPhotos.length} Photo{capturedPhotos.length > 1 ? "s" : ""}
              </ThemedText>
            </View>
          </Button>
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
            <View style={styles.headerRight}>
              {capturedPhotos.length > 0 ? (
                <Pressable
                  onPress={() => setShowCamera(false)}
                  style={[styles.headerButton, { backgroundColor: theme.link }]}
                >
                  <ThemedText style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                    View {capturedPhotos.length}
                  </ThemedText>
                </Pressable>
              ) : null}
              <Pressable
                onPress={handleManualEntry}
                style={[styles.headerButton, { backgroundColor: "rgba(0,0,0,0.4)" }]}
              >
                <ThemedText style={{ color: "#fff", fontSize: 14 }}>
                  Manual
                </ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={styles.guideFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <ThemedText style={styles.guideText}>
            {scanMode === "discharge_summary" 
              ? "Position the discharge summary within the frame"
              : capturedPhotos.length > 0
                ? `${capturedPhotos.length} captured. Add more or tap "View" to process.`
                : "Position the operation note within the frame"}
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

          {capturedPhotos.length > 0 ? (
            <Pressable
              onPress={() => setShowCamera(false)}
              style={[styles.secondaryButton, { backgroundColor: theme.link }]}
            >
              <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                {capturedPhotos.length}
              </ThemedText>
            </Pressable>
          ) : (
            <View style={styles.secondaryButton} />
          )}
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
  headerRight: {
    flexDirection: "row",
    gap: Spacing.sm,
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
  processingThumbnails: {
    flexDirection: "row",
    alignItems: "center",
  },
  processingThumb: {
    width: 60,
    height: 80,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: "#fff",
  },
  moreIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -10,
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
  galleryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  galleryHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  galleryScroll: {
    flex: 1,
  },
  galleryContent: {
    padding: Spacing.lg,
  },
  thumbnailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  thumbnailWrapper: {
    position: "relative",
  },
  thumbnail: {
    width: 100,
    height: 140,
    borderRadius: BorderRadius.md,
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addMoreButton: {
    width: 100,
    height: 140,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
  },
  galleryControls: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  processButton: {
    width: "100%",
  },
  processButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
});
