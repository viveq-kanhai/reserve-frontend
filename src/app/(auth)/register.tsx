import { useState } from "react";
import { View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import AuthButton from "../components/auth/AuthButton";
import AuthInput from "../components/auth/AuthInput";
import AuthLayout from "../components/auth/AuthLayout";
import AuthTabs from "../components/auth/AuthTabs";

export default function Register() {
  const { register } = useAuth();

  const [first_name, setFirst] = useState("");
  const [last_name, setLast] = useState("");
  const [phone_number, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      await register(
        first_name,
        last_name,
        phone_number,
        password,
        confirmPassword,
      );
    } catch (err: any) {
      const message = err?.response?.data?.message || "Something went wrong";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout error={error}>
      <AuthTabs />

      <View className="">
        <AuthInput
          placeholder="First name"
          value={first_name}
          onChangeText={setFirst}
        />

        <AuthInput
          placeholder="Last name"
          value={last_name}
          onChangeText={setLast}
        />

        <AuthInput
          placeholder="Phone number"
          keyboardType="phone-pad"
          value={phone_number}
          onChangeText={setPhone}
        />

        <AuthInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <AuthInput
          placeholder="Confirm password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>

      <AuthButton title="Create Account" onPress={handleRegister} />
    </AuthLayout>
  );
}
