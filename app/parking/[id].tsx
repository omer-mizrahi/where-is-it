import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { useColorScheme } from "nativewind";
import { Box, ChevronRight, Edit3, FileText, MapPin, Trash2 } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
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

const SLATE_400 = "#94a3b8";
const SLATE_500 = "#64748b";

interface ParkingRecord {
  id: string;
  user_id: string;
  notes: string | null;
  location_name: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  created_at: string;
}

function getMapLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export default function ParkingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor = isDark ? SLATE_400 : SLATE_500;
  const [item, setItem] = useState<ParkingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("parkings")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      setItem(data as ParkingRecord);
    } catch {
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleBack = () => router.back();

  const handleDelete = () => {
    Alert.alert("מחיקת חניה", "האם למחוק חניה זו?", [
      { text: STRINGS.cancel, style: "cancel" },
      {
        text: STRINGS.delete,
        style: "destructive",
        onPress: async () => {
          if (!id) return;
          setDeleting(true);
          try {
            const { error } = await supabase.from("parkings").delete().eq("id", id);
            if (error) throw error;
            router.back();
          } catch {
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
    router.push({ pathname: "/(tabs)/add-item", params: { mode: "parking", id: item.id } });
  };

  const handleNavigate = () => {
    if (!item) return;
    Linking.openURL(getMapLink(item.latitude, item.longitude));
  };

  if (loading) {
    return (
      <View
        className="flex-1 bg-slate-50 dark:bg-slate-900"
        style={[styles.loadingWrap, { paddingTop: insets.top }]}
      >
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  if (!item) {
    return (
      <View
        className="flex-1 bg-slate-50 dark:bg-slate-900"
        style={[styles.loadingWrap, { paddingTop: insets.top }]}
      >
        <Text className="text-slate-500 dark:text-slate-400" style={[styles.errorText, RTL.text]}>
          החניה לא נמצאה
        </Text>
        <Pressable style={styles.backBtn} onPress={handleBack}>
          <ChevronRight size={24} color={isDark ? "#fff" : "#0f172a"} />
        </Pressable>
      </View>
    );
  }

  const formattedDate = new Date(item.created_at).toLocaleString("he-IL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      style={{ paddingTop: insets.top }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header bar: Back right, Edit + Delete left (RTL) */}
      <View
        className="flex-row justify-between items-center px-4 py-2"
        style={{ flexDirection: "row-reverse" }}
      >
        <View className="flex-row gap-2" style={{ flexDirection: "row-reverse" }}>
          <Pressable
            onPress={handleEdit}
            hitSlop={12}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800"
          >
            <Edit3 size={22} color="#3b82f6" />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            hitSlop={12}
            disabled={deleting}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800"
          >
            <Trash2 size={22} color="#ef4444" />
          </Pressable>
        </View>
        <Pressable onPress={handleBack} hitSlop={12} className="p-2">
          <ChevronRight size={28} color={isDark ? "#fff" : "#0f172a"} />
        </Pressable>
      </View>

      {/* Title */}
      <View className="px-4 mt-2 mb-2" style={{ alignItems: "flex-end" }}>
        <Text
          className="text-slate-900 dark:text-white text-3xl font-bold text-right"
          style={RTL.text}
        >
          פרטי חניה
        </Text>
        <Text
          className="text-slate-500 dark:text-slate-400 text-sm mt-1 text-right"
          style={RTL.text}
        >
          {formattedDate}
        </Text>
      </View>

      {/* Image */}
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          className="w-full h-56 rounded-3xl mt-4"
          resizeMode="cover"
          style={styles.itemImage}
        />
      ) : (
        <View
          className="h-40 rounded-3xl mt-4 mb-6 bg-white dark:bg-slate-800 shadow-sm dark:shadow-none items-center justify-center"
          style={styles.itemImagePlaceholder}
        >
          <Box size={48} color={iconColor} strokeWidth={1.5} />
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-2" style={RTL.text}>
            אין תמונה
          </Text>
        </View>
      )}

      {/* Details (Location, Notes) */}
      <View style={styles.detailsSection}>
        {item.location_name ? (
          <View
            className="bg-white dark:bg-slate-800 shadow-sm dark:shadow-none"
            style={styles.detailRow}
          >
            <MapPin size={20} color={iconColor} style={styles.detailIcon} />
            <Text className="text-slate-500 dark:text-slate-400" style={[styles.detailLabel, RTL.text]}>
              {STRINGS.location}
            </Text>
            <Text className="text-slate-900 dark:text-white" style={[styles.detailValue, RTL.text]}>
              {item.location_name}
            </Text>
          </View>
        ) : null}
        {item.notes ? (
          <View
            className="bg-white dark:bg-slate-800 shadow-sm dark:shadow-none"
            style={styles.detailRow}
          >
            <FileText size={20} color={iconColor} style={styles.detailIcon} />
            <Text className="text-slate-500 dark:text-slate-400" style={[styles.detailLabel, RTL.text]}>
              הערות
            </Text>
            <Text
              className="text-slate-900 dark:text-white"
              style={[styles.detailValue, styles.detailValueMultiline, RTL.text]}
            >
              {item.notes}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Open in Maps button */}
      <Pressable
        onPress={handleNavigate}
        className="flex-row items-center justify-center gap-2 py-4 mt-6 mx-4 rounded-2xl bg-blue-500"
        style={{ flexDirection: "row-reverse" }}
      >
        <Ionicons name="navigate" size={22} color="#fff" />
        <Text className="text-white font-bold text-base">פתח במפות</Text>
      </Pressable>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
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
});
