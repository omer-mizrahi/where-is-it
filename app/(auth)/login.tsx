import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "@/lib/supabase";

const SLATE_800 = "#1e293b";
const SLATE_900 = "#0f172a";
const BLUE_600 = "#2563eb";
const SLATE_400 = "#94a3b8";

// פונקציית עזר לניקוי תווים בלתי נראים של RTL/LTR
const sanitizeEmail = (rawEmail: string) => {
  return rawEmail.replace(/[\u200E\u200F\u202A-\u202E]/g, '').trim();
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleSubmit = async () => {
    const cleanEmail = sanitizeEmail(email);
    
    if (!cleanEmail || !password) {
      Alert.alert("שגיאה", "נא למלא אימייל וסיסמה");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) throw error;
      router.replace("/(tabs)");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "אימייל או סיסמה שגויים";
      Alert.alert("שגיאה", message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = sanitizeEmail(email);
    
    if (!cleanEmail) {
      Alert.alert("שגיאה", "נא להזין את כתובת האימייל שלך למעלה כדי לשחזר סיסמה");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      if (error) throw error;
      Alert.alert("נשלח!", "קישור לאיפוס סיסמה נשלח לכתובת האימייל שלך.");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "שגיאה בשליחת קישור לאיפוס";
      Alert.alert("שגיאה", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: SLATE_900 }}
      edges={["top", "left", "right"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 40,
            paddingBottom: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Text
            className="text-3xl font-bold text-white text-center mb-2"
            style={{ textAlign: "center" }}
          >
            איפה זה? 📍
          </Text>
          <Text
            className="text-slate-400 text-center text-base mb-8"
            style={{ color: SLATE_400, textAlign: "center" }}
          >
            התחבר לחשבון שלך
          </Text>

          {/* Email */}
          <Text
            className="text-right text-white font-bold mb-2"
            style={{ textAlign: "right", color: "#fff", fontWeight: "700", marginBottom: 8 }}
          >
            אימייל
          </Text>
          <TextInput
            className="rounded-xl text-white p-4 mb-4"
            style={{
              backgroundColor: SLATE_800,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 16,
              fontSize: 16,
              color: "#fff",
              textAlign: "left", // שונה ל-left
              writingDirection: "ltr", // שונה ל-ltr
            }}
            placeholder="email@example.com"
            placeholderTextColor={SLATE_400}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          {/* Password */}
          <Text
            className="text-right text-white font-bold mb-2"
            style={{ textAlign: "right", color: "#fff", fontWeight: "700", marginBottom: 8 }}
          >
            סיסמה
          </Text>
          <View
            className="rounded-xl flex-row items-center"
            style={{
              backgroundColor: SLATE_800,
              borderRadius: 12,
              paddingLeft: 16, // התאמה ל-LTR
              paddingRight: 12, // התאמה ל-LTR
              paddingVertical: 4,
              marginBottom: 12,
              flexDirection: "row-reverse", // הופך את סדר האייקון והטקסט
              alignItems: "center",
            }}
          >
            <Pressable
              onPress={() => setPasswordVisible((v) => !v)}
              hitSlop={12}
              style={{ padding: 8, marginLeft: 4 }}
            >
              <Ionicons
                name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                size={24}
                color={SLATE_400}
              />
            </Pressable>
            <TextInput
              style={{
                flex: 1,
                fontSize: 16,
                color: "#fff",
                paddingVertical: 12,
                paddingHorizontal: 8,
                textAlign: "left", // שונה ל-left
                writingDirection: "ltr", // שונה ל-ltr
              }}
              placeholder="סיסמה"
              placeholderTextColor={SLATE_400}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              editable={!loading}
            />
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            disabled={loading}
            style={{ width: "100%", marginBottom: 24 }}
          >
            <Text style={{ color: BLUE_600, fontWeight: "600", fontSize: 14, textAlign: "right" }}>
              שכחתי סיסמה?
            </Text>
          </TouchableOpacity>

          {/* Primary action */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className="w-full rounded-2xl p-4 mt-2 flex flex-row items-center justify-center"
            style={{
              backgroundColor: BLUE_600,
              paddingVertical: 16,
              borderRadius: 16,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                className="text-white font-bold text-lg text-center"
                style={{ color: "#fff", fontWeight: "700", fontSize: 18 }}
              >
                התחבר
              </Text>
            )}
          </Pressable>

          {/* New user sign up */}
          <View
            style={{
              marginTop: 24,
              alignItems: "center",
              flexDirection: "row-reverse",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Text style={{ textAlign: "right", fontSize: 16, color: SLATE_400 }}>
              אין לך חשבון?
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/register")}
              disabled={loading}
            >
              <Text style={{ color: "#3b82f6", fontWeight: "600", fontSize: 16 }}>
               הרשמה
              </Text>
            </TouchableOpacity>
          </View>

          {/* Spacer to push demo box to bottom */}
          <View style={{ flex: 1, minHeight: 32 }} />

          {/* Demo credentials */}
          <View
            className="rounded-xl items-center p-4"
            style={{
              backgroundColor: SLATE_800,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              marginTop: "auto",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontWeight: "700",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              לבדיקה מהירה:
            </Text>
            <Text style={{ color: SLATE_400, fontSize: 14, textAlign: "center" }}>
              אימייל: demo@example.com
            </Text>
            <Text style={{ color: SLATE_400, fontSize: 14, textAlign: "center" }}>
              סיסמה: 123456
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}