import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { STRINGS } from "@/constants/strings";
import { RTL } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const RED_500 = "#ef4444";
const SLATE_500 = "#64748b";
const SLATE_400 = "#94a3b8";
const BLUE_600 = "#2563eb";
const SLATE_800 = "#1e293b";
const SLATE_700 = "#334155";

type ThemeOption = "כהה" | "בהיר" | "אוטומטי";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme, setColorScheme } = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("משתמש");
  const [phone, setPhone] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [activeTheme, setActiveTheme] = useState<ThemeOption>("אוטומטי");

  // מודל עריכת פרופיל (הפך למעין "הגדרות חשבון")
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [editName, setEditName] = useState("");

  // מודל שינוי סיסמא
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);

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

  // --- פונקציות Supabase --- //

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("שגיאה", "אנא הזן שם חוקי");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: editName.trim() }
    });
    setLoading(false);

    if (error) {
      Alert.alert("שגיאה בעדכון הפרופיל", error.message);
    } else {
      setFullName(editName.trim());
      setIsEditProfileVisible(false);
      Alert.alert("הצלחה", "הפרופיל עודכן בהצלחה!");
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert("שגיאה", "הסיסמא חייבת להכיל לפחות 6 תווים");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("שגיאה", "הסיסמאות אינן תואמות");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    setLoading(false);

    if (error) {
      Alert.alert("שגיאה בעדכון הסיסמא", error.message);
    } else {
      setIsPasswordVisible(false);
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("הצלחה", "הסיסמא שונתה בהצלחה!");
    }
  };

  // --- סגנונות --- //

  const isThemeActive = (option: ThemeOption) => activeTheme === option;
  const iconColor = colorScheme === "dark" ? SLATE_400 : SLATE_500;
  const isDark = colorScheme === "dark";

  return (
    <>
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
            onPress={() => {
              setEditName(fullName);
              setIsEditProfileVisible(true);
            }}
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

      {/* --- Modals (Safe React Native Styles) --- */}
      
      {/* Edit Profile Modal */}
      <Modal visible={isEditProfileVisible} transparent animationType="fade" onRequestClose={() => setIsEditProfileVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsEditProfileVisible(false)}>
          <Pressable style={[styles.modalBox, { backgroundColor: isDark ? SLATE_800 : "#ffffff" }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, RTL.text, { color: isDark ? "#ffffff" : "#0f172a" }]}>הגדרות פרופיל</Text>
            
            <Text style={[styles.label, RTL.text, { color: isDark ? SLATE_400 : SLATE_500 }]}>שם תצוגה</Text>
            <TextInput
              style={[styles.input, RTL.input, { backgroundColor: isDark ? "#0f172a" : "#f8fafc", color: isDark ? "#ffffff" : "#0f172a", borderColor: isDark ? SLATE_700 : "#e2e8f0" }]}
              placeholder="שם מלא"
              placeholderTextColor={SLATE_400}
              value={editName}
              onChangeText={setEditName}
            />

            {/* כפתור שינוי סיסמא בתוך החלון עריכה */}
            <TouchableOpacity 
              style={[styles.btnSecondaryOutline, { borderColor: isDark ? SLATE_700 : "#e2e8f0" }]} 
              onPress={() => {
                setIsEditProfileVisible(false);
                // השהייה חכמה שמונעת קריסות של שני מודלים פתוחים באייפון
                setTimeout(() => {
                  setNewPassword("");
                  setConfirmPassword("");
                  setIsPasswordVisible(true);
                }, 350); 
              }}
            >
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Ionicons name="lock-closed-outline" size={18} color={isDark ? "#ffffff" : "#0f172a"} />
                <Text style={[RTL.text, { color: isDark ? "#ffffff" : "#0f172a", fontSize: 16, fontWeight: '500' }]}>שנה סיסמא</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnSave, { backgroundColor: BLUE_600 }]} onPress={handleUpdateProfile} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.btnSaveText, RTL.text]}>שמור שם חדש</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.btnCancel} onPress={() => setIsEditProfileVisible(false)} disabled={loading}>
              <Text style={[styles.btnCancelText, RTL.text, { color: isDark ? SLATE_400 : SLATE_500 }]}>סגור</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={isPasswordVisible} transparent animationType="fade" onRequestClose={() => setIsPasswordVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsPasswordVisible(false)}>
          <Pressable style={[styles.modalBox, { backgroundColor: isDark ? SLATE_800 : "#ffffff" }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, RTL.text, { color: isDark ? "#ffffff" : "#0f172a" }]}>שינוי סיסמא</Text>
            <TextInput
              style={[styles.input, RTL.input, { backgroundColor: isDark ? "#0f172a" : "#f8fafc", color: isDark ? "#ffffff" : "#0f172a", borderColor: isDark ? SLATE_700 : "#e2e8f0" }]}
              placeholder="סיסמא חדשה (לפחות 6 תווים)"
              placeholderTextColor={SLATE_400}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={[styles.input, RTL.input, { backgroundColor: isDark ? "#0f172a" : "#f8fafc", color: isDark ? "#ffffff" : "#0f172a", borderColor: isDark ? SLATE_700 : "#e2e8f0" }]}
              placeholder="אימות סיסמא חדשה"
              placeholderTextColor={SLATE_400}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity style={[styles.btnSave, { backgroundColor: BLUE_600 }]} onPress={handleUpdatePassword} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.btnSaveText, RTL.text]}>עדכן סיסמא</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnCancel} onPress={() => setIsPasswordVisible(false)} disabled={loading}>
              <Text style={[styles.btnCancelText, RTL.text, { color: isDark ? SLATE_400 : SLATE_500 }]}>ביטול</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBox: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "right",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "right",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    textAlign: "right",
  },
  btnSecondaryOutline: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  btnSave: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  btnSaveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  btnCancel: {
    paddingVertical: 12,
    alignItems: "center",
  },
  btnCancelText: {
    fontSize: 16,
  },
});