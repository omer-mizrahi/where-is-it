import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Box, Edit3, FileText, MapPin, Tag } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
  last_seen_notes: string | null;
  loan_date?: string;
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
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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

  if (loading) {
    return (
      <View style={[styles.loadingWrap, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.loadingWrap, { paddingTop: insets.top }]}>
        <Text style={[styles.errorText, RTL.text]}>הפריט לא נמצא</Text>
        <Pressable style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </Pressable>
      </View>
    );
  }

  const isLoaned = item.status === "loaned";

  return (
    <View style={styles.container}>
      {/* Transparent header overlay at top */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        {/* Far right: back button (RTL) */}
        <Pressable
          style={styles.headerBtn}
          onPress={handleBack}
          hitSlop={12}
        >
          <Ionicons name="chevron-forward" size={28} color="#fff" />
        </Pressable>
        {/* Far left: edit + delete actions */}
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerActionBtn}
            onPress={handleEdit}
            hitSlop={12}
          >
            <Edit3 size={22} color="#3b82f6" />
          </Pressable>
          <Pressable
            style={styles.headerActionBtn}
            onPress={handleDelete}
            hitSlop={12}
            disabled={deleting}
          >
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image */}
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Box size={80} color={SLATE_500} strokeWidth={1.5} />
            <Pressable style={styles.heroAddPhotoBtn}>
              <Text style={[styles.heroAddPhotoText, RTL.text]}>הוסף תמונה</Text>
            </Pressable>
          </View>
        )}

        {/* Item header */}
        <View style={styles.itemHeader}>
          <Text style={[styles.itemName, RTL.text]}>{item.name}</Text>
          <View style={[styles.statusChip, item.status === "lost" && styles.statusLost]}>
            <Text style={[styles.statusText, RTL.text]}>
              {STATUS_LABELS[item.status] ?? item.status}
            </Text>
          </View>
        </View>

        {/* Details list (RTL: icon right, label & value next) */}
        <View style={styles.detailsSection}>
          {item.location_name ? (
            <View style={styles.detailRow}>
              <MapPin size={20} color={SLATE_400} style={styles.detailIcon} />
              <Text style={[styles.detailLabel, RTL.text]}>{STRINGS.location}</Text>
              <Text style={[styles.detailValue, RTL.text]}>{item.location_name}</Text>
            </View>
          ) : null}
          {item.category ? (
            <View style={styles.detailRow}>
              <Tag size={20} color={SLATE_400} style={styles.detailIcon} />
              <Text style={[styles.detailLabel, RTL.text]}>{STRINGS.category}</Text>
              <Text style={[styles.detailValue, RTL.text]}>{item.category}</Text>
            </View>
          ) : null}
          {item.description ? (
            <View style={styles.detailRow}>
              <FileText size={20} color={SLATE_400} style={styles.detailIcon} />
              <Text style={[styles.detailLabel, RTL.text]}>{STRINGS.description}</Text>
              <Text style={[styles.detailValue, styles.detailValueMultiline, RTL.text]}>
                {item.description}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Loaned section */}
        {isLoaned && (item.borrower_name || item.loan_date) && (
          <View style={styles.loanedCard}>
            <Text style={[styles.loanedTitle, RTL.text]}>הושאל ל:</Text>
            {item.borrower_name ? (
              <Text style={[styles.loanedValue, RTL.text]}>{item.borrower_name}</Text>
            ) : null}
            {item.loan_date ? (
              <Text style={[styles.loanedDate, RTL.text]}>
                {STRINGS.loanDate}: {new Date(item.loan_date).toLocaleDateString("he-IL")}
              </Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    backgroundColor: SLATE_900,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: SLATE_400,
    fontSize: 18,
  },
  backBtn: {
    marginTop: 16,
  },
  container: {
    flex: 1,
    backgroundColor: SLATE_900,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    padding: 8,
  },
  headerActions: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  headerActionBtn: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.7)",
  },
  heroImage: {
    width: "100%",
    height: 320,
    backgroundColor: SLATE_800,
  },
  heroPlaceholder: {
    width: "100%",
    height: 320,
    backgroundColor: SLATE_800,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  heroAddPhotoBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.8)",
  },
  heroAddPhotoText: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "600",
  },
  scroll: {
    flex: 1,
    backgroundColor: SLATE_900,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  itemHeader: {
    marginBottom: 24,
    alignItems: "flex-end",
  },
  itemName: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 8,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
  },
  statusLost: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  statusText: {
    fontSize: 14,
    color: Colors.dark.text,
    fontWeight: "600",
  },
  detailsSection: {
    gap: 16,
  },
  detailRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    backgroundColor: SLATE_800,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  detailIcon: {
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: SLATE_400,
    fontWeight: "500",
    marginTop: 2,
  },
  detailValue: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark.text,
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
    color: SLATE_400,
    marginBottom: 6,
    fontWeight: "600",
  },
  loanedValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 4,
  },
  loanedDate: {
    fontSize: 14,
    color: SLATE_400,
  },
});
