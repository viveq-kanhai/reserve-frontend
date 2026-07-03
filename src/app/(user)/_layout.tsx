import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  const isActive = (routeName: string) =>
    state.routes[state.index].name === routeName;

  return (
    <View
      style={{
        position: "absolute",
        bottom: insets.bottom + 12,
        left: 70,
        right: 70,
        height: 60,
      }}
    >
      {/* MAIN BAR */}
      <View className="flex-1 flex-row items-center justify-between rounded-full bg-zinc-900 px-8">
        {/* RECIPIENTS */}
        <Pressable onPress={() => navigation.navigate("recipients")}>
          <View
            className={`h-10 flex-row items-center justify-center rounded-full ${
              isActive("recipients")
                ? "bg-white px-4 rounded-full"
                : "w-10 bg-transparent"
            }`}
          >
            <Ionicons
              name="people"
              size={20}
              color={isActive("recipients") ? "black" : "white"}
            />
          </View>
        </Pressable>

        {/* DASHBOARD */}
        <Pressable onPress={() => navigation.navigate("dashboard")}>
          <View
            className={`h-10 flex-row items-center justify-center rounded-full ${
              isActive("dashboard")
                ? "bg-white px-4 rounded-full"
                : "w-10 bg-transparent"
            }`}
          >
            <Ionicons
              name="home"
              size={20}
              color={isActive("dashboard") ? "black" : "white"}
            />
          </View>
        </Pressable>

        {/* QUESTS */}
        <Pressable onPress={() => navigation.navigate("quests")}>
          <View
            className={`h-10 flex-row items-center justify-center rounded-full ${
              isActive("quests")
                ? "bg-white px-4 rounded-full"
                : "w-10 bg-transparent"
            }`}
          >
            <Ionicons
              name="trophy"
              size={20}
              color={isActive("quests") ? "black" : "white"}
            />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

export default function UserLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="recipients" />
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="quests" />
    </Tabs>
  );
}
