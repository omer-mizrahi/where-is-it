import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { STRINGS } from "@/constants/strings";
import { supabase } from "@/lib/supabase";

const SLATE_800 = "#1e293b";
const SLATE_900 = "#0f172a";
const BLUE_600 = "#2563eb";
const SLATE_400 = "#94a3b8";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"זכר" | "נקבה">("זכר");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onRegister = async () => {
    if (!fullName.trim()) {
      Alert.alert("שגיאה", "נא למלא את שמך המלא");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("שגיאה", "נא למלא מספר טלפון");
      return;
    }
    if (!email.trim() || !password) {
      setError("נא למלא אימייל וסיסמה");
      return;
    }
    if (password !== confirm) {
      setError("הסיסמאות אינן תואמות");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            gender,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        router.replace("/(tabs)");
      } else {
        Alert.alert(
          "נשלח אימייל",
          "נא לאמת את החשבון דרך הקישור שנשלח לאימייל."
        );
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "שגיאה בהרשמה";
      setError(message);
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
            צור חשבון חדש
          </Text>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {/* Full name */}
          <Text
            className="text-right text-white font-bold mb-2"
            style={{
              textAlign: "right",
              color: "#fff",
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            שם מלא
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
              textAlign: "right",
              writingDirection: "rtl",
            }}
            placeholder="שם מלא"
            placeholderTextColor={SLATE_400}
            value={fullName}
            onChangeText={setFullName}
            editable={!loading}
          />

          {/* Phone */}
          <Text
            className="text-right text-white font-bold mb-2"
            style={{
              textAlign: "right",
              color: "#fff",
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            מספר טלפון
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
              textAlign: "left",
              writingDirection: "ltr",
            }}
            placeholder="מספר טלפון"
            placeholderTextColor={SLATE_400}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
            editable={!loading}
          />

          {/* Gender */}
          <View style={styles.genderRow}>
            {(["זכר", "נקבה"] as const).map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGender(g)}
                disabled={loading}
                style={[
                  styles.genderBtn,
                  gender === g
                    ? styles.genderBtnActive
                    : styles.genderBtnInactive,
                ]}
              >
                <Text
                  style={[
                    styles.genderBtnText,
                    gender === g
                      ? styles.genderBtnTextActive
                      : styles.genderBtnTextInactive,
                  ]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Email */}
          <Text
            className="text-right text-white font-bold mb-2"
            style={{
              textAlign: "right",
              color: "#fff",
              fontWeight: "700",
              marginBottom: 8,
            }}
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
              textAlign: "left",
              writingDirection: "ltr",
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
            style={{
              textAlign: "right",
              color: "#fff",
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            סיסמה
          </Text>
          <View
            className="rounded-xl flex-row items-center"
            style={{
              backgroundColor: SLATE_800,
              borderRadius: 12,
              paddingLeft: 16,
              paddingRight: 12,
              paddingVertical: 4,
              marginBottom: 12,
              flexDirection: "row-reverse",
              alignItems: "center",
            }}
          >
            <Pressable
              onPress={() => setPasswordVisible((v) => !v)}
              hitSlop={12}
              style={{ padding: 8, marginLeft: 4 }}
              disabled={loading}
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
                textAlign: "left",
                writingDirection: "ltr",
              }}
              placeholder="סיסמה"
              placeholderTextColor={SLATE_400}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              editable={!loading}
              textContentType="oneTimeCode"
              autoComplete="off"
              autoCorrect={false}
            />
          </View>

          {/* Confirm Password */}
          <Text
            className="text-right text-white font-bold mb-2"
            style={{
              textAlign: "right",
              color: "#fff",
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            אימות סיסמה
          </Text>
          <View
            className="rounded-xl flex-row items-center"
            style={{
              backgroundColor: SLATE_800,
              borderRadius: 12,
              paddingLeft: 16,
              paddingRight: 12,
              paddingVertical: 4,
              marginBottom: 12,
              flexDirection: "row-reverse",
              alignItems: "center",
            }}
          >
            <Pressable
              onPress={() => setConfirmPasswordVisible((v) => !v)}
              hitSlop={12}
              style={{ padding: 8, marginLeft: 4 }}
              disabled={loading}
            >
              <Ionicons
                name={
                  confirmPasswordVisible
                    ? "eye-off-outline"
                    : "eye-outline"
                }
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
                textAlign: "left",
                writingDirection: "ltr",
              }}
              placeholder="אימות סיסמה"
              placeholderTextColor={SLATE_400}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!confirmPasswordVisible}
              editable={!loading}
              textContentType="oneTimeCode"
              autoComplete="off"
              autoCorrect={false}
            />
          </View>

          {/* Primary action */}
          <Pressable
            onPress={onRegister}
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
                הרשמה
              </Text>
            )}
          </Pressable>

          {/* Login link */}
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
              {STRINGS.hasAccount}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity disabled={loading}>
                <Text
                  style={{
                    color: "#3b82f6",
                    fontWeight: "600",
                    fontSize: 16,
                  }}
                >
                  התחבר
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: "#ef4444",
    marginBottom: 12,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "600",
  },
  genderRow: {
    flexDirection: "row-reverse",
    gap: 12,
    marginBottom: 16,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  genderBtnActive: {
    backgroundColor: BLUE_600,
  },
  genderBtnInactive: {
    backgroundColor: SLATE_800,
  },
  genderBtnText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "right",
  },
  genderBtnTextActive: {
    color: "#fff",
  },
  genderBtnTextInactive: {
    color: SLATE_400,
  },
});

