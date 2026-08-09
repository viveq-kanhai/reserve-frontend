import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Bell,
  Filter,
  Plus,
  Search,
  Share2,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";
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
const SUCCESS = "#4CC38A";

const SCREEN_WIDTH = Dimensions.get("window").width;
const PROMO_WIDTH = SCREEN_WIDTH - 48; // matches px-6 (24px) side padding
const PROMO_HEIGHT = PROMO_WIDTH / 2; // 2:1 aspect ratio

const PROMOS = [
  require("../../assets/images/promotion1.png"),
  require("../../assets/images/promotion2.png"),
  require("../../assets/images/promotion3.png"),
];

// Whole-number, comma-formatted balance — cents are dropped for a cleaner look.
function formatBalance(value: any) {
  const num = Number(value) || 0;
  return Math.trunc(num).toLocaleString("en-US");
}

// ---- Reusable modal input, kept local to this file ----
function ModalField({
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad" | "decimal-pad" | "numeric";
}) {
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={TEXT_MUTED}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType ?? "default"}
      className="mb-3 rounded-2xl border px-4 py-4 text-[15px]"
      style={{
        backgroundColor: SURFACE,
        borderColor: BORDER,
        color: TEXT_PRIMARY,
      }}
    />
  );
}

export default function UserDashboard() {
  const [data, setData] = useState<any>(null);
  const qrRef = useRef<any>(null);
  const router = useRouter();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const [sendVisible, setSendVisible] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [sending, setSending] = useState(false);

  const [requestVisible, setRequestVisible] = useState(false);

  const [requestAmount, setRequestAmount] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [requestPhone, setRequestPhone] = useState("");

  const [requesting, setRequesting] = useState(false);

  const [qrVisible, setQrVisible] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [qrRequest, setQrRequest] = useState<any>(null);

  const [activePromo, setActivePromo] = useState(0);
  const promoScrollRef = useRef<ScrollView>(null);

  const allTransactions = [
    ...(data?.transactions ?? []),
    ...(data?.withdrawal_requests ?? []),
    ...(data?.payment_requests ?? []),
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePromo((prev) => {
        const next = (prev + 1) % PROMOS.length;
        promoScrollRef.current?.scrollTo({
          x: next * PROMO_WIDTH,
          animated: true,
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setData(res.data))
      .catch((err) => console.log("Dashboard:", err));
  }, []);

  if (!data) return null;

  async function loadDashboard() {
    try {
      setLoading(true);

      const response = await api.get("/dashboard");

      setDashboard(response.data);
    } catch (error) {
      console.log("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function transfer() {
    try {
      setSending(true);

      await api.post("/transactions/transfer", {
        phone_number: phoneNumber,
        amount,
      });

      Alert.alert("Success", "Transfer completed.");

      setConfirmVisible(false);
      setSendVisible(false);

      setPhoneNumber("");
      setAmount("");

      const res = await api.get("/dashboard");
      setData(res.data);
    } catch (e: any) {
      Alert.alert(
        "Transfer failed",
        e.response?.data?.message ?? "Something went wrong.",
      );
    } finally {
      setSending(false);
    }
  }

  async function createPaymentRequest() {
    try {
      setRequesting(true);

      const response = await api.post("/payment-requests", {
        amount: requestAmount,
        note: requestNote || null,
        phone_number: requestPhone || null,
      });

      console.log(response.data);

      const request = response.data.request;

      setQrRequest(request);

      setQrValue(
        JSON.stringify({
          type: "payment_request",
          id: request.id,
        }),
      );

      setRequestVisible(false);

      setRequestAmount("");
      setRequestNote("");
      setRequestPhone("");

      setQrVisible(true);

      loadDashboard();
    } catch (error: any) {
      console.log(error.response?.data ?? error);
    } finally {
      setRequesting(false);
    }
  }

  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-6 pt-14">
        <Pressable onPress={() => router.push("/(user)/profile")}>
          <Image
            source={{
              uri: data.user.pfp_path
                ? `${API_URL}/storage/${data.user.pfp_path}`
                : "https://i.pravatar.cc/100",
            }}
            className="h-10 w-10 rounded-full border"
            style={{ borderColor: BORDER }}
          />
        </Pressable>

        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full border"
          style={{ backgroundColor: SURFACE, borderColor: BORDER }}
        >
          <Bell size={18} color={TEXT_PRIMARY} strokeWidth={2} />
        </Pressable>
      </View>

      {/* TOP SECTION */}
      <View className="px-6 pt-10">
        <View className="w-full">
          <Text
            className="text-[11px] font-semibold uppercase tracking-[2px]"
            style={{ color: TEXT_SECONDARY }}
          >
            Total Balance
          </Text>

          <View className="mt-2 flex-row items-end">
            <Text
              className="text-2xl font-semibold mb-1.5 mr-1"
              style={{ color: TEXT_SECONDARY }}
            >
              $
            </Text>
            <Text
              className="text-[56px] font-bold tracking-tight"
              style={{ color: TEXT_PRIMARY, lineHeight: 58 }}
            >
              {formatBalance(data.user.balance)}
            </Text>
          </View>

          <View className="mt-5 flex-row items-center gap-3">
            <Pressable
              onPress={() => setSendVisible(true)}
              className="flex-row items-center gap-1.5 rounded-full px-5 py-2.5"
              style={{ backgroundColor: ACCENT }}
            >
              <ArrowUpRight size={16} color={BG} strokeWidth={2.5} />
              <Text className="text-sm font-semibold" style={{ color: BG }}>
                Send
              </Text>
            </Pressable>

            <Pressable
              className="flex-row items-center gap-1.5 rounded-full border px-5 py-2.5"
              style={{ backgroundColor: SURFACE, borderColor: BORDER }}
              onPress={() => setRequestVisible(true)}
            >
              <ArrowDownLeft size={16} color={TEXT_PRIMARY} strokeWidth={2.5} />
              <Text
                className="text-sm font-semibold"
                style={{ color: TEXT_PRIMARY }}
              >
                Request
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {}}
              className="h-11 w-11 items-center justify-center rounded-full border"
              style={{ backgroundColor: SURFACE, borderColor: BORDER }}
            >
              <Plus size={18} color={ACCENT} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>

        {/* PROMOTIONS */}
        <View className="mt-9" style={{ position: "relative" }}>
          <ScrollView
            ref={promoScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / PROMO_WIDTH,
              );
              setActivePromo(index);
            }}
          >
            {PROMOS.map((source, index) => (
              <Image
                key={index}
                source={source}
                style={{
                  width: PROMO_WIDTH,
                  height: PROMO_HEIGHT,
                  borderRadius: 24,
                }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          <View
            className="absolute bottom-3 flex-row items-center justify-center gap-1.5 self-center rounded-full px-2.5 py-1.5"
            style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
          >
            {PROMOS.map((_, index) => (
              <View
                key={index}
                style={{
                  height: 6,
                  width: activePromo === index ? 18 : 6,
                  borderRadius: 999,
                  backgroundColor: activePromo === index ? ACCENT : "#FFFFFF80",
                }}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Push bottom sheet down */}
      <View className="flex-1" />

      {/* Bottom Sheet */}
      <View
        className="h-[45%] rounded-t-[32px] border-t px-5 pt-6"
        style={{ backgroundColor: SHEET_BG, borderColor: BORDER }}
      >
        {/* HEADER ROW */}
        <View className="mb-5 flex-row items-center justify-between">
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full border"
            style={{ backgroundColor: SURFACE, borderColor: BORDER }}
          >
            <Filter size={16} color={TEXT_PRIMARY} strokeWidth={2} />
          </Pressable>

          <Text
            className="text-base font-semibold"
            style={{ color: TEXT_PRIMARY }}
          >
            Transactions
          </Text>

          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full border"
            style={{ backgroundColor: SURFACE, borderColor: BORDER }}
          >
            <Search size={16} color={TEXT_PRIMARY} strokeWidth={2} />
          </Pressable>
        </View>

        {/* LIST */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {allTransactions.length === 0 && (
            <Text
              className="mt-8 text-center text-sm"
              style={{ color: TEXT_MUTED }}
            >
              No transactions yet
            </Text>
          )}

          {allTransactions.map((item, index) => {
            const isWithdrawal = !!item.amount && item.type === "withdrawal";
            const isPayment = !!item.amount && item.type === "payment";

            const Icon = isWithdrawal
              ? ArrowUpRight
              : isPayment
                ? ArrowDownLeft
                : ArrowLeftRight;

            const amountColor = isWithdrawal ? ERROR : SUCCESS;

            return (
              <View
                key={index}
                className="mb-3 flex-row items-center justify-between rounded-2xl border px-4 py-3"
                style={{ backgroundColor: SURFACE, borderColor: BORDER }}
              >
                {/* LEFT SIDE */}
                <View className="flex-row items-center gap-3">
                  <View
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${amountColor}1A` }}
                  >
                    <Icon size={16} color={amountColor} strokeWidth={2.5} />
                  </View>

                  <View>
                    <Text
                      className="font-semibold"
                      style={{ color: TEXT_PRIMARY }}
                    >
                      {isWithdrawal
                        ? "Withdrawal"
                        : isPayment
                          ? "Payment Request"
                          : "Transaction"}
                    </Text>

                    <Text className="text-xs" style={{ color: TEXT_SECONDARY }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* RIGHT SIDE */}
                <Text className="font-semibold" style={{ color: amountColor }}>
                  {isWithdrawal ? "-" : "+"}${item.amount}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* SEND MODAL */}
      <Modal visible={sendVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <View
            className="rounded-t-3xl border-t p-6 pb-10"
            style={{ backgroundColor: SHEET_BG, borderColor: BORDER }}
          >
            <Text
              className="mb-6 text-2xl font-bold"
              style={{ color: TEXT_PRIMARY }}
            >
              Send money
            </Text>

            <ModalField
              placeholder="Recipient phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <View className="mb-2" />

            <ModalField
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />

            <Pressable
              disabled={!phoneNumber || !amount}
              onPress={() => setConfirmVisible(true)}
              className="mt-4 items-center rounded-2xl py-4"
              style={{
                backgroundColor: phoneNumber && amount ? ACCENT : BORDER,
              }}
            >
              <Text
                className="font-semibold"
                style={{ color: phoneNumber && amount ? BG : TEXT_MUTED }}
              >
                Continue
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSendVisible(false)}
              className="mt-4 items-center"
            >
              <Text style={{ color: TEXT_SECONDARY }}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* CONFIRM MODAL */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <View
            className="w-[88%] rounded-3xl border p-6"
            style={{ backgroundColor: SHEET_BG, borderColor: BORDER }}
          >
            <Text
              className="mb-6 text-center text-2xl font-bold"
              style={{ color: TEXT_PRIMARY }}
            >
              Confirm Transfer
            </Text>

            <View
              className="mb-6 rounded-2xl border p-4"
              style={{ backgroundColor: SURFACE, borderColor: BORDER }}
            >
              <Text
                className="text-xs uppercase tracking-widest"
                style={{ color: TEXT_SECONDARY }}
              >
                Recipient
              </Text>

              <Text
                className="mb-4 mt-1 text-lg font-semibold"
                style={{ color: TEXT_PRIMARY }}
              >
                {phoneNumber}
              </Text>

              <Text
                className="text-xs uppercase tracking-widest"
                style={{ color: TEXT_SECONDARY }}
              >
                Amount
              </Text>

              <Text
                className="mt-1 text-3xl font-bold"
                style={{ color: TEXT_PRIMARY }}
              >
                ${amount}
              </Text>
            </View>

            <Pressable
              disabled={sending}
              onPress={transfer}
              className="items-center rounded-2xl py-4"
              style={{ backgroundColor: sending ? `${ACCENT}80` : ACCENT }}
            >
              <Text className="font-semibold" style={{ color: BG }}>
                {sending ? "Sending..." : "Confirm"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setConfirmVisible(false)}
              className="mt-4 items-center"
            >
              <Text style={{ color: TEXT_SECONDARY }}>Back</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* REQUEST MODAL */}
      <Modal visible={requestVisible} transparent animationType="slide">
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <View
            className="rounded-t-3xl border-t p-6"
            style={{ backgroundColor: SHEET_BG, borderColor: BORDER }}
          >
            <Text
              className="mb-5 text-xl font-bold"
              style={{ color: TEXT_PRIMARY }}
            >
              Request Money
            </Text>

            <ModalField
              placeholder="Amount"
              keyboardType="numeric"
              value={requestAmount}
              onChangeText={setRequestAmount}
            />

            <ModalField
              placeholder="Phone number (optional)"
              value={requestPhone}
              onChangeText={setRequestPhone}
              keyboardType="phone-pad"
            />

            <ModalField
              placeholder="Note (optional)"
              value={requestNote}
              onChangeText={setRequestNote}
            />

            <Pressable
              onPress={createPaymentRequest}
              disabled={requesting}
              className="mt-2 rounded-2xl py-4"
              style={{ backgroundColor: requesting ? `${ACCENT}80` : ACCENT }}
            >
              <Text className="text-center font-semibold" style={{ color: BG }}>
                {requesting ? "Creating..." : "Create Request"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setRequestVisible(false)}
              className="mt-3 py-3"
            >
              <Text className="text-center" style={{ color: TEXT_SECONDARY }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* QR MODAL */}
      <Modal visible={qrVisible} transparent animationType="slide">
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <View
            className="rounded-t-3xl border-t p-6 pb-10"
            style={{ backgroundColor: SHEET_BG, borderColor: BORDER }}
          >
            <Text
              className="mb-5 text-center text-2xl font-bold"
              style={{ color: TEXT_PRIMARY }}
            >
              Payment Request
            </Text>

            <ViewShot
              ref={qrRef}
              options={{
                format: "png",
                quality: 1,
              }}
            >
              <View
                className="items-center rounded-3xl p-6"
                style={{ backgroundColor: "#FFFFFF" }}
              >
                <QRCode value={qrValue} size={220} />

                <Text
                  className="mt-5 text-xl font-bold"
                  style={{ color: "#0B0D10" }}
                >
                  ${qrRequest?.amount}
                </Text>

                {qrRequest?.note && (
                  <Text className="mt-2" style={{ color: "#6B7280" }}>
                    {qrRequest.note}
                  </Text>
                )}
              </View>
            </ViewShot>

            <Pressable
              className="mt-8 flex-row items-center justify-center gap-2 rounded-2xl py-4"
              style={{ backgroundColor: ACCENT }}
              onPress={async () => {
                const uri = await qrRef.current.capture();

                await Sharing.shareAsync(uri);
              }}
            >
              <Share2 size={16} color={BG} strokeWidth={2.5} />
              <Text className="text-center font-semibold" style={{ color: BG }}>
                Share QR Code
              </Text>
            </Pressable>

            <Pressable
              className="mt-3 py-3"
              onPress={() => setQrVisible(false)}
            >
              <Text className="text-center" style={{ color: TEXT_SECONDARY }}>
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
