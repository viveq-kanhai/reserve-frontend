import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { api, saveToken } from "../../services/api";

export default function Register() {
  const [first_name, setFirst] = useState("");
  const [last_name, setLast] = useState("");
  const [phone_number, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password_confirmation, setConfirm] = useState("");

  async function handleRegister() {
    try {
      const res = await api.post("/register", {
        first_name,
        last_name,
        phone_number,
        password,
        password_confirmation,
      });

      await saveToken(res.data.token);

      router.replace("/(user)/dashboard");
    } catch (err: any) {
      Alert.alert(
        "Registration failed",
        err?.response?.data?.message || "Something went wrong",
      );
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Register</Text>

      <TextInput
        placeholder="First name"
        onChangeText={setFirst}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />
      <TextInput
        placeholder="Last name"
        onChangeText={setLast}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />
      <TextInput
        placeholder="Phone number"
        onChangeText={setPhone}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />
      <TextInput
        placeholder="Confirm password"
        secureTextEntry
        onChangeText={setConfirm}
        style={{ borderWidth: 1, marginBottom: 20, padding: 10 }}
      />

      <Pressable
        onPress={handleRegister}
        style={{ backgroundColor: "black", padding: 15 }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          Create account
        </Text>
      </Pressable>
    </View>
  );
}
