import { Pressable, Text, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { logout } = useAuth();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
      }}
    >
      <Text>Admin Dashboard</Text>

      <Pressable
        onPress={logout}
        style={{
          backgroundColor: "#dc2626",
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>Logout</Text>
      </Pressable>
    </View>
  );
}
