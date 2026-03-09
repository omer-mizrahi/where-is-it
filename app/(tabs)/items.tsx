import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { useColorScheme } from "nativewind";
import { ChevronLeft, MoreVertical, PackageOpen } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
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

const SLATE_700 = "#334155";
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
  contact_name?: string | null;
  contact_phone?: string | null;
  return_date?: string | null;
  last_seen_notes: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  owned: STRINGS.owned,
  loaned: STRINGS.loaned,
  sold: STRINGS.sold,
  lost: STRINGS.lost,
  given: "נמסר",
};

type StatusFilter =
  | "all"
  | "owned"
  | "loaned"
  | "sold"
  | "given"
  | "lost";

const FILTER_CHIPS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "הכל" },
  { id: "owned", label: STRINGS.owned },
  { id: "loaned", label: STRINGS.loaned },
  { id: "sold", label: STRINGS.sold },
  { id: "given", label: "נמסר" },
  { id: "lost", label: STRINGS.lost },
];

function formatPhoneForWhatsApp(raw: string): string {
  const cleaned = raw.replace(/[\s\-]/g, "");
  if (cleaned.startsWith("0")) return "+972" + cleaned.slice(1);
  if (!cleaned.startsWith("+")) return "+972" + cleaned;
  return cleaned;
}

