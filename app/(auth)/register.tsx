import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { STRINGS } from "@/constants/strings";
import { Colors, RTL } from "@/constants/theme";

function handleRegister(_email: string, _password: string) {
  return Promise.resolve(true);
}

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onRegister = async () => {
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
      await handleRegister(email, password);
      router.replace("/(tabs)");
    } catch {
      setError("שגיאה בהרשמה");
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
  input: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 16,
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
