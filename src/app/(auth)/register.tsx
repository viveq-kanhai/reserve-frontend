import { Link } from "expo-router";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Phone,
  User,
} from "lucide-react-native";
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
      className={`flex-row items-center rounded-2xl bg-[#12181F] border px-4 mb-4 ${
        focused ? "border-[#B4DE00]" : "border-[#1E2630]"
      }`}
      style={{ height: 54 }}
    >
      <Icon size={18} color={focused ? ACCENT : "#5B6672"} strokeWidth={2} />
      <TextInput
        className="flex-1 text-[15px] text-neutral-50 ml-3"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        secureTextEntry={hidden}
        keyboardType={keyboardType ?? "default"}
        placeholder={placeholder}
        placeholderTextColor="#5B6672"
        autoCapitalize={keyboardType === "phone-pad" ? "none" : "words"}
      />
      {toggleable && (
        <TouchableOpacity onPress={() => setHidden((h) => !h)} hitSlop={8}>
          {hidden ? (
            <Eye size={18} color="#5B6672" strokeWidth={2} />
          ) : (
            <EyeOff size={18} color={ACCENT} strokeWidth={2} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

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
    <KeyboardAvoidingView
      className="flex-1 bg-[#0A0E14]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mark + heading */}
        <View className="mt-20 mb-8">
          <View
            className="w-10 h-10 rounded-[10px] mb-6 items-center justify-center"
            style={{ backgroundColor: ACCENT }}
          >
            <View className="w-3 h-3 bg-[#0A0E14] rounded-[2px]" />
          </View>
          <Text className="text-[28px] font-bold text-neutral-50 tracking-tight">
            Create your account
          </Text>
          <Text className="text-[14px] text-neutral-500 mt-2 leading-5">
            Set up a wallet in a couple of minutes.
          </Text>
        </View>

        {/* Error banner */}
        {error && (
          <View className="border border-red-900/60 bg-red-950/40 rounded-2xl px-4 py-3 mb-5">
            <Text className="text-[13px] text-red-400">{error}</Text>
          </View>
        )}

        {/* Fields */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField
              icon={User}
              placeholder="First name"
              value={first_name}
              onChangeText={setFirst}
            />
          </View>
          <View className="flex-1">
            <FormField
              icon={User}
              placeholder="Last name"
              value={last_name}
              onChangeText={setLast}
            />
          </View>
        </View>

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

        <FormField
          icon={Lock}
          placeholder="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          toggleable
        />

        {/* Submit */}
        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
          className="mt-3 rounded-2xl py-4 flex-row items-center justify-center gap-2"
          style={{ backgroundColor: loading ? "#B4DE0080" : ACCENT }}
        >
          {loading ? (
            <ActivityIndicator color="#0A0E14" />
          ) : (
            <>
              <Text className="text-[15px] font-semibold text-[#0A0E14] tracking-wide">
                Create account
              </Text>
              <ArrowRight size={18} color="#0A0E14" strokeWidth={2.5} />
            </>
          )}
        </TouchableOpacity>

        {/* Footer link */}
        <View className="flex-row justify-center items-center mt-8 mb-10">
          <Text className="text-[13px] text-neutral-500">
            Already have an account?{" "}
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text
                className="text-[13px] font-semibold"
                style={{ color: ACCENT }}
              >
                Log in
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
