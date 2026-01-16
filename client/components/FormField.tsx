import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad" | "email-address";
  unit?: string;
  required?: boolean;
  multiline?: boolean;
  error?: string;
  editable?: boolean;
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  unit,
  required = false,
  multiline = false,
  error,
  editable = true,
}: FormFieldProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
        {required ? (
          <ThemedText style={[styles.required, { color: theme.error }]}>*</ThemedText>
        ) : null}
      </View>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: error ? theme.error : theme.border,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textTertiary}
          keyboardType={keyboardType}
          multiline={multiline}
          editable={editable}
          style={[
            styles.input,
            {
              color: theme.text,
              minHeight: multiline ? 80 : Spacing.inputHeight,
            },
          ]}
        />
        {unit ? (
          <ThemedText style={[styles.unit, { color: theme.textSecondary }]}>
            {unit}
          </ThemedText>
        ) : null}
      </View>
      {error ? (
        <ThemedText style={[styles.error, { color: theme.error }]}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
  required?: boolean;
  error?: string;
}

export function SelectField({
  label,
  value,
  options,
  onSelect,
  required = false,
  error,
}: SelectFieldProps) {
  const { theme } = useTheme();
  const selectedOption = options.find((o) => o.value === value);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
        {required ? (
          <ThemedText style={[styles.required, { color: theme.error }]}>*</ThemedText>
        ) : null}
      </View>
      <View style={styles.optionsRow}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={[
              styles.optionButton,
              {
                backgroundColor:
                  value === option.value
                    ? theme.link + "15"
                    : theme.backgroundDefault,
                borderColor:
                  value === option.value ? theme.link : theme.border,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.optionText,
                {
                  color: value === option.value ? theme.link : theme.text,
                  fontWeight: value === option.value ? "600" : "400",
                },
              ]}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
      {error ? (
        <ThemedText style={[styles.error, { color: theme.error }]}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  labelRow: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  required: {
    marginLeft: Spacing.xs,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.md,
    ...Platform.select({
      web: {
        outlineStyle: "none",
      },
    }),
  },
  unit: {
    fontSize: 14,
    marginLeft: Spacing.sm,
  },
  error: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  optionButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minHeight: Spacing.touchTarget,
    justifyContent: "center",
  },
  optionText: {
    fontSize: 14,
  },
});
