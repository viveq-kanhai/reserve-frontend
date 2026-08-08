import { Link } from "expo-router";
import { ArrowRight, Eye, EyeOff, Lock, Phone } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

const ACCENT = "#B4DE00";
const BG = "#0B0D10";
const SURFACE = "#15181C";
const BORDER = "#22262B";

// ---- Reusable field, kept local to this file (not a shared component) ----
function FormField({
  icon: Icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  toggleable,
}: {
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "phone-pad";
  toggleable?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);

  return (
    <View
      className="flex-row items-center rounded-2xl border px-4 mb-4"
      style={{
        backgroundColor: SURFACE,
        borderColor: focused ? ACCENT : BORDER,
        height: 54,
      }}
    >
      <Icon size={18} color={focused ? ACCENT : "#54585F"} strokeWidth={2} />
      <TextInput
        className="flex-1 text-[15px] ml-3"
        style={{ color: "#EDEEF0" }}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        secureTextEntry={hidden}
        keyboardType={keyboardType ?? "default"}
        placeholder={placeholder}
        placeholderTextColor="#54585F"
        autoCapitalize={keyboardType === "phone-pad" ? "none" : "words"}
      />
      {toggleable && (
        <TouchableOpacity onPress={() => setHidden((h) => !h)} hitSlop={8}>
          {hidden ? (
            <Eye size={18} color="#54585F" strokeWidth={2} />
          ) : (
            <EyeOff size={18} color={ACCENT} strokeWidth={2} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

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
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: BG }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mark + heading */}
        <View className="mt-24 mb-8">
          <View
            className="w-10 h-10 rounded-[10px] mb-6 items-center justify-center border"
            style={{ borderColor: BORDER, backgroundColor: SURFACE }}
          >
            <View
              className="w-3 h-3 rounded-[2px]"
              style={{ backgroundColor: ACCENT }}
            />
          </View>
          <Text
            className="text-[28px] font-bold tracking-tight"
            style={{ color: "#EDEEF0" }}
          >
            Welcome back
          </Text>
          <Text
            className="text-[14px] mt-2 leading-5"
            style={{ color: "#8B9098" }}
          >
            Log in to access your wallet.
          </Text>
        </View>

        {/* Error banner */}
        {error && (
          <View
            className="border rounded-2xl px-4 py-3 mb-5"
            style={{ borderColor: "#3A2224", backgroundColor: "#1A1113" }}
          >
            <Text className="text-[13px]" style={{ color: "#E5484D" }}>
              {error}
            </Text>
          </View>
        )}

        {/* Fields */}
        <FormField
          icon={Phone}
          placeholder="Phone number"
          value={phone_number}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <FormField
          icon={Lock}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          toggleable
        />

        {/* Forgot password */}
        <TouchableOpacity className="self-end mb-2" hitSlop={8}>
          <Text className="text-[13px] font-medium" style={{ color: ACCENT }}>
            Forgot password?
          </Text>
        </TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
          className="mt-4 rounded-2xl py-4 flex-row items-center justify-center gap-2"
          style={{ backgroundColor: loading ? "#B4DE00" : ACCENT }}
        >
          {loading ? (
            <ActivityIndicator color={BG} />
          ) : (
            <>
              <Text
                className="text-[15px] font-semibold tracking-wide"
                style={{ color: BG }}
              >
                Login
              </Text>
              <ArrowRight size={18} color={BG} strokeWidth={2.5} />
            </>
          )}
        </TouchableOpacity>

        {/* Footer link */}
        <View className="flex-row justify-center items-center mt-8 mb-10">
          <Text className="text-[13px]" style={{ color: "#8B9098" }}>
            Don&apos;t have an account?{" "}
          </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text
                className="text-[13px] font-semibold"
                style={{ color: ACCENT }}
              >
                Sign up
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
