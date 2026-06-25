// src/components/auth/AuthButton.tsx
import { Pressable, Text } from "react-native";

export default function AuthButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="rounded-xl bg-white py-4"
    >
      <Text className="text-center font-semibold text-black">{title}</Text>
    </Pressable>
  );
}
