import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/useColorScheme";

type Mode = "login" | "signup";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert("Required", "Please enter your email");
      return;
    }
    if (!password) {
      Alert.alert("Required", "Please enter your password");
      return;
    }
    if (mode === "signup") {
      if (password.length < 8) {
        Alert.alert("Weak Password", "Password must be at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert("Mismatch", "Passwords do not match");
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await signup(email.trim(), password);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.backgroundRoot }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.content, { paddingTop: insets.top + Spacing["4xl"], paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.link + "15" }]}>
            <Feather name="clipboard" size={40} color={colors.link} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Surgical Logbook</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@hospital.org"
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                value={password}
                onChangeText={setPassword}
                placeholder={mode === "signup" ? "Min 8 characters" : "Your password"}
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                style={[styles.showPasswordButton, { borderColor: colors.border }]}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {mode === "signup" && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          <Pressable
            style={[styles.submitButton, { backgroundColor: colors.link, opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === "login" ? "Sign In" : "Create Account"}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
          </Text>
          <Pressable onPress={toggleMode}>
            <Text style={[styles.footerLink, { color: colors.link }]}>
              {mode === "login" ? "Sign Up" : "Sign In"}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.display,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    ...Typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
  },
  passwordContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  passwordInput: {
    flex: 1,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
  },
  showPasswordButton: {
    width: Spacing.inputHeight,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  submitButtonText: {
    ...Typography.bodySemibold,
    color: "#FFF",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing["3xl"],
  },
  footerText: {
    ...Typography.body,
  },
  footerLink: {
    ...Typography.bodySemibold,
  },
});
