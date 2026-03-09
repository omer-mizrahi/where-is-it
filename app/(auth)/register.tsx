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
        <TextInput
          style={[styles.input, RTL.input]}
          placeholder={STRINGS.password}
          placeholderTextColor={Colors.dark.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        <TextInput
          style={[styles.input, RTL.input]}
          placeholder={STRINGS.confirmPassword}
          placeholderTextColor={Colors.dark.muted}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          editable={!loading}
        />
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={onRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.btnText, RTL.text]}>{STRINGS.register}</Text>
          )}
        </Pressable>
        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.link}>
            <Text style={[styles.linkText, RTL.text]}>{STRINGS.noAccount}</Text>
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
  btn: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  btnPressed: { opacity: 0.9 },
  btnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "right",
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
