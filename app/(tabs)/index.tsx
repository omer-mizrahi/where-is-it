import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, type Item } from "@/lib/api";
import { STRINGS } from "@/constants/strings";
import { Colors, RTL } from "@/constants/theme";

const PLACEHOLDER_USER = "משתמש";

const CARD_BG = "#1e293b"; // slate-800
const ACCENT_BLUE = "#3B82F6";
const ACCENT_GREEN = "#22c55e";
const ACCENT_RED = "#ef4444";
const ACCENT_PURPLE = "#a855f7";

const QUICK_ACTIONS = [
  {
    id: "add",
    title: STRINGS.addItem,
    subtitle: "הוסף פריט לרשימה",
    icon: "add" as const,
    color: ACCENT_BLUE,
    href: "/(tabs)/add-item",
    push: null,
  },
  {
    id: "parking",
    title: STRINGS.whereDidIPark,
    subtitle: "שמור מיקום חניה",
    icon: "location" as const,
    color: ACCENT_GREEN,
    href: null,
    push: "/(tabs)/parking",
  },
  {
    id: "search",
    title: STRINGS.search,
    subtitle: "חפש פריטים ומיקומים",
    icon: "search" as const,
    color: ACCENT_RED,
    href: null,
    push: "/(tabs)/items",
  },
  {
    id: "loans",
    title: STRINGS.manageLoans,
    subtitle: "נהל השאלות פעילות",
    icon: "people" as const,
    color: ACCENT_PURPLE,
    href: null,
    push: "/(tabs)/items?tab=loans",
  },
] as const;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Item[]>([]);
  const [parkingCount, setParkingCount] = useState(0);
  const [activeLoansCount, setActiveLoansCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const [itemList, parkings] = await Promise.all([
        api.getItems(),
        api.getParkings(),
      ]);
      setItems(itemList);
      setParkingCount(parkings.length);
      setActiveLoansCount(api.getActiveLoans().length);
    };
    load();
  }, []);

  const recentActivity = items.slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top, 20) },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header: strictly right-aligned greeting + subtitle */}
      <View style={styles.header}>
        <Text style={[styles.greeting, RTL.text]}>
          {STRINGS.greeting}, {PLACEHOLDER_USER}
        </Text>
        <Text style={[styles.subtitle, RTL.text]}>{STRINGS.dashboard}</Text>
      </View>

      {/* Stats row: RTL order — Total Items (far right) → Parkings → Active Loans */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, RTL.text]}>{items.length}</Text>
          <Text style={[styles.statLabel, RTL.text]}>{STRINGS.totalItems}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, RTL.text]}>{parkingCount}</Text>
          <Text style={[styles.statLabel, RTL.text]}>{STRINGS.savedParkings}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, RTL.text]}>{activeLoansCount}</Text>
          <Text style={[styles.statLabel, RTL.text]}>{STRINGS.activeLoans}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, RTL.text]}>פעולות מהירות</Text>
      <View style={styles.quickStack}>
        {QUICK_ACTIONS.map((action) => {
          const content = (
            <View style={styles.quickCardRow}>
              <View style={[styles.quickIconWrap, { backgroundColor: `${action.color}22` }]}>
                <Ionicons name={action.icon} size={26} color={action.color} />
              </View>
              <View style={styles.quickCardTextWrap}>
                <Text style={[styles.quickCardTitle, RTL.text]}>{action.title}</Text>
                <Text style={[styles.quickCardSubtitle, RTL.text]}>{action.subtitle}</Text>
              </View>
            </View>
          );
          return action.href ? (
            <Link key={action.id} href={action.href as any} asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.quickCard,
                  pressed && styles.quickCardPressed,
                ]}
              >
                {content}
              </Pressable>
            </Link>
          ) : (
            <Pressable
              key={action.id}
              style={({ pressed }) => [
                styles.quickCard,
                pressed && styles.quickCardPressed,
              ]}
              onPress={() => router.push(action.push as any)}
            >
              {content}
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, RTL.text]}>{STRINGS.recentActivity}</Text>
      <View style={styles.activityList}>
        {recentActivity.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, RTL.text]}>אין פעילות אחרונה</Text>
          </View>
        ) : (
          recentActivity.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.activityRow,
                pressed && styles.activityRowPressed,
              ]}
              onPress={() =>
                router.push({ pathname: "/(tabs)/items", params: { id: item.id } })
              }
            >
              <View style={[styles.activityRowContent, styles.activityRowRTL]}>
                <Ionicons name="chevron-back" size={20} color={Colors.dark.muted} />
                <View style={styles.activityContent}>
                  <Text style={[styles.activityName, RTL.text]}>{item.name}</Text>
                  <Text style={[styles.activityMeta, RTL.text]}>
                    {item.category} • {new Date(item.updatedAt).toLocaleDateString("he-IL")}
                  </Text>
                </View>
                <View style={styles.activityBullet} />
              </View>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.dark.text,
    textAlign: "right",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.muted,
    marginTop: 4,
    textAlign: "right",
  },
  statsRow: {
    flexDirection: "row-reverse",
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.dark.text,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.muted,
    marginTop: 8,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 12,
    textAlign: "right",
  },
  quickStack: {
    gap: 12,
    marginBottom: 28,
  },
  quickCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  quickCardPressed: { opacity: 0.9 },
  quickCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quickIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  quickCardTextWrap: {
    flex: 1,
    marginRight: 16,
    alignItems: "flex-end",
  },
  quickCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
    textAlign: "right",
  },
  quickCardSubtitle: {
    fontSize: 13,
    color: Colors.dark.muted,
    marginTop: 2,
    textAlign: "right",
  },
  activityList: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    overflow: "hidden",
  },
  activityRow: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  activityRowPressed: { backgroundColor: "rgba(255,255,255,0.05)" },
  activityRowRTL: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  activityBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.primary,
  },
  activityContent: { flex: 1 },
  activityName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
    textAlign: "right",
  },
  activityMeta: {
    fontSize: 12,
    color: Colors.dark.muted,
    marginTop: 2,
    textAlign: "right",
  },
  emptyState: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 24,
  },
  emptyText: {
    color: Colors.dark.muted,
    textAlign: "right",
    fontSize: 15,
  },
});
