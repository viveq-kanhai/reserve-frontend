import { Text, View } from "react-native";

export default function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100">
      <Text className="text-gray-500 text-xs">{label}</Text>
      <Text className="text-xl font-bold text-gray-900 mt-1">{value}</Text>
    </View>
  );
}
