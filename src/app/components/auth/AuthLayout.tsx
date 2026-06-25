import React, { useEffect, useRef } from "react";
import { Animated, Keyboard, Text, View } from "react-native";

export default function AuthLayout({
  children,
  error,
}: {
  children: React.ReactNode;
  error?: string | null;
}) {
  const logoHeight = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      Animated.timing(logoHeight, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      Animated.timing(logoHeight, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const logoFlex = logoHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1], // collapse logo section
  });

  const cardFlex = logoHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 2.8], // expand card when keyboard opens
  });

  return (
    <View className="flex-1 bg-white">
      {/* Logo */}
      <Animated.View
        style={{
          flex: logoFlex,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text className="text-3xl font-bold">Logo</Text>
      </Animated.View>

      {/* Bottom card */}
      <Animated.View
        style={{
          flex: cardFlex,
        }}
        className="rounded-t-3xl bg-black px-6 pt-8"
      >
        {error ? (
          <View className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <Text className="text-sm text-red-400">{error}</Text>
          </View>
        ) : null}

        {children}
      </Animated.View>
    </View>
  );
}
