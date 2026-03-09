import React, { useState } from "react";
import { View, Pressable, Modal, StyleSheet } from "react-native";
import { Feather } from "@/components/FeatherIcon";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, BorderRadius } from "@/constants/theme";

interface InfoButtonProps {
  title: string;
  content: string;
}

export function InfoButton({ title, content }: InfoButtonProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setShowInfo(true)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Feather name="info" size={14} color={theme.textTertiary} />
      </Pressable>

      <Modal
        visible={showInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfo(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowInfo(false)}>
          <Pressable
            style={[
              styles.card,
              {
                backgroundColor: theme.backgroundElevated,
                paddingBottom: Math.max(insets.bottom, Spacing.lg),
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <ThemedText style={styles.title}>{title}</ThemedText>
              <Pressable
                onPress={() => setShowInfo(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.body}>
              <ThemedText
                style={[styles.content, { color: theme.textSecondary }]}
              >
                {content}
              </ThemedText>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  body: {
    padding: Spacing.lg,
  },
  content: {
    fontSize: 14,
    lineHeight: 21,
  },
});
