import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  SectionList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Feather } from "@/components/FeatherIcon";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { getTeamContacts } from "@/lib/teamContactsApi";
import { getCareerStageLabel } from "@shared/careerStages";
import type { TeamContact } from "@/types/teamContacts";
import {
  TEAM_MEMBER_ROLE_SHORT,
  type TeamMemberOperativeRole,
} from "@/types/teamContacts";

type Section = { title: string; data: TeamContact[] };

export default function TeamContactsScreen() {
  const { theme } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { facilities } = useAuth();

  const [contacts, setContacts] = useState<TeamContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadContacts = useCallback(async () => {
    try {
      const data = await getTeamContacts();
      setContacts(data);
    } catch {
      // Silently fail — empty list shown
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadContacts();
    }, [loadContacts]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadContacts();
  }, [loadContacts]);

  const sections = useMemo<Section[]>(() => {
    const facilityMap = new Map<string, string>();
    for (const f of facilities) {
      facilityMap.set(f.id, f.facilityName);
    }

    const grouped = new Map<string, TeamContact[]>();
    const ungrouped: TeamContact[] = [];

    for (const contact of contacts) {
      if (
        !contact.facilityIds ||
        (contact.facilityIds as string[]).length === 0
      ) {
        ungrouped.push(contact);
        continue;
      }
      // Add to first matching facility section
      let placed = false;
      for (const fId of contact.facilityIds as string[]) {
        const name = facilityMap.get(fId);
        if (name) {
          const existing = grouped.get(name) ?? [];
          existing.push(contact);
          grouped.set(name, existing);
          placed = true;
          break;
        }
      }
      if (!placed) ungrouped.push(contact);
    }

    const result: Section[] = [];
    for (const [title, data] of grouped) {
      result.push({ title, data });
    }
    if (ungrouped.length > 0) {
      result.push({ title: "Ungrouped", data: ungrouped });
    }
    return result;
  }, [contacts, facilities]);

  if (loading) {
    return (
      <View
        style={[
          styles.centered,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <ActivityIndicator size="large" color={theme.link} />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      testID="screen-teamContacts"
    >
      {contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather
            name="users"
            size={48}
            color={theme.textTertiary}
          />
          <ThemedText
            style={[styles.emptyTitle, { color: theme.text }]}
          >
            No team members yet
          </ThemedText>
          <ThemedText
            style={[styles.emptySubtitle, { color: theme.textSecondary }]}
          >
            Add colleagues to quickly tag them on cases.
          </ThemedText>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.link}
            />
          }
          renderSectionHeader={({ section: { title } }) => (
            <View
              style={[
                styles.sectionHeader,
                { backgroundColor: theme.backgroundRoot },
              ]}
            >
              <ThemedText
                style={[styles.sectionTitle, { color: theme.textSecondary }]}
              >
                {title.toUpperCase()}
              </ThemedText>
            </View>
          )}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.contactRow,
                {
                  backgroundColor: theme.backgroundElevated,
                  borderColor: theme.border,
                },
              ]}
              onPress={() =>
                navigation.navigate("AddEditTeamContact", {
                  contactId: item.id,
                })
              }
              testID={`teamContacts.row-${item.id}`}
            >
              <View style={styles.contactInfo}>
                <View style={styles.nameRow}>
                  <ThemedText style={[styles.contactName, { color: theme.text }]}>
                    {item.displayName}
                  </ThemedText>
                  {item.linkedUserId && (
                    <Feather
                      name="link"
                      size={14}
                      color={theme.success}
                      style={{ marginLeft: Spacing.xs }}
                    />
                  )}
                </View>
                {item.careerStage && (
                  <ThemedText
                    style={[
                      styles.contactDetail,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {getCareerStageLabel(item.careerStage)}
                  </ThemedText>
                )}
              </View>
              {item.defaultRole && (
                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor: theme.link + "15",
                      borderColor: theme.link + "30",
                    },
                  ]}
                >
                  <ThemedText
                    style={[styles.roleBadgeText, { color: theme.link }]}
                  >
                    {
                      TEAM_MEMBER_ROLE_SHORT[
                        item.defaultRole as TeamMemberOperativeRole
                      ] ?? item.defaultRole
                    }
                  </ThemedText>
                </View>
              )}
              <Feather
                name="chevron-right"
                size={18}
                color={theme.textTertiary}
              />
            </Pressable>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Pressable
        style={[styles.fab, { backgroundColor: theme.link }]}
        onPress={() => navigation.navigate("AddEditTeamContact")}
        testID="teamContacts.btn-add"
      >
        <Feather name="plus" size={24} color={theme.buttonText} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  contactInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
  },
  contactDetail: {
    fontSize: 13,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
