import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { STRINGS } from "@/constants/strings";
import { Colors, RTL } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

const DEFAULT_USER_NAME = "משתמש";

const ACCENT_BLUE = "#3B82F6";
const ACCENT_GREEN = "#22c55e";
const ACCENT_RED = "#ef4444";
const ACCENT_PURPLE = "#a855f7";

interface RecentItem {
  id: string;
  name: string;
  created_at: string;
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [totalItems, setTotalItems] = useState(0);
  const [totalParkings, setTotalParkings] = useState(0);
  const [activeLoans, setActiveLoans] = useState(0);
  const [userName, setUserName] = useState(DEFAULT_USER_NAME);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchDashboardData = async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user || !isActive) return;

          const name =
            user.user_metadata?.full_name?.trim() ||
            user.user_metadata?.name?.trim() ||
            (user.email ? user.email.split("@")[0] : null);
          if (name) setUserName(name);
          else setUserName(DEFAULT_USER_NAME);

          const [
            { count: itemsCount },
            { count: parkingsCount },
            { count: loansCount },
            { data: recent },
          ] = await Promise.all([
            supabase
              .from("items")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id),
            supabase
              .from("parkings")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id),
            supabase
              .from("items")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("status", "loaned"),
            supabase
              .from("items")
              .select("id, name, created_at")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(3),
          ]);

          if (isActive) {
            setTotalItems(itemsCount ?? 0);
            setTotalParkings(parkingsCount ?? 0);
            setActiveLoans(loansCount ?? 0);
            setRecentItems((recent ?? []) as RecentItem[]);
          }
        } catch {
          if (isActive) {
            setTotalItems(0);
            setTotalParkings(0);
            setActiveLoans(0);
            setRecentItems([]);
          }
        }
      };

      fetchDashboardData();
      return () => {
        isActive = false;
      };
    }, [])
  );

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top, 20) },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header: strictly right-aligned greeting + subtitle */}
      <View style={styles.header}>
        <Text className="text-slate-900 dark:text-white" style={[styles.greeting, RTL.text]}>
          {STRINGS.greeting}, {userName}
        </Text>
        <Text className="text-slate-500 dark:text-slate-400" style={[styles.subtitle, RTL.text]}>{STRINGS.dashboard}</Text>
      </View>

      {/* Stats row: RTL order — Total Items (far right) → Parkings → Active Loans */}
      <View style={styles.statsRow}>
        <View className="bg-white dark:bg-slate-800 shadow-sm dark:shadow-none" style={styles.statCard}>
          <Text className="text-slate-900 dark:text-white" style={[styles.statValue, RTL.text]}>{totalItems}</Text>
          <Text className="text-slate-500 dark:text-slate-400" style={[styles.statLabel, RTL.text]}>{STRINGS.totalItems}</Text>
        </View>
        <View className="bg-white dark:bg-slate-800 shadow-sm dark:shadow-none" style={styles.statCard}>
          <Text className="text-slate-900 dark:text-white" style={[styles.statValue, RTL.text]}>{totalParkings}</Text>
          <Text className="text-slate-500 dark:text-slate-400" style={[styles.statLabel, RTL.text]}>{STRINGS.savedParkings}</Text>
        </View>
        <View className="bg-white dark:bg-slate-800 shadow-sm dark:shadow-none" style={styles.statCard}>
          <Text className="text-slate-900 dark:text-white" style={[styles.statValue, RTL.text]}>{activeLoans}</Text>
          <Text className="text-slate-500 dark:text-slate-400" style={[styles.statLabel, RTL.text]}>{STRINGS.activeLoans}</Text>
        </View>
      </View>

      <Text className="text-slate-900 dark:text-white" style={[styles.sectionTitle, RTL.text]}>פעולות מהירות</Text>
      <View className="w-full mb-7">
        <TouchableOpacity
          className="flex-row justify-end items-center bg-white dark:bg-slate-800 p-4 rounded-2xl mb-3 shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800"
          onPress={() =>
            router.push({ pathname: "/(tabs)/add-item", params: { mode: "item" } })
          }
          activeOpacity={0.9}
          style={{ flexDirection: "row-reverse" }}
        >
          <View className="flex-1 items-end">
            <Text className="text-slate-900 dark:text-white font-bold text-lg text-right">{STRINGS.addItem}</Text>
            <Text className="text-slate-500 dark:text-slate-400 text-sm text-right mt-0.5">הוסף פריט לרשימה</Text>
          </View>
          <Ionicons name="add" size={26} color={ACCENT_BLUE} style={{ marginLeft: 12 }} />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row justify-end items-center bg-white dark:bg-slate-800 p-4 rounded-2xl mb-3 shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800"
          onPress={() =>
            router.push({ pathname: "/(tabs)/add-item", params: { mode: "parking" } })
          }
          activeOpacity={0.9}
          style={{ flexDirection: "row-reverse" }}
        >
          <View className="flex-1 items-end">
            <Text className="text-slate-900 dark:text-white font-bold text-lg text-right">{STRINGS.whereDidIPark}</Text>
            <Text className="text-slate-500 dark:text-slate-400 text-sm text-right mt-0.5">שמור מיקום חניה</Text>
          </View>
          <Ionicons name="location" size={26} color={ACCENT_GREEN} style={{ marginLeft: 12 }} />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row justify-end items-center bg-white dark:bg-slate-800 p-4 rounded-2xl mb-3 shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800"
          onPress={() => router.push("/(tabs)/items")}
          activeOpacity={0.9}
          style={{ flexDirection: "row-reverse" }}
        >
          <View className="flex-1 items-end">
            <Text className="text-slate-900 dark:text-white font-bold text-lg text-right">{STRINGS.search}</Text>
            <Text className="text-slate-500 dark:text-slate-400 text-sm text-right mt-0.5">חפש פריטים ומיקומים</Text>
          </View>
          <Ionicons name="search" size={26} color={ACCENT_RED} style={{ marginLeft: 12 }} />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row justify-end items-center bg-white dark:bg-slate-800 p-4 rounded-2xl mb-3 shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800"
          onPress={() =>
            router.push({ pathname: "/(tabs)/items", params: { tab: "loans" } })
          }
          activeOpacity={0.9}
          style={{ flexDirection: "row-reverse" }}
        >
          <View className="flex-1 items-end">
            <Text className="text-slate-900 dark:text-white font-bold text-lg text-right">{STRINGS.manageLoans}</Text>
            <Text className="text-slate-500 dark:text-slate-400 text-sm text-right mt-0.5">נהל השאלות פעילות</Text>
          </View>
          <Ionicons name="people" size={26} color={ACCENT_PURPLE} style={{ marginLeft: 12 }} />
        </TouchableOpacity>
      </View>

      <Text className="text-slate-900 dark:text-white" style={[styles.sectionTitle, RTL.text]}>{STRINGS.recentActivity}</Text>
      <View className="bg-white dark:bg-slate-800 shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-700" style={styles.activityList}>
        {recentItems.length === 0 ? (
          <View className="bg-white dark:bg-slate-800" style={styles.emptyState}>
            <Text className="text-slate-500 dark:text-slate-400" style={[styles.emptyText, RTL.text]}>אין פעילות אחרונה</Text>
          </View>
        ) : (
          recentItems.map((item) => (
            <Pressable
              key={item.id}
              className="border-b border-slate-200 dark:border-slate-700"
              style={({ pressed }) => [
                styles.activityRow,
                pressed && styles.activityRowPressed,
              ]}
              onPress={() => router.push(`/item/${item.id}`)}
            >
              <View style={[styles.activityRowContent, styles.activityRowRTL]}>
                <Ionicons name="chevron-back" size={20} color="#64748b" />
                <View style={styles.activityContent}>
                  <Text className="text-slate-900 dark:text-white" style={[styles.activityName, RTL.text]}>{item.name}</Text>
                  <Text className="text-slate-500 dark:text-slate-400" style={[styles.activityMeta, RTL.text]}>
                    {new Date(item.created_at).toLocaleDateString("he-IL")}
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
    textAlign: "right",
  },
  subtitle: {
    fontSize: 14,
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
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "right",
  },
  activityList: {
    borderRadius: 16,
    overflow: "hidden",
  },
  activityRow: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
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
    textAlign: "right",
  },
  activityMeta: {
    fontSize: 12,
    marginTop: 2,
    textAlign: "right",
  },
  emptyState: {
    borderRadius: 16,
    padding: 24,
  },
  emptyText: {
    textAlign: "right",
    fontSize: 15,
  },
});
