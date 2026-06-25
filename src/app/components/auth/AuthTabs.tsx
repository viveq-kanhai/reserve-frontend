// src/components/auth/AuthTabs.tsx
import { router, usePathname } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function AuthTabs() {
  const pathname = usePathname();

  const isLogin = pathname.includes("login");

  return (
    <View className="mb-8 flex-row rounded-full bg-zinc-800 p-1">
      <Pressable
        onPress={() => router.replace("/(auth)/login")}
        className={`flex-1 rounded-full py-3 ${isLogin ? "bg-white" : ""}`}
      >
        <Text
          className={`text-center font-semibold ${
            isLogin ? "text-black" : "text-white"
          }`}
        >
          Login
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.replace("/(auth)/register")}
        className={`flex-1 rounded-full py-3 ${!isLogin ? "bg-white" : ""}`}
      >
        <Text
          className={`text-center font-semibold ${
            !isLogin ? "text-black" : "text-white"
          }`}
        >
          Sign Up
        </Text>
      </Pressable>
    </View>
  );
}
