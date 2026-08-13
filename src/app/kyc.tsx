import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
    Calendar,
    Camera,
    Check,
    ChevronLeft,
    Clock,
    User,
    X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../services/api";

const BG = "#0B0D10";
const SHEET_BG = "#101317";
const SURFACE = "#15181C";
const BORDER = "#22262B";
const ACCENT = "#B4DE00";
const TEXT_PRIMARY = "#EDEEF0";
const TEXT_SECONDARY = "#8B9098";
const TEXT_MUTED = "#54585F";
const ERROR = "#E5484D";

function formatDateISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text
        className="text-[11px] font-semibold uppercase tracking-widest mb-2"
        style={{ color: TEXT_SECONDARY }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={TEXT_MUTED}
        multiline={multiline}
        className="rounded-2xl border px-4 py-4 text-[15px]"
        style={{
          backgroundColor: SURFACE,
          borderColor: BORDER,
          color: TEXT_PRIMARY,
          minHeight: multiline ? 90 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

// ---- Date of birth field — opens a themed picker sheet instead of typing ----
function DateField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <View className="mb-4">
      <Text
        className="text-[11px] font-semibold uppercase tracking-widest mb-2"
        style={{ color: TEXT_SECONDARY }}
      >
        {label}
      </Text>
      <Pressable
        onPress={onPress}
        className="flex-row items-center justify-between rounded-2xl border px-4 py-4"
        style={{ backgroundColor: SURFACE, borderColor: BORDER }}
      >
        <Text
          className="text-[15px]"
          style={{ color: value ? TEXT_PRIMARY : TEXT_MUTED }}
        >
          {value ? formatDateDisplay(value) : "Select date"}
        </Text>
        <Calendar size={18} color={TEXT_SECONDARY} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

function PhotoCapture({
  label,
  uri,
  onCapture,
}: {
  label: string;
  uri: string | null;
  onCapture: () => void;
}) {
  return (
    <Pressable
      onPress={onCapture}
      className="rounded-2xl border items-center justify-center overflow-hidden mb-4"
      style={{
        backgroundColor: SURFACE,
        borderColor: BORDER,
        height: 200,
      }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      ) : (
        <View className="items-center">
          <Camera size={28} color={TEXT_MUTED} strokeWidth={1.8} />
          <Text className="mt-3 text-sm" style={{ color: TEXT_SECONDARY }}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const MAX_DOB = new Date(); // can't be born in the future
const MIN_DOB = new Date(
  new Date().getFullYear() - 120,
  new Date().getMonth(),
  new Date().getDate(),
);
const DEFAULT_DOB = new Date(
  new Date().getFullYear() - 18,
  new Date().getMonth(),
  new Date().getDate(),
);

export default function KycScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string>("unverified");
  const [submission, setSubmission] = useState<any>(null);

  const [step, setStep] = useState(0); // 0=personal, 1=id doc, 2=selfie, 3=review
  const [submitting, setSubmitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(""); // ISO "YYYY-MM-DD"
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [idCardNumber, setIdCardNumber] = useState("");
  const [idCardImage, setIdCardImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);

  const [dobPickerVisible, setDobPickerVisible] = useState(false);
  const [dobDraft, setDobDraft] = useState<Date>(DEFAULT_DOB);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      setLoading(true);
      const res = await api.get("/kyc");
      setKycStatus(res.data.kyc_status);
      setSubmission(res.data.submission);
    } catch (e) {
      console.log("KYC status error:", e);
    } finally {
      setLoading(false);
    }
  }

  function openDobPicker() {
    setDobDraft(
      dateOfBirth ? new Date(`${dateOfBirth}T00:00:00`) : DEFAULT_DOB,
    );
    setDobPickerVisible(true);
  }

  function confirmDob() {
    setDateOfBirth(formatDateISO(dobDraft));
    setDobPickerVisible(false);
  }

  async function captureIdCard() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setIdCardImage(result.assets[0].uri);
    }
  }

  async function captureSelfie() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setSelfieImage(result.assets[0].uri);
    }
  }

  function canContinuePersonal() {
    return Boolean(firstName && lastName && dateOfBirth && address && city);
  }

  async function submit() {
    try {
      setSubmitting(true);

      const form = new FormData();
      form.append("first_name", firstName);
      form.append("last_name", lastName);
      form.append("date_of_birth", dateOfBirth);
      form.append("address", address);
      form.append("city", city);
      if (idCardNumber) form.append("id_card_number", idCardNumber);

      form.append("id_card", {
        uri: idCardImage,
        name: "id_card.jpg",
        type: "image/jpeg",
      } as any);

      form.append("selfie", {
        uri: selfieImage,
        name: "selfie.jpg",
        type: "image/jpeg",
      } as any);

      await api.post("/kyc", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert("Submitted", "We'll review your submission shortly.");
      loadStatus();
    } catch (e: any) {
      Alert.alert(
        "Couldn't submit",
        e.response?.data?.message ?? "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const Header = (
    <View className="flex-row items-center px-6 pt-14 pb-6">
      <Pressable
        onPress={() => router.back()}
        className="h-9 w-9 items-center justify-center rounded-full border"
        style={{ backgroundColor: SURFACE, borderColor: BORDER }}
        hitSlop={8}
      >
        <ChevronLeft size={18} color={TEXT_PRIMARY} strokeWidth={2.2} />
      </Pressable>

      <Text className="ml-4 text-2xl font-bold" style={{ color: TEXT_PRIMARY }}>
        Identity Verification
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: BG }}
      >
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  // ---- Status views: pending / verified ----
  if (kycStatus === "pending") {
    return (
      <View className="flex-1" style={{ backgroundColor: BG }}>
        {Header}
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="h-16 w-16 rounded-full items-center justify-center border mb-5"
            style={{ backgroundColor: SURFACE, borderColor: BORDER }}
          >
            <Clock size={26} color={ACCENT} strokeWidth={1.8} />
          </View>
          <Text
            className="text-lg font-semibold text-center"
            style={{ color: TEXT_PRIMARY }}
          >
            Under Review
          </Text>
          <Text className="mt-2 text-center" style={{ color: TEXT_SECONDARY }}>
            We're reviewing your submission. This usually takes 1–2 business
            days.
          </Text>
        </View>
      </View>
    );
  }

  if (kycStatus === "verified") {
    return (
      <View className="flex-1" style={{ backgroundColor: BG }}>
        {Header}
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="h-16 w-16 rounded-full items-center justify-center mb-5"
            style={{ backgroundColor: `${ACCENT}1A` }}
          >
            <Check size={28} color={ACCENT} strokeWidth={2.5} />
          </View>
          <Text
            className="text-lg font-semibold text-center"
            style={{ color: TEXT_PRIMARY }}
          >
            You're Verified
          </Text>
          <Text className="mt-2 text-center" style={{ color: TEXT_SECONDARY }}>
            Your identity has been confirmed. All features are unlocked.
          </Text>
        </View>
      </View>
    );
  }

  const wasRejected = kycStatus === "rejected";

  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      {Header}

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {wasRejected && submission?.rejection_reason && (
          <View
            className="rounded-2xl border p-4 mb-6"
            style={{ backgroundColor: "#1A1113", borderColor: "#3A2224" }}
          >
            <View className="flex-row items-center gap-2 mb-1.5">
              <X size={14} color={ERROR} strokeWidth={2.5} />
              <Text className="text-sm font-semibold" style={{ color: ERROR }}>
                Previous submission declined
              </Text>
            </View>
            <Text className="text-sm" style={{ color: TEXT_SECONDARY }}>
              {submission.rejection_reason}
            </Text>
          </View>
        )}

        {/* Step indicator */}
        <View className="flex-row items-center gap-2 mb-8">
          {["Personal", "ID Document", "Selfie", "Review"].map((label, i) => (
            <View key={label} className="flex-1">
              <View
                style={{
                  height: 3,
                  borderRadius: 999,
                  backgroundColor: i <= step ? ACCENT : BORDER,
                }}
              />
            </View>
          ))}
        </View>

        {step === 0 && (
          <>
            <Text
              className="text-lg font-bold mb-1"
              style={{ color: TEXT_PRIMARY }}
            >
              Personal Information
            </Text>
            <Text className="text-sm mb-6" style={{ color: TEXT_SECONDARY }}>
              This should match your government-issued ID exactly.
            </Text>

            <Field
              label="First name"
              value={firstName}
              onChangeText={setFirstName}
            />
            <Field
              label="Last name"
              value={lastName}
              onChangeText={setLastName}
            />
            <DateField
              label="Date of birth"
              value={dateOfBirth}
              onPress={openDobPicker}
            />
            <Field
              label="Address"
              value={address}
              onChangeText={setAddress}
              multiline
            />
            <Field label="City" value={city} onChangeText={setCity} />

            <Pressable
              onPress={() => canContinuePersonal() && setStep(1)}
              disabled={!canContinuePersonal()}
              className="mt-2 items-center rounded-2xl py-4"
              style={{
                backgroundColor: canContinuePersonal() ? ACCENT : BORDER,
              }}
            >
              <Text
                className="font-semibold"
                style={{ color: canContinuePersonal() ? BG : TEXT_MUTED }}
              >
                Continue
              </Text>
            </Pressable>
          </>
        )}

        {step === 1 && (
          <>
            <Text
              className="text-lg font-bold mb-1"
              style={{ color: TEXT_PRIMARY }}
            >
              ID Document
            </Text>
            <Text className="text-sm mb-6" style={{ color: TEXT_SECONDARY }}>
              A clear photo of your government-issued ID card.
            </Text>

            <PhotoCapture
              label="Take a photo of your ID"
              uri={idCardImage}
              onCapture={captureIdCard}
            />

            <Field
              label="ID card number (optional)"
              value={idCardNumber}
              onChangeText={setIdCardNumber}
            />

            <View className="flex-row gap-3 mt-2">
              <Pressable
                onPress={() => setStep(0)}
                className="flex-1 items-center rounded-2xl border py-4"
                style={{ backgroundColor: SURFACE, borderColor: BORDER }}
              >
                <Text style={{ color: TEXT_PRIMARY }}>Back</Text>
              </Pressable>

              <Pressable
                onPress={() => idCardImage && setStep(2)}
                disabled={!idCardImage}
                className="flex-1 items-center rounded-2xl py-4"
                style={{ backgroundColor: idCardImage ? ACCENT : BORDER }}
              >
                <Text
                  className="font-semibold"
                  style={{ color: idCardImage ? BG : TEXT_MUTED }}
                >
                  Continue
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text
              className="text-lg font-bold mb-1"
              style={{ color: TEXT_PRIMARY }}
            >
              Selfie
            </Text>
            <Text className="text-sm mb-6" style={{ color: TEXT_SECONDARY }}>
              A clear photo of your face, well-lit and looking at the camera.
            </Text>

            <PhotoCapture
              label="Take a selfie"
              uri={selfieImage}
              onCapture={captureSelfie}
            />

            <View className="flex-row gap-3 mt-2">
              <Pressable
                onPress={() => setStep(1)}
                className="flex-1 items-center rounded-2xl border py-4"
                style={{ backgroundColor: SURFACE, borderColor: BORDER }}
              >
                <Text style={{ color: TEXT_PRIMARY }}>Back</Text>
              </Pressable>

              <Pressable
                onPress={() => selfieImage && setStep(3)}
                disabled={!selfieImage}
                className="flex-1 items-center rounded-2xl py-4"
                style={{ backgroundColor: selfieImage ? ACCENT : BORDER }}
              >
                <Text
                  className="font-semibold"
                  style={{ color: selfieImage ? BG : TEXT_MUTED }}
                >
                  Continue
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Text
              className="text-lg font-bold mb-1"
              style={{ color: TEXT_PRIMARY }}
            >
              Review & Submit
            </Text>
            <Text className="text-sm mb-6" style={{ color: TEXT_SECONDARY }}>
              Make sure everything is correct before submitting.
            </Text>

            <View
              className="rounded-2xl border p-5 mb-4"
              style={{ backgroundColor: SURFACE, borderColor: BORDER }}
            >
              <View className="flex-row items-center gap-2 mb-3">
                <User size={15} color={TEXT_SECONDARY} strokeWidth={2} />
                <Text
                  className="text-sm font-semibold"
                  style={{ color: TEXT_PRIMARY }}
                >
                  {firstName} {lastName}
                </Text>
              </View>
              <Text className="text-xs" style={{ color: TEXT_SECONDARY }}>
                {formatDateDisplay(dateOfBirth)}
              </Text>
              <Text className="text-xs mt-1" style={{ color: TEXT_SECONDARY }}>
                {address}, {city}
              </Text>
            </View>

            <View className="flex-row gap-3 mb-6">
              <View className="flex-1">
                <Text className="text-xs mb-2" style={{ color: TEXT_MUTED }}>
                  ID Document
                </Text>
                <Image
                  source={{ uri: idCardImage! }}
                  style={{ width: "100%", height: 100, borderRadius: 16 }}
                  resizeMode="cover"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs mb-2" style={{ color: TEXT_MUTED }}>
                  Selfie
                </Text>
                <Image
                  source={{ uri: selfieImage! }}
                  style={{ width: "100%", height: 100, borderRadius: 16 }}
                  resizeMode="cover"
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setStep(2)}
                className="flex-1 items-center rounded-2xl border py-4"
                style={{ backgroundColor: SURFACE, borderColor: BORDER }}
              >
                <Text style={{ color: TEXT_PRIMARY }}>Back</Text>
              </Pressable>

              <Pressable
                onPress={submit}
                disabled={submitting}
                className="flex-1 items-center rounded-2xl py-4"
                style={{ backgroundColor: submitting ? `${ACCENT}80` : ACCENT }}
              >
                <Text className="font-semibold" style={{ color: BG }}>
                  {submitting ? "Submitting..." : "Submit"}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {/* DATE OF BIRTH PICKER */}
      <Modal visible={dobPickerVisible} transparent animationType="slide">
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <View
            className="rounded-t-3xl border-t px-6 pt-6"
            style={{
              backgroundColor: SHEET_BG,
              borderColor: BORDER,
              paddingBottom: insets.bottom + 24,
            }}
          >
            <Text
              className="mb-4 text-xl font-bold"
              style={{ color: TEXT_PRIMARY }}
            >
              Date of Birth
            </Text>

            <View
              className="rounded-2xl border items-center overflow-hidden mb-4"
              style={{ backgroundColor: SURFACE, borderColor: BORDER }}
            >
              <DateTimePicker
                value={dobDraft}
                mode="date"
                display="spinner"
                maximumDate={MAX_DOB}
                minimumDate={MIN_DOB}
                themeVariant="dark"
                accentColor={ACCENT}
                textColor={TEXT_PRIMARY}
                onValueChange={(selected) => {
                  if (selected) setDobDraft(selected);
                }}
                onDismiss={() => setDobPickerVisible(false)}
                style={{ width: "100%" }}
              />
            </View>

            <Pressable
              onPress={confirmDob}
              className="items-center rounded-2xl py-4"
              style={{ backgroundColor: ACCENT }}
            >
              <Text className="font-semibold" style={{ color: BG }}>
                Confirm
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setDobPickerVisible(false)}
              className="mt-3 items-center py-3"
            >
              <Text style={{ color: TEXT_SECONDARY }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