const __DEPRECATED_REGISTER_SCREEN__ = String.raw`
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { STRINGS } from "@/constants/strings";
import { supabase } from "@/lib/supabase";

const SLATE_800 = "#1e293b";
const SLATE_900 = "#0f172a";
const BLUE_600 = "#2563eb";
const SLATE_400 = "#94a3b8";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"זכר" | "נקבה">("זכר");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onRegister = async () => {
    if (!fullName.trim()) {
      Alert.alert("שגיאה", "נא למלא את שמך המלא");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("שגיאה", "נא למלא מספר טלפון");
      return;
    }
    if (!email.trim() || !password) {
      setError("נא למלא אימייל וסיסמה");
      return;
    }
    if (password !== confirm) {
      setError("הסיסמאות אינן תואמות");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            gender,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        router.replace("/(tabs)");
      } else {
        Alert.alert(
          "נשלח אימייל",
          "נא לאמת את החשבון דרך הקישור שנשלח לאימייל."
        );
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "שגיאה בהרשמה";
      setError(message);
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
            צור חשבון חדש
          </Text>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {/* Full name */}
          <Text
            className="text-right text-white font-bold mb-2"
            style={{
              textAlign: "right",
              color: "#fff",
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            שם מלא
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
              textAlign: "right",
              writingDirection: "rtl",
            }}
            placeholder="שם מלא"
            placeholderTextColor={SLATE_400}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            editable={!loading}
          />

          {/* Phone */}
          <Text
            className="text-right text-white font-bold mb-2"
            style={{
              textAlign: "right",
              color: "#fff",
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            מספר טלפון
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
              textAlign: "left",
              writingDirection: "ltr",
            }}
            placeholder="מספר טלפון"
            placeholderTextColor={SLATE_400}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
            editable={!loading}
          />

          {/* Gender */}
          <View style={styles.genderRow}>
            {(["זכר", "נקבה"] as const).map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGender(g)}
                disabled={loading}
                style={[
                  styles.genderBtn,
                  gender === g ? styles.genderBtnActive : styles.genderBtnInactive,
                ]}
              >
                <Text
                  style={[
                    styles.genderBtnText,
                    gender === g ? styles.genderBtnTextActive : styles.genderBtnTextInactive,
                  ]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Email */}
          <Text
            className="text-right text-white font-bold mb-2"
            style={{
              textAlign: "right",
              color: "#fff",
              fontWeight: "700",
              marginBottom: 8,
            }}
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
              textAlign: "left",
              writingDirection: "ltr",
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
            style={{
              textAlign: "right",
              color: "#fff",
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            סיסמה
          </Text>
          <View
            className="rounded-xl flex-row items-center"
            style={{
              backgroundColor: SLATE_800,
              borderRadius: 12,
              paddingLeft: 16,
              paddingRight: 12,
              paddingVertical: 4,
              marginBottom: 12,
              flexDirection: "row-reverse",
              alignItems: "center",
            }}
          >
            <Pressable
              onPress={() => setPasswordVisible((v) => !v)}
              hitSlop={12}
              style={{ padding: 8, marginLeft: 4 }}
              disabled={loading}
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
                textAlign: "left",
                writingDirection: "ltr",
              }}
              placeholder="סיסמה"
              placeholderTextColor={SLATE_400}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              editable={!loading}
              textContentType="oneTimeCode"
              autoComplete="off"
              autoCorrect={false}
            />
          </View>

          {/* Confirm Password */}
          <Text
            className="text-right text-white font-bold mb-2"
            style={{
              textAlign: "right",
              color: "#fff",
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            אימות סיסמה
          </Text>
          <View
            className="rounded-xl flex-row items-center"
            style={{
              backgroundColor: SLATE_800,
              borderRadius: 12,
              paddingLeft: 16,
              paddingRight: 12,
              paddingVertical: 4,
              marginBottom: 12,
              flexDirection: "row-reverse",
              alignItems: "center",
            }}
          >
            <Pressable
              onPress={() => setConfirmPasswordVisible((v) => !v)}
              hitSlop={12}
              style={{ padding: 8, marginLeft: 4 }}
              disabled={loading}
            >
              <Ionicons
                name={
                  confirmPasswordVisible ? "eye-off-outline" : "eye-outline"
                }
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
                textAlign: "left",
                writingDirection: "ltr",
              }}
              placeholder="אימות סיסמה"
              placeholderTextColor={SLATE_400}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!confirmPasswordVisible}
              editable={!loading}
              textContentType="oneTimeCode"
              autoComplete="off"
              autoCorrect={false}
            />
          </View>

          {/* Primary action */}
          <Pressable
            onPress={onRegister}
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
                הרשמה
              </Text>
            )}
          </Pressable>

          {/* Login link */}
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
              {STRINGS.hasAccount}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity disabled={loading}>
                <Text style={{ color: "#3b82f6", fontWeight: "600", fontSize: 16 }}>
                  התחבר
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: "#ef4444",
    marginBottom: 12,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "600",
  },
  genderRow: {
    flexDirection: "row-reverse",
    gap: 12,
    marginBottom: 16,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SLATE_800,
  },
  genderBtnActive: {
    backgroundColor: BLUE_600,
  },
  genderBtnInactive: {
    backgroundColor: SLATE_800,
  },
  genderBtnText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "right",
  },
  genderBtnTextActive: {
    color: "#fff",
  },
  genderBtnTextInactive: {
    color: SLATE_400,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { STRINGS } from "@/constants/strings";
import { Colors, RTL } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

const SLATE_800 = "#1e293b";
const SLATE_400 = "#94a3b8";
const BLUE_600 = "#2563eb";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"זכר" | "נקבה">("זכר");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onRegister = async () => {
    if (!fullName.trim()) {
      Alert.alert("שגיאה", "נא למלא את שמך המלא");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("שגיאה", "נא למלא מספר טלפון");
      return;
    }
    if (!email.trim() || !password) {
      setError("נא למלא אימייל וסיסמה");
      return;
    }
    if (password !== confirm) {
      setError("הסיסמאות אינן תואמות");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            gender,
          },
        },
      });
      if (signUpError) throw signUpError;
      if (data.session) {
        router.replace("/(tabs)");
      } else {
        Alert.alert(
          "נשלח אימייל",
          "נא לאמת את החשבון דרך הקישור שנשלח לאימייל."
        );
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "שגיאה בהרשמה";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>📍</Text>
          <Text style={[styles.appName, RTL.text]}>{STRINGS.appName}</Text>
        </View>
        <Text style={[styles.title, RTL.text]}>{STRINGS.register}</Text>
        {error ? <Text style={[styles.error, RTL.text]}>{error}</Text> : null}
        <TextInput
          style={[styles.input, RTL.input]}
          placeholder="שם מלא"
          placeholderTextColor={Colors.dark.muted}
          value={fullName}
          onChangeText={setFullName}
          editable={!loading}
        />
        <TextInput
          style={[styles.input, RTL.input]}
          placeholder="מספר טלפון"
          placeholderTextColor={Colors.dark.muted}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!loading}
        />
        <View style={styles.genderRow}>
          {(["זכר", "נקבה"] as const).map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setGender(g)}
              disabled={loading}
              style={[
                styles.genderBtn,
                gender === g ? styles.genderBtnActive : styles.genderBtnInactive,
              ]}
            >
              <Text
                style={[
                  styles.genderBtnText,
                  gender === g ? styles.genderBtnTextActive : styles.genderBtnTextInactive,
                  RTL.text,
                ]}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={[styles.input, RTL.input]}
          placeholder={STRINGS.email}
          placeholderTextColor={Colors.dark.muted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        {/* Password */}
        <View style={styles.passwordContainer}>
          <Pressable
            onPress={() => setPasswordVisible((v) => !v)}
            hitSlop={12}
            style={styles.passwordIconButton}
            disabled={loading}
          >
            <Ionicons
              name={passwordVisible ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={SLATE_400}
            />
          </Pressable>
          <TextInput
            style={[styles.passwordTextInput, RTL.input]}
            placeholder={STRINGS.password}
            placeholderTextColor={Colors.dark.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible}
            textContentType="oneTimeCode"
            autoComplete="off"
            autoCorrect={false}
            editable={!loading}
          />
        </View>

        {/* Confirm Password */}
        <View style={styles.passwordContainer}>
          <Pressable
            onPress={() => setConfirmPasswordVisible((v) => !v)}
            hitSlop={12}
            style={styles.passwordIconButton}
            disabled={loading}
          >
            <Ionicons
              name={confirmPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={SLATE_400}
            />
          </Pressable>
          <TextInput
            style={[styles.passwordTextInput, RTL.input]}
            placeholder={STRINGS.confirmPassword}
            placeholderTextColor={Colors.dark.muted}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!confirmPasswordVisible}
            textContentType="oneTimeCode"
            autoComplete="off"
            autoCorrect={false}
            editable={!loading}
          />
        </View>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={onRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{STRINGS.register}</Text>
          )}
        </Pressable>
        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.link}>
            <Text style={[styles.linkText, RTL.text]}>{STRINGS.hasAccount}</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingTop: 80,
  },
  logoBox: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 24,
    textAlign: "right",
  },
  error: {
    color: "#ef4444",
    marginBottom: 12,
    textAlign: "right",
  },
  genderRow: {
    flexDirection: "row-reverse",
    gap: 12,
    marginBottom: 16,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  genderBtnActive: {
    backgroundColor: BLUE_600,
  },
  genderBtnInactive: {
    backgroundColor: SLATE_800,
  },
  genderBtnText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "right",
  },
  genderBtnTextActive: {
    color: "#fff",
  },
  genderBtnTextInactive: {
    color: SLATE_400,
  },
  input: {
    backgroundColor: SLATE_800,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 16,
    textAlign: "right",
  },
  passwordContainer: {
    backgroundColor: SLATE_800,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 16,
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  passwordIconButton: {
    padding: 8,
    marginLeft: 6,
  },
  passwordTextInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark.text,
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlign: "right",
  },
  btn: {
    backgroundColor: BLUE_600,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  btnPressed: { opacity: 0.9 },
  btnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  link: {
    marginTop: 24,
    alignItems: "center",
  },
  linkText: {
    color: Colors.dark.primary,
    fontSize: 16,
    textAlign: "right",
  },
});
`;
void __DEPRECATED_REGISTER_SCREEN__;
