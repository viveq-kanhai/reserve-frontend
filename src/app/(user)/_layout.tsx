import { Tabs } from "expo-router";
import { Home, Trophy, Users } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BG = "#0B0D10";
const SURFACE = "#15181C";
const BORDER = "#22262B";
const ACCENT = "#B4DE00";
const TEXT_MUTED = "#8B9098";

const COLLAPSED_WIDTH = 46;
const EXPANDED_WIDTH = 118;

const TABS = [
  { name: "recipients", label: "People", icon: Users },
  { name: "dashboard", label: "Home", icon: Home },
  { name: "quests", label: "Quests", icon: Trophy },
];

function TabPill({
  active,
  label,
  icon: Icon,
  onPress,
}: {
  active: boolean;
  label: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  onPress: () => void;
}) {
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: active ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // width/color are not supported by the native driver
    }).start();
  }, [active]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [COLLAPSED_WIDTH, EXPANDED_WIDTH],
  });

  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(0,0,0,0)", ACCENT],
  });

  const iconColor = active ? BG : TEXT_MUTED;

  return (
    <Pressable onPress={onPress} className="mx-1" hitSlop={6}>
      <Animated.View
        style={{
          height: 46,
          width,
          borderRadius: 999,
          overflow: "hidden",
          backgroundColor,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={19} color={iconColor} strokeWidth={2.2} />
        {active && (
          <Text
            numberOfLines={1}
            className="ml-2 text-[13px] font-semibold"
            style={{ color: BG }}
          >
            {label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

function TabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  const isActive = (routeName: string) =>
    state.routes[state.index].name === routeName;

  return (
    <View
      style={{
        position: "absolute",
        bottom: insets.bottom + 16,
        left: 24,
        right: 24,
        alignItems: "center",
      }}
    >
      {/* MAIN BAR */}
      <View
        className="flex-row items-center rounded-full border px-2"
        style={{
          backgroundColor: SURFACE,
          borderColor: BORDER,
          height: 64,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 10,
        }}
      >
        {TABS.map(({ name, label, icon }) => (
          <TabPill
            key={name}
            active={isActive(name)}
            label={label}
            icon={icon}
            onPress={() => navigation.navigate(name)}
          />
        ))}
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
