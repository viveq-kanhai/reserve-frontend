import { Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

export default function GrowthChart({
  title,
  data,
  color,
}: {
  title: string;
  data: { date: string; count: number }[];
  color: string;
}) {
  const chartData = data.map((item) => ({
    value: item.count,
  }));

  const lastValue = chartData[chartData.length - 1]?.value ?? 0;

  return (
    <View className="bg-white rounded-3xl p-5 mb-5 shadow-sm border border-gray-100">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-gray-900 font-semibold text-base">{title}</Text>

        <View className="bg-gray-100 px-3 py-1 rounded-full">
          <Text className="text-xs text-gray-600">Last: {lastValue}</Text>
        </View>
      </View>

      {/* Chart wrapper */}
      <View className="bg-gray-50 rounded-2xl p-3">
        <LineChart
          data={chartData}
          height={150}
          thickness={2.5}
          color={color}
          curved
          hideDataPoints
          areaChart
          startFillColor={color}
          endFillColor="rgba(0,0,0,0)"
          startOpacity={0.25}
          endOpacity={0}
          initialSpacing={0}
          spacing={30}
          hideAxesAndRules
          hideYAxisText
        />
      </View>
    </View>
  );
}
