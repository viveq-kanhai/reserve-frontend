import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const { register } = useAuth();

  const [first_name, setFirst] = useState("");
  const [last_name, setLast] = useState("");
  const [phone_number, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (loading) return;
    setLoading(true);

    try {
      await register(
        first_name,
        last_name,
        phone_number,
        password,
        confirmPassword,
      );

      // NO router needed (your auth system handles it)
    } catch (err: any) {
      Alert.alert(
        "Register failed",
        err?.response?.data?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Register</Text>

      <TextInput
        placeholder="First name"
        value={first_name}
        onChangeText={setFirst}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />

      <TextInput
        placeholder="Last name"
        value={last_name}
        onChangeText={setLast}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />

      <TextInput
        placeholder="Phone number"
        value={phone_number}
        onChangeText={setPhone}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        placeholder="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <Pressable
        onPress={handleRegister}
        style={{ backgroundColor: "black", padding: 15 }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          Create account
        </Text>
      </Pressable>

      <Pressable onPress={() => router.back()}>
        <Text style={{ marginTop: 15, textAlign: "center" }}>
          Already have an account?
        </Text>
      </Pressable>
    </View>
  );
}
