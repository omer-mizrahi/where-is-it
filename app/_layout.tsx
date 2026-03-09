import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
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
    background: "#0f172a",
    card: "#1e293b",
    border: "transparent",
    text: "#ffffff",
  },
};

const RTL_LIGHT_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#3B82F6",
    background: "#f8fafc",
    card: "#ffffff",
    border: "#e2e8f0",
    text: "#0f172a",
  },
};

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? RTL_DARK_THEME : RTL_LIGHT_THEME}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="recent-activity"
          options={{
            headerShown: true,
            title: "כל הפעילויות",
            headerBackTitle: "חזור",
            headerTintColor: "#2563eb",
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </ThemeProvider>
  );
}
