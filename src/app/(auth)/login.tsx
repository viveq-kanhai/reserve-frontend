import { useState } from "react";
import { View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import AuthButton from "../components/auth/AuthButton";
import AuthInput from "../components/auth/AuthInput";
import AuthLayout from "../components/auth/AuthLayout";
import AuthTabs from "../components/auth/AuthTabs";

export default function Login() {
  const [phone_number, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  async function handleLogin() {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      await login(phone_number, password);
    } catch (e: any) {
      const message =
        e?.response?.data?.message || "Something went wrong. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout error={error}>
      <AuthTabs />
      <View>
        <AuthInput
          placeholder="Phone number"
          value={phone_number}
          onChangeText={setPhone}
        />

        <AuthInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>
      <View>
        <AuthButton title="Login" onPress={handleLogin} />
      </View>
    </AuthLayout>
  );
}