/** Date-only comparison: true if return date is strictly before today (ignores time). */
function checkIsLate(returnDateString: string | null | undefined): boolean {
  if (!returnDateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const returnDate = new Date(returnDateString);
  returnDate.setHours(0, 0, 0, 0);
  return returnDate < today;
}

function getLoanSubStatus(
  returnDate: string | null | undefined
): "unknown" | "late" | "ontime" | null {
  if (returnDate == null || returnDate === "") return "unknown";
  if (checkIsLate(returnDate)) return "late";
  return "ontime";
}

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

function ItemCard({
  item,
  onMarkReturned,
}: {
  item: SupabaseItem;
  onMarkReturned: (id: string) => void;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor = isDark ? SLATE_400 : SLATE_500;
  const [isImgLoading, setIsImgLoading] = useState(!!item.image_url);
  useEffect(() => {
    if (item.image_url) setIsImgLoading(true);
  }, [item.image_url]);

  const contactName =
    item.contact_name ?? item.borrower_name ?? "השואל/ה";
  const contactPhone = item.contact_phone?.trim();
  const isLoaned = item.status === "loaned";
  const subStatus = isLoaned ? getLoanSubStatus(item.return_date) : null;

  const onMorePress = useCallback(() => {
    const buttons =
      item.status === "loaned"
        ? [
            {
              text: "סומן כהוחזר",
              onPress: () => onMarkReturned(item.id),
            },
            { text: "ביטול", style: "cancel" as const },
          ]
        : [{ text: "ביטול", style: "cancel" as const }];
    Alert.alert("פעולות פריט", "", buttons);
  }, [item.id, item.status, onMarkReturned]);

  const onWhatsAppPress = useCallback(() => {
    if (!contactPhone) return;
    const formatted = formatPhoneForWhatsApp(contactPhone);
    const message = `היי ${contactName}, מזכיר/ה לך שעדיין לא קיבלתי את הפריט ${item.name} בחזרה ממך.`;
    const encoded = encodeURIComponent(message);
    Linking.openURL(`whatsapp://send?phone=${formatted}&text=${encoded}`);
  }, [contactPhone, contactName, item.name]);

  return (
    <TouchableOpacity
      className="bg-white dark:bg-slate-800 shadow-sm dark:shadow-none"
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/item/${item.id}`)}
    >
      {/* Far right: thumbnail or fallback icon */}
      <View style={styles.cardThumbWrap}>
        {item.image_url ? (
          <View className="w-16 h-16 rounded-lg overflow-hidden relative">
            <Image
              source={{ uri: item.image_url }}
              className="w-16 h-16 rounded-lg"
              onLoadEnd={() => setIsImgLoading(false)}
              onError={() => setIsImgLoading(false)}
            />
            {isImgLoading && (
              <View className="absolute inset-0 bg-slate-200 dark:bg-slate-700 items-center justify-center">
                <ActivityIndicator size="small" color={iconColor} />
              </View>
            )}
          </View>
        ) : (
          <View className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-slate-700 items-center justify-center">
            <Ionicons name="cube-outline" size={24} color={iconColor} />
          </View>
        )}
      </View>
      {/* Text container: flex-1, right-aligned */}
      <View style={styles.cardContent}>
        <Text className="text-slate-900 dark:text-white" style={[styles.cardName, RTL.text]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.location_name ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={iconColor} />
            <Text className="text-slate-500 dark:text-slate-400" style={[styles.cardLocation, RTL.text]} numberOfLines={1}>
              {item.location_name}
            </Text>
          </View>
        ) : null}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusChip,
              item.status === "lost" && styles.statusLost,
            ]}
          >
            <Text style={[styles.statusText, RTL.text]}>
              {STATUS_LABELS[item.status] ?? item.status}
            </Text>
          </View>
          {subStatus !== null && (
            <View
              style={[
                styles.subStatusChip,
                subStatus === "unknown" && styles.subStatusUnknown,
                subStatus === "late" && styles.subStatusLate,
                subStatus === "ontime" && styles.subStatusOntime,
              ]}
            >
              <Text style={[styles.subStatusText, RTL.text]}>
                {subStatus === "unknown"
                  ? "לא ידוע"
                  : subStatus === "late"
                    ? "באיחור"
                    : "בזמן"}
              </Text>
            </View>
          )}
        </View>
      </View>
      {/* Left: 3-dots menu (far left), WhatsApp (if loaned + phone), chevron */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.moreBtn}
          onPress={(e) => {
            e.stopPropagation();
            onMorePress();
          }}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <MoreVertical size={22} color={iconColor} />
        </TouchableOpacity>
        {isLoaned && contactPhone ? (
          <Pressable
            style={({ pressed }) => [
              styles.whatsappBtn,
              pressed && styles.whatsappBtnPressed,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onWhatsAppPress();
            }}
            hitSlop={8}
          >
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
          </Pressable>
        ) : null}
        <View style={styles.cardChevronWrap}>
          <ChevronLeft size={20} color={iconColor} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ItemsScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams<{ tab?: string }>();
  const isDark = colorScheme === "dark";
  const placeholderColor = isDark ? SLATE_400 : SLATE_500;
  const [items, setItems] = useState<SupabaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    params.tab === "loans" ? "loaned" : "all"
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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const byStatus =
    statusFilter === "all"
      ? items
      : items.filter((i) => i.status === statusFilter);

  const filtered = byStatus.filter(
    (i) =>
      !search.trim() ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.category &&
        i.category.toLowerCase().includes(search.toLowerCase())) ||
      (i.borrower_name &&
        i.borrower_name.toLowerCase().includes(search.toLowerCase())) ||
      (i.contact_name &&
        i.contact_name.toLowerCase().includes(search.toLowerCase()))
  );

  const markAsReturned = useCallback(
    async (itemId: string) => {
      try {
        const { error } = await supabase
          .from("items")
          .update({
            status: "owned",
            contact_name: null,
            contact_phone: null,
            return_date: null,
            action_date: null,
          })
          .eq("id", itemId);
        if (error) throw error;
        await load();
      } catch {
        Alert.alert("שגיאה", "לא ניתן לעדכן. נסה שוב.");
      }
    },
    [load]
  );

  const renderItem = useCallback(
    ({ item }: { item: SupabaseItem }) => (
      <ItemCard item={item} onMarkReturned={markAsReturned} />
    ),
    [markAsReturned]
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
      <View className="flex-1 bg-slate-50 dark:bg-slate-900" style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900" style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search bar: icon FAR RIGHT, input flex-1 textAlign right */}
      <View style={styles.searchWrap}>
        <View className="bg-white dark:bg-slate-800 shadow-sm dark:shadow-none" style={styles.searchRow}>
          <Ionicons name="search" size={22} color={placeholderColor} style={styles.searchIcon} />
          <TextInput
            className="text-slate-900 dark:text-white"
            style={[styles.searchInput, RTL.input]}
            placeholder={STRINGS.searchPlaceholder}
            placeholderTextColor={placeholderColor}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
            blurOnSubmit={true}
          />
        </View>
      </View>

      {/* Filter chips: horizontal inverted FlatList so "הכל" is far right, RTL */}
      <FlatList
        data={[...FILTER_CHIPS].reverse()}
        keyExtractor={(chip) => chip.id}
        horizontal
        inverted
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScrollContent}
        style={styles.chipsScroll}
        renderItem={({ item: chip }) => (
          <Pressable
            className={statusFilter === chip.id ? (chip.id === "lost" ? "" : "") : "bg-white dark:bg-slate-800 shadow-sm dark:shadow-none"}
            style={[
              styles.chip,
              statusFilter === chip.id &&
                (chip.id === "lost" ? styles.chipLostActive : styles.chipActive),
            ]}
            onPress={() => setStatusFilter(chip.id)}
          >
            <Text
              className={statusFilter === chip.id ? "text-white" : "text-slate-900 dark:text-white"}
              style={[
                styles.chipText,
                statusFilter === chip.id && styles.chipTextActive,
                RTL.text,
              ]}
            >
              {chip.label}
            </Text>
          </Pressable>
        )}
      />

      {/* New Item Button */}
      <View style={styles.addItemBtnWrap}>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/(tabs)/add-item", params: { mode: "item" } })}
          activeOpacity={0.9}
          className="bg-white dark:bg-slate-800 shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-700 rounded-2xl py-4 flex-row justify-center items-center mb-4 mt-2"
        >
          <Text className="text-slate-900 dark:text-white font-bold text-lg">הוסף פריט חדש +</Text>
        </TouchableOpacity>
      </View>

      {filtered.length === 0 ? (
        <View style={[styles.emptyWrap, listContentContainerStyle]}>
          <PackageOpen size={64} color={placeholderColor} strokeWidth={1.5} />
          <Text className="text-slate-500 dark:text-slate-400" style={[styles.emptyText, RTL.text]}>אין פריטים עדיין</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={listContentContainerStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
    textAlign: "right",
  },
  searchIcon: {
    marginRight: 8,
  },
  chipsScroll: {
    marginBottom: 16,
    maxHeight: 48,
  },
  chipsScrollContent: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  addItemBtnWrap: {
    paddingHorizontal: 20,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: Colors.dark.primary,
  },
  chipLostActive: {
    backgroundColor: "rgba(239, 68, 68, 0.5)",
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#fff",
  },
  card: {
    flexDirection: "row-reverse",
    alignItems: "center",
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
    position: "relative",
  },
  cardThumb: {
    width: "100%",
    height: "100%",
  },
  cardThumbSkeleton: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SLATE_700,
    alignItems: "center",
    justifyContent: "center",
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
    flex: 1,
  },
  statusRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  cardActions: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  moreBtn: {
    padding: 6,
    borderRadius: 12,
  },
  whatsappBtn: {
    padding: 6,
    borderRadius: 12,
  },
  whatsappBtnPressed: {
    opacity: 0.8,
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
  subStatusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  subStatusUnknown: {
    backgroundColor: "rgba(100, 116, 139, 0.4)",
  },
  subStatusLate: {
    backgroundColor: "rgba(239, 68, 68, 0.3)",
  },
  subStatusOntime: {
    backgroundColor: "rgba(34, 197, 94, 0.3)",
  },
  subStatusText: {
    fontSize: 11,
    color: Colors.dark.text,
    fontWeight: "600",
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    textAlign: "center",
  },
});
