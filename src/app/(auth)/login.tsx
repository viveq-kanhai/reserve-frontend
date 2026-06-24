import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { api, saveToken } from "../../services/api";

export default function Login() {
  const [phone_number, setPhone] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    try {
      const res = await api.post("/login", {
        phone_number,
        password,
      });

      await saveToken(res.data.token);

      const user = res.data.user;

      // role-based routing (we'll refine later)
      if (user.role === "admin") {
        router.replace("/(admin)/dashboard");
      } else {
        router.replace("/(user)/dashboard");
      }
    } catch (err: any) {
      console.log("LOGIN ERROR:", err?.response?.data);
      console.log("FULL ERROR:", err);

      Alert.alert(
        "Login failed",
        JSON.stringify(err?.response?.data || err.message),
      );
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Login</Text>

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
        style={{
          borderWidth: 1,
          marginBottom: 20,
          padding: 10,
          color: "black",
        }}
      />

      <Pressable
        onPress={handleLogin}
        style={{ backgroundColor: "black", padding: 15 }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>Login</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/(auth)/register")}>
        <Text style={{ marginTop: 15, textAlign: "center" }}>
          Create account
        </Text>
      </Pressable>
    </View>
  );
}
