import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { I18nManager } from "react-native";
import "react-native-reanimated";

import "../global.css";

// Force global RTL (must run at module load, before any layout)
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const RTL_DARK_THEME = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#3B82F6",
    background: "#141824",
    card: "#1E2436",
    border: "transparent",
    text: "#ffffff",
  },
};

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  return (
    <ThemeProvider value={RTL_DARK_THEME}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
