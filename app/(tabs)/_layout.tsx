import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { useColorScheme } from "nativewind";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { STRINGS } from "@/constants/strings";
import { Colors } from "@/constants/theme";

const FAB_SIZE = 64;
const FAB_PROTRUDE = 22;
const PRIMARY_BLUE = "#2563eb";
const SLATE_500 = "#64748b";

function CenterAddTabButton(props: BottomTabBarButtonProps) {
  return (
    <Pressable
      onPressIn={(e) => {
        if (Platform.OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(e);
      }}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.fabWrap,
        pressed && styles.fabPressed,
      ]}
    >
      <View style={styles.fab}>
        <Ionicons name="add" size={36} color="#fff" />
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const headerBg = isDark ? "#0f172a" : "#ffffff";
  const tabBarBg = isDark ? "#1e293b" : "#ffffff";
  const headerTint = isDark ? "#ffffff" : "#0f172a";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PRIMARY_BLUE,
        tabBarInactiveTintColor: SLATE_500,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 56 + FAB_PROTRUDE,
        },
        tabBarLabelStyle: { fontSize: 11 },
        headerStyle: { backgroundColor: headerBg },
        headerTintColor: headerTint,
        headerShadowVisible: false,
        tabBarButton: HapticTab,
      }}
    >
      {/* Order: in RTL, first = right. So index (בית) is far right, profile is far left. */}
      <Tabs.Screen
        name="index"
        options={{
          title: "בית",
          tabBarLabel: "בית",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="parking"
        options={{
          title: STRINGS.parking,
          tabBarLabel: STRINGS.parking,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "car" : "car-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-item"
        options={{
          title: STRINGS.addItem,
          tabBarLabel: "",
          tabBarIcon: () => null,
          tabBarButton: CenterAddTabButton,
        }}
      />
      <Tabs.Screen
        name="items"
        options={{
          title: STRINGS.itemsTab,
          tabBarLabel: STRINGS.itemsTab,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "cube" : "cube-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: STRINGS.profile,
          tabBarLabel: STRINGS.profile,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 0,
    marginTop: -FAB_PROTRUDE,
  },
  fabPressed: { opacity: 0.9 },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 12,
  },
});
