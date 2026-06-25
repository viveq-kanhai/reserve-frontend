import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

export default function AuthInput({ secureTextEntry, style, ...props }: any) {
  const [hidden, setHidden] = useState(secureTextEntry);

  return (
    <View className="mb-3 flex-row items-center border-b border-gray-600 px-2 py-2">
      <TextInput
        {...props}
        secureTextEntry={hidden}
        placeholderTextColor="#9ca3af"
        className="flex-1 py-1 text-white"
        style={{ fontSize: 16 }}
      />

      {secureTextEntry ? (
        <Pressable onPress={() => setHidden(!hidden)} className="px-2">
          <Ionicons
            name={hidden ? "eye-off-outline" : "eye-outline"}
            size={18}
            color="#9ca3af"
          />
        </Pressable>
      ) : null}
    </View>
  );
}
