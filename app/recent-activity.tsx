import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RTL } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

interface RecentItem {
  id: string;
  name: string;
  created_at: string;
}

async function fetchRecentItems(): Promise<RecentItem[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("items")
    .select("id, name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as RecentItem[];
}

export default function RecentActivityScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        try {
          const list = await fetchRecentItems();
          if (isActive) setItems(list);
        } catch {
          if (isActive) setItems([]);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      setLoading(true);
      load();
      return () => {
        isActive = false;
      };
    }, [])
  );

  return (
    <View
        className="flex-1 bg-slate-50 dark:bg-slate-900"
        style={{ paddingTop: insets.top }}
      >
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: Math.max(insets.bottom, 24) + 24,
            }}
            showsVerticalScrollIndicator={false}
          >
            {items.length === 0 ? (
              <View className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-700">
                <Text
                  className="text-slate-500 dark:text-slate-400 text-center"
                  style={RTL.text}
                >
                  אין פעילות
                </Text>
              </View>
            ) : (
              items.map((item) => {
                const formattedDate = new Date(
                  item.created_at
                ).toLocaleString("he-IL", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });
                return (
                  <TouchableOpacity
                    key={item.id}
                    className="flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl mb-3 shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-700"
                    onPress={() => router.push(`/item/${item.id}`)}
                    activeOpacity={0.9}
                    style={{ flexDirection: "row-reverse" }}
                  >
                    <View
                      className="flex-row items-center gap-3"
                      style={{
                        flexDirection: "row-reverse",
                        flex: 1,
                      }}
                    >
                      <View className="w-3 h-3 rounded-full bg-blue-500" />
                      <View style={{ alignItems: "flex-end" }}>
                        <Text
                          className="text-lg font-bold text-slate-900 dark:text-white text-right"
                          style={RTL.text}
                        >
                          {item.name}
                        </Text>
                        <Text
                          className="text-sm text-slate-500 dark:text-slate-400 text-right"
                          style={RTL.text}
                        >
                          {formattedDate}
                        </Text>
                      </View>
                    </View>
                    <ChevronLeft
                      size={20}
                      color="#94a3b8"
                      style={{ marginLeft: 12 }}
                    />
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}
    </View>
  );
}
