import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useColorScheme } from "nativewind";
import { Box, Check, Edit3, FileText, MapPin, Tag } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

const SLATE_800 = "#1e293b";
const SLATE_900 = "#0f172a";
const SLATE_400 = "#94a3b8";
const SLATE_500 = "#64748b";
const GREEN_500 = "#22c55e";

/** Date-only: true if return date is strictly before today. */
function checkIsLate(returnDateString: string | null | undefined): boolean {
  if (!returnDateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const returnDate = new Date(returnDateString);
  returnDate.setHours(0, 0, 0, 0);
  return returnDate < today;
}

function getLoanBadgeLabel(
  returnDate: string | null | undefined
): "לא ידוע" | "באיחור" | "בזמן" {
  if (returnDate == null || returnDate === "") return "לא ידוע";
  return checkIsLate(returnDate) ? "באיחור" : "בזמן";
}

interface ItemDetails {
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
  action_date?: string | null;
  loan_date?: string;
  last_seen_notes: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  owned: STRINGS.owned,
  loaned: STRINGS.loaned,
  sold: STRINGS.sold,
  lost: STRINGS.lost,
};

export default function ItemDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor = isDark ? SLATE_400 : SLATE_500;
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [markingReturned, setMarkingReturned] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      setItem(data as ItemDetails);
    } catch {
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBack = () => router.back();

  const handleDelete = () => {
    Alert.alert("מחיקת פריט", "האם אתה בטוח?", [
      { text: "ביטול", style: "cancel" },
      {
        text: "מחק",
        style: "destructive",
        onPress: async () => {
          if (!id) return;
          setDeleting(true);
          try {
            const { error } = await supabase.from("items").delete().eq("id", id);
            if (error) throw error;
            router.back();
          } catch (e) {
            Alert.alert("שגיאה", "לא ניתן למחוק. נסה שוב.");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    if (!item) return;
    router.push({ pathname: "/(tabs)/add-item", params: { mode: "item", id: item.id } });
  };

  const handleMarkReturned = useCallback(async () => {
    if (!id) return;
    setMarkingReturned(true);
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
        .eq("id", id);
      if (error) throw error;
      await load();
    } catch {
      Alert.alert("שגיאה", "לא ניתן לעדכן. נסה שוב.");
    } finally {
      setMarkingReturned(false);
    }
  }, [id, load]);

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-900" style={[styles.loadingWrap, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-900" style={[styles.loadingWrap, { paddingTop: insets.top }]}>
        <Text className="text-slate-500 dark:text-slate-400" style={[styles.errorText, RTL.text]}>הפריט לא נמצא</Text>
        <Pressable style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="chevron-forward" size={24} color={isDark ? "#fff" : "#0f172a"} />
        </Pressable>
      </View>
    );
  }

  const isLoaned = item.status === "loaned";

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      style={{ paddingTop: insets.top }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Clean header bar */}
      <View className="flex-row justify-between items-center px-4 py-2" style={{ flexDirection: "row-reverse" }}>
        <View className="flex-row gap-2" style={{ flexDirection: "row-reverse" }}>
          <Pressable onPress={handleEdit} hitSlop={12} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
            <Edit3 size={22} color="#3b82f6" />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            hitSlop={12}
            disabled={deleting}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800"
          >
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </Pressable>
        </View>
        <Pressable onPress={handleBack} hitSlop={12} className="p-2">
          <Ionicons name="chevron-forward" size={28} color={isDark ? "#fff" : "#0f172a"} />
        </Pressable>
      </View>

      {/* Title & Status */}
      <View className="px-4 mt-2 mb-2" style={{ alignItems: "flex-end" }}>
        <Text className="text-slate-900 dark:text-white text-3xl font-bold text-right" style={RTL.text}>
          {item.name}
        </Text>
        <View
          className={`mt-2 px-3 py-1.5 rounded-2xl ${item.status === "lost" ? "bg-red-500/20" : "bg-blue-500/20"}`}
        >
          <Text className="text-slate-900 dark:text-white text-sm font-semibold text-right" style={RTL.text}>
            {STATUS_LABELS[item.status] ?? item.status}
          </Text>
        </View>
      </View>

      {/* Image below title - smaller & elegant */}
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          className="w-full h-56 rounded-3xl mt-4 mb-6"
          resizeMode="cover"
          style={styles.itemImage}
        />
      ) : (
        <View className="h-40 rounded-3xl mt-4 mb-6 bg-white dark:bg-slate-800 shadow-sm dark:shadow-none items-center justify-center" style={styles.itemImagePlaceholder}>
          <Box size={48} color={iconColor} strokeWidth={1.5} />
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-2" style={RTL.text}>
            אין תמונה
          </Text>
        </View>
      )}

      {/* Details list (RTL: icon right, label & value next) */}
      <View style={styles.detailsSection}>
          {item.location_name ? (
            <View className="bg-white dark:bg-slate-800 shadow-sm dark:shadow-none" style={styles.detailRow}>
              <MapPin size={20} color={iconColor} style={styles.detailIcon} />
              <Text className="text-slate-500 dark:text-slate-400" style={[styles.detailLabel, RTL.text]}>{STRINGS.location}</Text>
              <Text className="text-slate-900 dark:text-white" style={[styles.detailValue, RTL.text]}>{item.location_name}</Text>
            </View>
          ) : null}
          {item.category ? (
            <View className="bg-white dark:bg-slate-800 shadow-sm dark:shadow-none" style={styles.detailRow}>
              <Tag size={20} color={iconColor} style={styles.detailIcon} />
              <Text className="text-slate-500 dark:text-slate-400" style={[styles.detailLabel, RTL.text]}>{STRINGS.category}</Text>
              <Text className="text-slate-900 dark:text-white" style={[styles.detailValue, RTL.text]}>{item.category}</Text>
            </View>
          ) : null}
          {item.description ? (
            <View className="bg-white dark:bg-slate-800 shadow-sm dark:shadow-none" style={styles.detailRow}>
              <FileText size={20} color={iconColor} style={styles.detailIcon} />
              <Text className="text-slate-500 dark:text-slate-400" style={[styles.detailLabel, RTL.text]}>{STRINGS.description}</Text>
              <Text className="text-slate-900 dark:text-white" style={[styles.detailValue, styles.detailValueMultiline, RTL.text]}>
                {item.description}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Loaned section (פרטי השאלה) */}
        {isLoaned && (
          <View className="border border-slate-200 dark:border-slate-700" style={styles.loanedCard}>
            <Text className="text-slate-500 dark:text-slate-400" style={[styles.loanedTitle, RTL.text]}>פרטי השאלה</Text>
            {(item.contact_name ?? item.borrower_name) ? (
              <Text className="text-slate-900 dark:text-white" style={[styles.loanedValue, RTL.text]}>
                {item.contact_name ?? item.borrower_name}
              </Text>
            ) : null}
            {(item.action_date ?? item.loan_date) ? (
              <Text className="text-slate-500 dark:text-slate-400" style={[styles.loanedDate, RTL.text]}>
                {STRINGS.loanDate}:{" "}
                {new Date(
                  (item.action_date ?? item.loan_date) as string
                ).toLocaleDateString("he-IL")}
              </Text>
            ) : null}
            {item.return_date ? (
              <Text className="text-slate-500 dark:text-slate-400" style={[styles.loanedDate, RTL.text]}>
                תאריך החזרה צפוי:{" "}
                {new Date(item.return_date).toLocaleDateString("he-IL")}
              </Text>
            ) : null}
            <View style={styles.loanedBadgeRow}>
              <View
                style={[
                  styles.loanedBadge,
                  getLoanBadgeLabel(item.return_date) === "באיחור" &&
                    styles.loanedBadgeLate,
                  getLoanBadgeLabel(item.return_date) === "בזמן" &&
                    styles.loanedBadgeOntime,
                ]}
              >
                <Text className="text-slate-900 dark:text-white" style={[styles.loanedBadgeText, RTL.text]}>
                  {getLoanBadgeLabel(item.return_date)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.markReturnedButton, markingReturned && styles.markReturnedButtonDisabled]}
              onPress={handleMarkReturned}
              disabled={markingReturned}
              activeOpacity={0.85}
            >
              {markingReturned ? (
                <ActivityIndicator size="small" color={GREEN_500} />
              ) : (
                <Check size={20} color={GREEN_500} style={styles.markReturnedIcon} />
              )}
              <Text className="text-slate-900 dark:text-white" style={[styles.markReturnedButtonText, RTL.text]}>
                הפריט התקבל בחזרה
              </Text>
            </TouchableOpacity>
          </View>
        )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
  },
  backBtn: {
    marginTop: 16,
  },
  container: {
    flex: 1,
  },
  itemImage: {
    width: "100%",
    height: 224,
    borderRadius: 24,
    marginTop: 16,
    marginBottom: 24,
  },
  itemImagePlaceholder: {
    width: "100%",
    height: 160,
    borderRadius: 24,
    marginTop: 16,
    marginBottom: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  detailsSection: {
    gap: 16,
  },
  detailRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  detailIcon: {
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  detailValue: {
    flex: 1,
    fontSize: 16,
    textAlign: "right",
  },
  detailValueMultiline: {
    marginTop: 4,
  },
  loanedCard: {
    marginTop: 24,
    backgroundColor: "rgba(59, 130, 246, 0.12)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  loanedTitle: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "600",
  },
  loanedValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  loanedDate: {
    fontSize: 14,
  },
  loanedBadgeRow: {
    flexDirection: "row-reverse",
    marginTop: 10,
    marginBottom: 14,
  },
  loanedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "rgba(100, 116, 139, 0.4)",
  },
  loanedBadgeLate: {
    backgroundColor: "rgba(239, 68, 68, 0.3)",
  },
  loanedBadgeOntime: {
    backgroundColor: "rgba(34, 197, 94, 0.3)",
  },
  loanedBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  markReturnedButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.4)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  markReturnedButtonDisabled: {
    opacity: 0.7,
  },
  markReturnedIcon: {
    marginLeft: 4,
  },
  markReturnedButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
