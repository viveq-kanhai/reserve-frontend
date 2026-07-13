import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { api, API_URL } from "../../services/api";

export default function Profile() {
  const router = useRouter();
  const { logout } = useAuth();

  const [user, setUser] = useState<any>(null);

  const [passwordVisible, setPasswordVisible] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [savingPassword, setSavingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function loadProfile() {
    try {
      const res = await api.get("/profile");
      setUser(res.data);
    } catch {
      Alert.alert("Error", "Couldn't load profile.");
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled) return;

    try {
      setUploading(true);

      const form = new FormData();

      form.append("profile_picture", {
        uri: result.assets[0].uri,
        name: "profile.jpg",
        type: "image/jpeg",
      } as any);

      await api.post("/profile/photo", form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      loadProfile();

      Alert.alert("Success", "Profile picture updated.");
    } catch {
      Alert.alert("Error", "Couldn't upload photo.");
    } finally {
      setUploading(false);
    }
  }

  async function changePassword() {
    try {
      setSavingPassword(true);

      await api.put("/profile/password", {
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      });

      Alert.alert("Success", "Password updated.");

      setCurrentPassword("");
      setPassword("");
      setPasswordConfirmation("");

      setPasswordVisible(false);
    } catch (e: any) {
      Alert.alert(
        "Error",
        e.response?.data?.message ?? "Couldn't update password.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  if (!user) return null;

  function openWhatsAppSupport() {
    const phoneNumber = "5978971996";

    const message = encodeURIComponent(
      "Hello Reserve Support,\n\nI need help with my account.",
    );

    const url = `whatsapp://send?phone=${phoneNumber}&text=${message}`;

    Linking.openURL(url).catch(() => {
      Alert.alert(
        "WhatsApp not installed",
        "Please install WhatsApp to contact support.",
      );
    });
  }

  return (
    <>
      <ScrollView className="flex-1 bg-bg-dark">
        {/* HEADER */}

        <View className="px-6 pt-16">
          <Text className="text-4xl font-bold text-text">Profile</Text>
        </View>

        {/* PROFILE */}

        <View className="items-center mt-10">
          <Pressable onPress={pickImage}>
            <Image
              source={{
                uri: user.pfp_path
                  ? `${API_URL}/storage/${user.pfp_path}`
                  : "https://i.pravatar.cc/300",
              }}
              className="h-32 w-32 rounded-full border-4 border-border"
            />

            <View className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-bg-light items-center justify-center border border-border">
              <Ionicons name="camera" size={18} color="black" />
            </View>
          </Pressable>

          {uploading && (
            <Text className="mt-3 text-text-muted">Uploading...</Text>
          )}

          <Text className="mt-6 text-3xl font-bold text-text">
            {user.first_name} {user.last_name}
          </Text>

          <Text className="mt-2 text-text-muted">{user.phone_number}</Text>
        </View>

        {/* CARD */}

        <View className="mx-6 mt-10 rounded-3xl bg-bg border border-border p-6">
          <Text className="mb-5 text-lg font-bold text-text">Account</Text>

          <Pressable
            onPress={() => setPasswordVisible(true)}
            className="flex-row items-center justify-between py-4"
          >
            <View className="flex-row items-center">
              <Ionicons name="lock-closed" size={22} color="black" />

              <Text className="ml-4 text-text">Change Password</Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="gray" />
          </Pressable>

          <View className="h-px bg-border my-2" />

          <Pressable
            className="flex-row items-center justify-between py-4"
            onPress={openWhatsAppSupport}
          >
            <View className="flex-row items-center">
              <Ionicons name="help-circle" size={22} color="black" />

              <Text className="ml-4 text-text">Support</Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="gray" />
          </Pressable>

          <View className="h-px bg-border my-2" />

          <Pressable
            className="flex-row items-center justify-between py-4"
            onPress={logout}
          >
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={22} color="#ef4444" />

              <Text className="ml-4 text-red-500">Logout</Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="gray" />
          </Pressable>
        </View>
      </ScrollView>

      {/* PASSWORD MODAL */}

      <Modal visible={passwordVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          className="flex-1 justify-end bg-black/40"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View className="rounded-t-3xl bg-bg p-6 pb-10">
            <Text className="mb-6 text-2xl font-bold text-text">
              Change Password
            </Text>

            <TextInput
              placeholder="Current Password"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholderTextColor="#888"
              className="mb-4 rounded-xl border border-border bg-bg-light px-4 py-4 text-text"
            />

            <TextInput
              placeholder="New Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#888"
              className="mb-4 rounded-xl border border-border bg-bg-light px-4 py-4 text-text"
            />

            <TextInput
              placeholder="Confirm Password"
              secureTextEntry
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              placeholderTextColor="#888"
              className="mb-6 rounded-xl border border-border bg-bg-light px-4 py-4 text-text"
            />

            <Pressable
              onPress={changePassword}
              className="rounded-2xl bg-white py-4"
            >
              <Text className="text-center font-semibold">
                {savingPassword ? "Saving..." : "Save Password"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setPasswordVisible(false)}
              className="mt-4 py-4"
            >
              <Text className="text-center text-text-muted">Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
