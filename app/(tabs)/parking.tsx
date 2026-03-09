import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { Car, Edit3 } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
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

async function fetchParkingsForUser(): Promise<ParkingRecord[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("parkings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ParkingRecord[];
}

export default function ParkingScreen() {
  const insets = useSafeAreaInsets();
  const [parkings, setParkings] = useState<ParkingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await fetchParkingsForUser();
      setParkings(list);
    } catch {
      setParkings([]);
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

  const goToAddParking = () => {
    router.push({ pathname: "/(tabs)/add-item", params: { mode: "parking" } });
  };

  const navigateToCar = (record: ParkingRecord) => {
    Linking.openURL(getMapLink(record.latitude, record.longitude));
  };

  const deleteParking = (record: ParkingRecord) => {
    Alert.alert("מחיקת חניה?", "האם למחוק חניה זו?", [
      { text: STRINGS.cancel, style: "cancel" },
      {
        text: STRINGS.delete,
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.from("parkings").delete().eq("id", record.id);
            if (error) throw error;
            await load();
          } catch {
            Alert.alert("שגיאה", "לא ניתן למחוק.");
          }
        },
      },
    ]);
  };

  const renderItem = useCallback(
    ({ item }: { item: ParkingRecord }) => (
      <View style={styles.historyCard}>
        {/* Far right: thumbnail or fallback */}
        <View style={styles.historyThumbWrap}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.historyThumb}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.historyThumbFallback}>
              <Ionicons name="car-outline" size={28} color={SLATE_400} />
            </View>
          )}
        </View>
        {/* Center: date, location, notes (right-aligned) */}
        <View style={styles.historyContent}>
          <Text style={[styles.historyDate, RTL.text]}>
            {new Date(item.created_at).toLocaleString("he-IL", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </Text>
          {item.location_name ? (
            <View style={styles.historyLocationRow}>
              <Ionicons name="location-outline" size={14} color={SLATE_400} />
              <Text style={[styles.historyLocation, RTL.text]} numberOfLines={1}>
                {item.location_name}
              </Text>
            </View>
          ) : null}
          {item.notes ? (
            <Text style={[styles.historyNotes, RTL.text]} numberOfLines={2}>
              {item.notes}
            </Text>
          ) : null}
        </View>
        {/* Far left: actions (navigate, edit, delete) */}
        <View style={styles.historyActions}>
          <Pressable
            style={({ pressed }) => [styles.actionIconBtn, pressed && styles.actionIconBtnPressed]}
            onPress={() => navigateToCar(item)}
          >
            <Ionicons name="navigate" size={24} color={Colors.dark.primary} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionIconBtn, pressed && styles.actionIconBtnPressed]}
            onPress={() =>
              router.push({ pathname: "/(tabs)/add-item", params: { mode: "parking", id: item.id } })
            }
          >
            <Edit3 size={22} color="#3b82f6" />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionIconBtn, pressed && styles.actionIconBtnPressed]}
            onPress={() => deleteParking(item)}
          >
            <Ionicons name="trash-outline" size={24} color="#ef4444" />
          </Pressable>
        </View>
      </View>
    ),
    []
  );

  const keyExtractor = useCallback((item: ParkingRecord) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        ListHeaderComponent={
          <>
            {/* New Parking Button */}
            <TouchableOpacity
              style={styles.addParkingBtn}
              onPress={goToAddParking}
              activeOpacity={0.9}
            >
              <Text style={[styles.addParkingBtnText, RTL.text]}>הוסף חניה חדשה +</Text>
            </TouchableOpacity>

            {/* History section title */}
            <Text style={[styles.sectionTitle, RTL.text]}>{STRINGS.parkingHistory}</Text>
          </>
        }
        data={parkings}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.dark.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Car size={64} color={SLATE_400} strokeWidth={1.5} />
            <Text style={[styles.emptyText, RTL.text]}>אין חניות שמורות</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  addParkingBtn: {
    backgroundColor: SLATE_800,
    borderWidth: 1,
    borderColor: SLATE_700,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  addParkingBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 16,
    textAlign: "right",
  },
  historyCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: SLATE_800,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  historyThumbWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 12,
  },
  historyThumb: {
    width: "100%",
    height: "100%",
  },
  historyThumbFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
  },
  historyContent: {
    flex: 1,
    alignItems: "flex-end",
    marginRight: 12,
  },
  historyDate: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 4,
  },
  historyLocationRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  historyLocation: {
    fontSize: 13,
    color: SLATE_400,
  },
  historyNotes: {
    fontSize: 13,
    color: "#64748b",
  },
  historyActions: {
    flexDirection: "column",
    gap: 12,
  },
  actionIconBtn: {
    padding: 8,
  },
  actionIconBtnPressed: { opacity: 0.8 },
  emptyWrap: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: SLATE_400,
    fontSize: 18,
    marginTop: 16,
    textAlign: "center",
  },
});
