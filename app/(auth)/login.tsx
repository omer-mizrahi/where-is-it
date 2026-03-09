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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Alert.alert("שגיאה", "נא למלא אימייל וסיסמה");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
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
            className="rounded-xl text-right text-white p-4 mb-4"
            style={{
              backgroundColor: SLATE_800,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 16,
              fontSize: 16,
              color: "#fff",
              textAlign: "right",
              writingDirection: "rtl",
            }}
            placeholder="אימייל"
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
              paddingLeft: 12,
              paddingRight: 16,
              paddingVertical: 4,
              marginBottom: 24,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Pressable
              onPress={() => setPasswordVisible((v) => !v)}
              hitSlop={12}
              style={{ padding: 8, marginRight: 4 }}
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
                textAlign: "right",
                writingDirection: "rtl",
              }}
              placeholder="סיסמה"
              placeholderTextColor={SLATE_400}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              editable={!loading}
            />
          </View>

          {/* Primary action */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className="w-full rounded-2xl p-4 mt-6 flex flex-row items-center justify-center"
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
                צור חשבון
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
