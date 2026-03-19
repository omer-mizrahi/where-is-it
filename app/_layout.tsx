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

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="register"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="recent-activity"
          options={{ title: "כל הפעילויות", headerBackTitle: "חזור" }}
        />
        <Stack.Screen name="parking/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="item/[id]" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
