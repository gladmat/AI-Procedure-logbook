import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  FlatList,
  TouchableOpacity,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
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
  autoCapitalize,
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
            backgroundColor: theme.backgroundRoot,
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
          autoCapitalize={autoCapitalize}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.md,
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
  // PickerField styles
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    minHeight: Spacing.inputHeight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pickerButtonText: {
    fontSize: 16,
  },
  pickerPlaceholder: {
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  modalDoneButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  modalDoneText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalList: {
    paddingBottom: Spacing.xl,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalOptionText: {
    fontSize: 16,
  },
  // DatePicker styles
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    minHeight: Spacing.inputHeight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateButtonText: {
    fontSize: 16,
  },
});

// Compact modal-based picker field
interface PickerFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function PickerField({
  label,
  value,
  options,
  onSelect,
  placeholder = "Select...",
  required = false,
  error,
}: PickerFieldProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  
  const selectedOption = options.find((o) => o.value === value);

  return (
    <View style={styles.container}>
      {label ? (
        <View style={styles.labelRow}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            {label}
          </ThemedText>
          {required ? (
            <ThemedText style={[styles.required, { color: theme.error }]}>*</ThemedText>
          ) : null}
        </View>
      ) : null}
      
      <TouchableOpacity
        style={[
          styles.pickerButton,
          {
            backgroundColor: theme.backgroundRoot,
            borderColor: error ? theme.error : theme.border,
          },
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {selectedOption ? (
          <ThemedText style={[styles.pickerButtonText, { color: theme.text, fontWeight: "500" }]}>
            {selectedOption.label}
          </ThemedText>
        ) : (
          <ThemedText style={[styles.pickerPlaceholder, { color: theme.textTertiary }]}>
            {placeholder}
          </ThemedText>
        )}
        <Feather name="chevron-down" size={20} color={theme.textSecondary} />
      </TouchableOpacity>

      {error ? (
        <ThemedText style={[styles.error, { color: theme.error }]}>
          {error}
        </ThemedText>
      ) : null}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setModalVisible(false)}
        >
          <Pressable 
            style={[
              styles.modalContent, 
              { 
                backgroundColor: theme.backgroundElevated,
                paddingBottom: insets.bottom,
              }
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                {label}
              </ThemedText>
              <TouchableOpacity
                style={styles.modalDoneButton}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText style={[styles.modalDoneText, { color: theme.link }]}>
                  Done
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    { borderBottomColor: theme.border },
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    setModalVisible(false);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.modalOptionText,
                      {
                        color: value === item.value ? theme.link : theme.text,
                        fontWeight: value === item.value ? "600" : "400",
                      },
                    ]}
                  >
                    {item.label}
                  </ThemedText>
                  {value === item.value ? (
                    <Feather name="check" size={20} color={theme.link} />
                  ) : null}
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// Date picker field
interface DatePickerFieldProps {
  label: string;
  value: string; // ISO date string YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  clearable?: boolean;
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Select date...",
  required = false,
  error,
  disabled = false,
  clearable = false,
}: DatePickerFieldProps) {
  const { theme } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  
  const dateValue = value ? new Date(value) : new Date();
  
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-NZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    if (selectedDate) {
      const isoDate = selectedDate.toISOString().split("T")[0];
      onChange(isoDate);
    }
  };

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
      
      <Pressable
        style={[
          styles.dateButton,
          {
            backgroundColor: disabled ? theme.backgroundDefault : theme.backgroundRoot,
            borderColor: error ? theme.error : theme.border,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
      >
        {value ? (
          <ThemedText style={[styles.dateButtonText, { color: theme.text }]}>
            {formatDisplayDate(value)}
          </ThemedText>
        ) : (
          <ThemedText style={[styles.dateButtonText, { color: theme.textTertiary }]}>
            {placeholder}
          </ThemedText>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {clearable && value && !disabled ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x-circle" size={18} color={theme.textTertiary} />
            </TouchableOpacity>
          ) : null}
          <Feather name="calendar" size={20} color={theme.textSecondary} />
        </View>
      </Pressable>

      {error ? (
        <ThemedText style={[styles.error, { color: theme.error }]}>
          {error}
        </ThemedText>
      ) : null}

      {showPicker ? (
        Platform.OS === "ios" ? (
          <Modal
            visible={showPicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowPicker(false)}
          >
            <Pressable 
              style={styles.modalOverlay}
              onPress={() => setShowPicker(false)}
            >
              <View 
                style={[
                  styles.modalContent, 
                  { backgroundColor: theme.backgroundElevated }
                ]}
              >
                <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                  <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                    {label}
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.modalDoneButton}
                    onPress={() => setShowPicker(false)}
                  >
                    <ThemedText style={[styles.modalDoneText, { color: theme.link }]}>
                      Done
                    </ThemedText>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={dateValue}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  style={{ height: 200 }}
                />
              </View>
            </Pressable>
          </Modal>
        ) : (
          <DateTimePicker
            value={dateValue}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )
      ) : null}
    </View>
  );
}
