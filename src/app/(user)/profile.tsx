import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  Camera,
  ChevronRight,
  CircleHelp,
  Lock,
  LogOut,
} from "lucide-react-native";
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

const BG = "#0B0D10";
const SHEET_BG = "#101317";
const SURFACE = "#15181C";
const BORDER = "#22262B";
const ACCENT = "#B4DE00";
const TEXT_PRIMARY = "#EDEEF0";
const TEXT_SECONDARY = "#8B9098";
const TEXT_MUTED = "#54585F";
const ERROR = "#E5484D";

// ---- Reusable modal input, kept local to this file ----
function ModalField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
}) {
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={TEXT_MUTED}
      secureTextEntry
      value={value}
      onChangeText={onChangeText}
      className="mb-4 rounded-2xl border px-4 py-4 text-[15px]"
      style={{
        backgroundColor: SURFACE,
        borderColor: BORDER,
        color: TEXT_PRIMARY,
      }}
    />
  );
}

// ---- Reusable account row, kept local to this file ----
function AccountRow({
  icon: Icon,
  label,
  onPress,
  tint,
}: {
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  label: string;
  onPress: () => void;
  tint?: string;
}) {
  const color = tint ?? TEXT_PRIMARY;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between py-4"
    >
      <View className="flex-row items-center">
        <View
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: SURFACE }}
        >
          <Icon size={17} color={color} strokeWidth={2} />
        </View>

        <Text className="ml-4 text-[15px]" style={{ color }}>
          {label}
        </Text>
      </View>

      <ChevronRight size={18} color={TEXT_MUTED} strokeWidth={2} />
    </Pressable>
  );
}

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
      <ScrollView className="flex-1" style={{ backgroundColor: BG }}>
        {/* HEADER */}
        <View className="px-6 pt-16">
          <Text className="text-4xl font-bold" style={{ color: TEXT_PRIMARY }}>
            Profile
          </Text>
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
              className="h-32 w-32 rounded-full border-4"
              style={{ borderColor: BORDER }}
            />

            <View
              className="absolute bottom-0 right-0 h-10 w-10 rounded-full items-center justify-center border-2"
              style={{ backgroundColor: ACCENT, borderColor: BG }}
            >
              <Camera size={17} color={BG} strokeWidth={2.2} />
            </View>
          </Pressable>

          {uploading && (
            <Text className="mt-3" style={{ color: TEXT_SECONDARY }}>
              Uploading...
            </Text>
          )}

          <Text
            className="mt-6 text-3xl font-bold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            {user.first_name} {user.last_name}
          </Text>

          <Text className="mt-2" style={{ color: TEXT_SECONDARY }}>
            {user.phone_number}
          </Text>
        </View>

        {/* CARD */}
        <View
          className="mx-6 mt-10 mb-10 rounded-3xl border p-6"
          style={{ backgroundColor: SHEET_BG, borderColor: BORDER }}
        >
          <Text
            className="mb-2 text-xs font-semibold uppercase tracking-widest"
            style={{ color: TEXT_SECONDARY }}
          >
            Account
          </Text>

          <AccountRow
            icon={Lock}
            label="Change Password"
            onPress={() => setPasswordVisible(true)}
          />

          <View className="h-px my-1" style={{ backgroundColor: BORDER }} />

          <AccountRow
            icon={CircleHelp}
            label="Support"
            onPress={openWhatsAppSupport}
          />

          <View className="h-px my-1" style={{ backgroundColor: BORDER }} />

          <AccountRow
            icon={LogOut}
            label="Logout"
            onPress={logout}
            tint={ERROR}
          />
        </View>
      </ScrollView>

      {/* PASSWORD MODAL */}
      <Modal visible={passwordVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            className="rounded-t-3xl border-t p-6 pb-10"
            style={{ backgroundColor: SHEET_BG, borderColor: BORDER }}
          >
            <Text
              className="mb-6 text-2xl font-bold"
              style={{ color: TEXT_PRIMARY }}
            >
              Change Password
            </Text>

            <ModalField
              placeholder="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <ModalField
              placeholder="New Password"
              value={password}
              onChangeText={setPassword}
            />

            <ModalField
              placeholder="Confirm Password"
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
            />

            <Pressable
              onPress={changePassword}
              className="rounded-2xl py-4"
              style={{
                backgroundColor: savingPassword ? `${ACCENT}80` : ACCENT,
              }}
            >
              <Text className="text-center font-semibold" style={{ color: BG }}>
                {savingPassword ? "Saving..." : "Save Password"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setPasswordVisible(false)}
              className="mt-4 py-4"
            >
              <Text className="text-center" style={{ color: TEXT_SECONDARY }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
