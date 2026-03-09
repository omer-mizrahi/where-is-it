import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { STRINGS } from "@/constants/strings";
import { RTL } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const RED_500 = "#ef4444";
const SLATE_500 = "#64748b";
const SLATE_400 = "#94a3b8";

type ThemeOption = "כהה" | "בהיר" | "אוטומטי";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme, setColorScheme } = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("משתמש");
  const [phone, setPhone] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [activeTheme, setActiveTheme] = useState<ThemeOption>("אוטומטי");

  useEffect(() => {
    const load = async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      setUser(u ?? null);
      if (u) {
        const metadata = u.user_metadata;
        setFullName(metadata?.full_name?.trim() || "משתמש");
        setPhone(metadata?.phone || "");
      }
    };
    load();
  }, []);

  const avatarLetter =
    fullName && fullName.length > 0
      ? fullName[0].toUpperCase()
      : user?.email?.[0]?.toUpperCase() || "מ";

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  };

  const onPlaceholder = () => {
    Alert.alert("בפיתוח", "פיצ'ר זה יגיע בקרוב!");
  };

  const isThemeActive = (option: ThemeOption) => activeTheme === option;
  const iconColor = colorScheme === "dark" ? SLATE_400 : SLATE_500;

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: Math.max(insets.top, 20),
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="items-center mb-8">
        <Text
          className="text-2xl font-bold text-slate-900 dark:text-white mb-5 text-right w-full"
          style={RTL.text}
        >
          {STRINGS.profile}
        </Text>
        <View className="w-20 h-20 rounded-full bg-blue-600 items-center justify-center">
          <Text
            className="text-3xl font-bold text-white"
            style={RTL.text}
          >
            {avatarLetter}
          </Text>
        </View>
        <Text
          className="text-xl font-bold text-slate-900 dark:text-white mt-3 text-right"
          style={RTL.text}
        >
          {fullName}
        </Text>
        <Text
          className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-right"
          style={RTL.text}
        >
          {user?.email ?? ""}
        </Text>
      </View>

      {/* Card 1: Account & preferences */}
      <View className="bg-white dark:bg-slate-800 rounded-2xl mb-5 overflow-hidden shadow-sm dark:shadow-none px-5">
        <Pressable
          className="flex-row items-center justify-between py-5 border-b border-slate-200 dark:border-slate-700 active:opacity-90"
          onPress={onPlaceholder}
          style={{ flexDirection: "row-reverse" }}
        >
          <View className="flex-row-reverse items-center flex-1 gap-3" style={{ flexDirection: "row-reverse" }}>
            <Ionicons name="person-outline" size={22} color={iconColor} />
            <Text className="flex-1 text-base font-medium text-slate-900 dark:text-white text-right" style={RTL.text}>
              {STRINGS.editProfile}
            </Text>
          </View>
          <Ionicons name="chevron-back" size={20} color={iconColor} />
        </Pressable>

        <Pressable
          className="flex-row items-center justify-between py-5 border-b border-slate-200 dark:border-slate-700 active:opacity-90"
          onPress={onPlaceholder}
          style={{ flexDirection: "row-reverse" }}
        >
          <View className="flex-row-reverse items-center flex-1 gap-3" style={{ flexDirection: "row-reverse" }}>
            <Ionicons name="notifications-outline" size={22} color={iconColor} />
            <Text className="flex-1 text-base font-medium text-slate-900 dark:text-white text-right" style={RTL.text}>
              {STRINGS.notifications}
            </Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: "#475569", true: "#3B82F6" }}
            thumbColor="#fff"
          />
        </Pressable>

        {/* Theme row: strict RTL - right: label + icon, left: 3 buttons */}
        <View
          className="flex-row justify-between items-center w-full py-5"
          style={{ flexDirection: "row-reverse" }}
        >
          <View className="flex-row items-center gap-2" style={{ flexDirection: "row-reverse" }}>
            <Text className="text-base font-medium text-slate-900 dark:text-white text-right" style={RTL.text}>
              {STRINGS.theme}
            </Text>
            <Ionicons name="moon-outline" size={22} color={iconColor} />
          </View>
          <View className="flex-row gap-2" style={{ flexDirection: "row-reverse" }}>
            <Pressable
              onPress={() => {
                setActiveTheme("אוטומטי");
                setColorScheme("system");
              }}
              className={`px-3 py-2 rounded-xl ${isThemeActive("אוטומטי") ? "bg-blue-600" : ""}`}
            >
              <Text
                className={`text-sm text-right ${isThemeActive("אוטומטי") ? "text-white" : "text-slate-500 dark:text-slate-400"}`}
                style={RTL.text}
              >
                אוטומטי
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setActiveTheme("בהיר");
                setColorScheme("light");
              }}
              className={`px-3 py-2 rounded-xl ${isThemeActive("בהיר") ? "bg-blue-600" : ""}`}
            >
              <Text
                className={`text-sm text-right ${isThemeActive("בהיר") ? "text-white" : "text-slate-500 dark:text-slate-400"}`}
                style={RTL.text}
              >
                בהיר
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setActiveTheme("כהה");
                setColorScheme("dark");
              }}
              className={`px-3 py-2 rounded-xl ${isThemeActive("כהה") ? "bg-blue-600" : ""}`}
            >
              <Text
                className={`text-sm text-right ${isThemeActive("כהה") ? "text-white" : "text-slate-500 dark:text-slate-400"}`}
                style={RTL.text}
              >
                כהה
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Card 2: Data & privacy */}
      <View className="bg-white dark:bg-slate-800 rounded-2xl mb-5 overflow-hidden shadow-sm dark:shadow-none px-5">
        <Pressable
          className="flex-row items-center justify-between py-5 border-b border-slate-200 dark:border-slate-700 active:opacity-90"
          onPress={onPlaceholder}
          style={{ flexDirection: "row-reverse" }}
        >
          <View className="flex-row-reverse items-center flex-1 gap-3" style={{ flexDirection: "row-reverse" }}>
            <Ionicons name="download-outline" size={22} color={iconColor} />
            <Text className="flex-1 text-base font-medium text-slate-900 dark:text-white text-right" style={RTL.text}>
              {STRINGS.exportData}
            </Text>
          </View>
          <Ionicons name="chevron-back" size={20} color={iconColor} />
        </Pressable>

        <Pressable
          className="flex-row items-center justify-between py-5 active:opacity-90"
          onPress={onPlaceholder}
          style={{ flexDirection: "row-reverse" }}
        >
          <View className="flex-row-reverse items-center flex-1 gap-3" style={{ flexDirection: "row-reverse" }}>
            <Ionicons name="shield-outline" size={22} color={iconColor} />
            <Text className="flex-1 text-base font-medium text-slate-900 dark:text-white text-right" style={RTL.text}>
              {STRINGS.privacy}
            </Text>
          </View>
          <Ionicons name="chevron-back" size={20} color={iconColor} />
        </Pressable>
      </View>

      {/* Logout */}
      <Pressable
        className="py-4 mt-3 active:opacity-80"
        onPress={signOut}
      >
        <View className="flex-row-reverse items-center justify-center gap-2" style={{ flexDirection: "row-reverse" }}>
          <Ionicons name="log-out-outline" size={22} color={RED_500} />
          <Text className="text-base font-semibold text-right" style={[RTL.text, { color: RED_500 }]}>
            {STRINGS.signOut}
          </Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}
