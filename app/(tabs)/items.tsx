import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, PackageOpen } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { STRINGS } from "@/constants/strings";
import { Colors, RTL } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

const SLATE_800 = "#1e293b";
const SLATE_400 = "#94a3b8";
const SLATE_500 = "#64748b";

export interface SupabaseItem {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string | null;
  location_name: string | null;
  status: string;
  image_url: string | null;
  borrower_name: string | null;
  last_seen_notes: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  owned: STRINGS.owned,
  loaned: STRINGS.loaned,
  sold: STRINGS.sold,
  lost: STRINGS.lost,
};

async function fetchItemsForUser(): Promise<SupabaseItem[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as SupabaseItem[];
}

export default function ItemsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [items, setItems] = useState<SupabaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "loans" | "overdue">(
    params.tab === "loans" ? "loans" : "all"
  );

  const load = useCallback(async () => {
    try {
      const list = await fetchItemsForUser();
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const activeLoans = items.filter((i) => i.status === "loaned");
  const overdueLoans = items.filter((i) => {
    if (i.status !== "loaned") return false;
    const ret = (i as { expected_return_date?: string }).expected_return_date;
    if (!ret) return false;
    return new Date(ret) < new Date();
  });

  const filtered =
    activeTab === "loans"
      ? activeLoans
      : activeTab === "overdue"
        ? overdueLoans
        : items.filter(
            (i) =>
              !search.trim() ||
              i.name.toLowerCase().includes(search.toLowerCase()) ||
              (i.category &&
                i.category.toLowerCase().includes(search.toLowerCase())) ||
              (i.borrower_name &&
                i.borrower_name.toLowerCase().includes(search.toLowerCase()))
          );

  const renderItem = useCallback(
    ({ item }: { item: SupabaseItem }) => (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push(`/item/${item.id}`)}
      >
        {/* Far right: thumbnail or fallback icon */}
        <View style={styles.cardThumbWrap}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.cardThumb}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.cardThumbFallback}>
              <Ionicons name="cube-outline" size={28} color={SLATE_400} />
            </View>
          )}
        </View>
        {/* Text container: flex-1, right-aligned, margin from image */}
        <View style={styles.cardContent}>
          <Text style={[styles.cardName, RTL.text]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.location_name ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={SLATE_400} />
              <Text style={[styles.cardLocation, RTL.text]} numberOfLines={1}>
                {item.location_name}
              </Text>
            </View>
          ) : null}
          <View style={[styles.statusChip, item.status === "lost" && styles.statusLost]}>
            <Text style={[styles.statusText, RTL.text]}>
              {STATUS_LABELS[item.status] ?? item.status}
            </Text>
          </View>
        </View>
        {/* Far left: chevron (clickable hint) */}
        <View style={styles.cardChevronWrap}>
          <ChevronLeft size={20} color={SLATE_500} />
        </View>
      </TouchableOpacity>
    ),
    []
  );

  const keyExtractor = useCallback((item: SupabaseItem) => item.id, []);

  const listContentContainerStyle = {
    paddingTop: 12,
    paddingBottom: Math.max(insets.bottom, 24) + 24,
    paddingHorizontal: 20,
    flexGrow: 1,
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search bar: icon FAR RIGHT, input flex-1 textAlign right */}
      <View style={styles.searchWrap}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={22} color={SLATE_400} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, RTL.input]}
            placeholder={STRINGS.searchPlaceholder}
            placeholderTextColor={SLATE_400}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filter chips: RTL – הכל first on the right */}
      <View style={styles.chipsRow}>
        <Pressable
          style={[styles.chip, activeTab === "overdue" && styles.chipOverdue]}
          onPress={() => setActiveTab("overdue")}
        >
          <Text
            style={[
              styles.chipText,
              activeTab === "overdue" && styles.chipTextActive,
              RTL.text,
            ]}
          >
            {STRINGS.overdueTab}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.chip, activeTab === "loans" && styles.chipActive]}
          onPress={() => setActiveTab("loans")}
        >
          <Text
            style={[
              styles.chipText,
              activeTab === "loans" && styles.chipTextActive,
              RTL.text,
            ]}
          >
            {STRINGS.activeLoansTab}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.chip, activeTab === "all" && styles.chipActive]}
          onPress={() => setActiveTab("all")}
        >
          <Text
            style={[
              styles.chipText,
              activeTab === "all" && styles.chipTextActive,
              RTL.text,
            ]}
          >
            הכל
          </Text>
        </Pressable>
      </View>

      {/* New Item Button */}
      <View style={styles.addItemBtnWrap}>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/(tabs)/add-item", params: { mode: "item" } })}
          activeOpacity={0.9}
          className="bg-slate-800 border border-slate-700 rounded-2xl py-4 flex-row justify-center items-center mb-4 mt-2"
        >
          <Text className="text-white font-bold text-lg">הוסף פריט חדש +</Text>
        </TouchableOpacity>
      </View>

      {filtered.length === 0 ? (
        <View style={[styles.emptyWrap, listContentContainerStyle]}>
          <PackageOpen size={64} color={SLATE_400} strokeWidth={1.5} />
          <Text style={[styles.emptyText, RTL.text]}>אין פריטים עדיין</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={listContentContainerStyle}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.dark.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  searchWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: SLATE_800,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark.text,
    paddingHorizontal: 10,
    textAlign: "right",
  },
  searchIcon: {
    marginRight: 8,
  },
  chipsRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  addItemBtnWrap: {
    paddingHorizontal: 20,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: SLATE_800,
  },
  chipActive: {
    backgroundColor: Colors.dark.primary,
  },
  chipOverdue: {
    backgroundColor: "#7f1d1d",
  },
  chipText: {
    fontSize: 14,
    color: Colors.dark.text,
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#fff",
  },
  card: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: SLATE_800,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardThumbWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
    marginLeft: 12,
  },
  cardThumb: {
    width: "100%",
    height: "100%",
  },
  cardThumbFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  cardName: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  cardLocation: {
    fontSize: 13,
    color: SLATE_400,
    flex: 1,
  },
  cardChevronWrap: {
    justifyContent: "center",
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
  },
  statusLost: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  statusText: {
    fontSize: 12,
    color: Colors.dark.text,
    fontWeight: "500",
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: SLATE_400,
    fontSize: 18,
    marginTop: 16,
    textAlign: "center",
  },
});
