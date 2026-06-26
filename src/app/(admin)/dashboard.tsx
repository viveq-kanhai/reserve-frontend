import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAdminDashboard } from "../../hooks/useAdminDashboard";
import GrowthChart from "../components/admin/GrowthChart";
import StatCard from "../components/admin/StatCard";

export default function AdminDashboard() {
  const { data } = useAdminDashboard();

  if (!data) return null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 bg-gray-50 p-4">
        {/* Growth Chart */}
        <GrowthChart
          title="User Growth (7 days)"
          data={data.growth.users}
          color="#3b82f6"
        />

        <GrowthChart
          title="Business Growth (7 days)"
          data={data.growth.businesses}
          color="#10b981"
        />

        {/* Stats cards */}
        <View className="flex-row gap-3 mb-6">
          <StatCard label="Total Users" value={data.stats.users} />
          <StatCard label="Total Businesses" value={data.stats.businesses} />
        </View>

        {/* Pending section */}
        <Text className="text-lg font-semibold mb-3">Pending</Text>

        <View className="flex-row gap-3 mb-3">
          <StatCard label="Businesses" value={data.pending.businesses} />
          <StatCard label="Withdrawals" value={data.pending.withdrawals} />
        </View>

        <View className="flex-row gap-3 mb-10">
          <StatCard label="KYC" value={data.pending.kyc} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
