import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { STRINGS } from "@/constants/strings";
import { Colors, RTL } from "@/constants/theme";

const CARD_BG = "#1e293b"; // slate-800
const CARD_BORDER = "#334155"; // slate-700
const RED_500 = "#ef4444";

type ThemeMode = "light" | "dark" | "auto";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>("dark");

  const signOut = () => {
    router.replace("/(auth)/login");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top, 20) },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.screenTitle, RTL.text]}>{STRINGS.profile}</Text>
        <View style={styles.avatar}>
          <Text style={[styles.avatarText, RTL.text]}>מ</Text>
        </View>
        <Text style={[styles.userName, RTL.text]}>משתמש</Text>
        <Text style={[styles.userEmail, RTL.text]}>user@example.com</Text>
      </View>

      {/* Card 1: Account & preferences */}
      <View style={styles.card}>
        <Pressable
          style={({ pressed }) => [
            styles.row,
            styles.rowBorder,
            pressed && styles.rowPressed,
          ]}
        >
          <View style={styles.rowRTL}>
            <View style={styles.iconTextGroup}>
              <Ionicons name="person-outline" size={22} color={Colors.dark.icon} />
              <Text style={[styles.rowText, RTL.text]}>{STRINGS.editProfile}</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color={Colors.dark.muted} />
          </View>
        </Pressable>

        <View style={[styles.row, styles.rowBorder]}>
          <View style={styles.rowRTL}>
            <View style={styles.iconTextGroup}>
              <Ionicons name="notifications-outline" size={22} color={Colors.dark.icon} />
              <Text style={[styles.rowText, RTL.text]}>{STRINGS.notifications}</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: "#475569", true: Colors.dark.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.rowRTL}>
            <View style={styles.themeBlock}>
              <View style={[styles.themeChips, styles.themeChipsRTL]}>
                {(["dark", "light", "auto"] as const).map((t) => (
                  <Pressable
                    key={t}
                    style={[styles.themeChip, theme === t && styles.themeChipActive]}
                    onPress={() => setTheme(t)}
                  >
                    <Text
                      style={[
                        styles.themeChipText,
                        theme === t && styles.themeChipTextActive,
                        RTL.text,
                      ]}
                    >
                      {t === "dark"
                        ? STRINGS.dark
                        : t === "light"
                          ? STRINGS.light
                          : STRINGS.auto}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.rowText, RTL.text]}>{STRINGS.theme}</Text>
              <Ionicons name="moon-outline" size={22} color={Colors.dark.icon} />
            </View>
          </View>
        </View>
      </View>

      {/* Card 2: Data & privacy */}
      <View style={styles.card}>
        <Pressable
          style={({ pressed }) => [
            styles.row,
            styles.rowBorder,
            pressed && styles.rowPressed,
          ]}
        >
          <View style={styles.rowRTL}>
            <View style={styles.iconTextGroup}>
              <Ionicons name="download-outline" size={22} color={Colors.dark.icon} />
              <Text style={[styles.rowText, RTL.text]}>{STRINGS.exportData}</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color={Colors.dark.muted} />
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
          <View style={styles.rowRTL}>
            <View style={styles.iconTextGroup}>
              <Ionicons name="shield-outline" size={22} color={Colors.dark.icon} />
              <Text style={[styles.rowText, RTL.text]}>{STRINGS.privacy}</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color={Colors.dark.muted} />
          </View>
        </Pressable>
      </View>

      {/* Logout: icon right, text left of it, danger red */}
      <Pressable
        style={({ pressed }) => [
          styles.signOutBtn,
          pressed && styles.signOutBtnPressed,
        ]}
        onPress={signOut}
      >
        <View style={styles.signOutRow}>
          <Ionicons name="log-out-outline" size={22} color={RED_500} />
          <Text style={[styles.signOutText, RTL.text]}>{STRINGS.signOut}</Text>
        </View>
      </Pressable>
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
    alignItems: "center",
    marginBottom: 32,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "700",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.dark.text,
    marginTop: 12,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.dark.muted,
    marginTop: 4,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
  },
  rowPressed: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  /** RTL row: far right = first in group, far left = last. Use row-reverse so icon (right) then text then action (left). */
  rowRTL: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  /** Icon far right, text right of icon (so text then icon in RTL order). */
  iconTextGroup: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: "500",
    textAlign: "right",
  },
  themeBlock: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  themeChips: {
    flexDirection: "row",
    gap: 8,
  },
  themeChipsRTL: {
    flexDirection: "row-reverse",
  },
  themeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.dark.background,
  },
  themeChipActive: {
    backgroundColor: Colors.dark.primary,
  },
  themeChipText: {
    fontSize: 12,
    color: Colors.dark.text,
    textAlign: "right",
  },
  themeChipTextActive: {
    color: "#fff",
  },
  signOutBtn: {
    paddingVertical: 16,
    marginTop: 12,
  },
  signOutBtnPressed: {
    opacity: 0.8,
  },
  signOutRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: RED_500,
    textAlign: "right",
  },
});
