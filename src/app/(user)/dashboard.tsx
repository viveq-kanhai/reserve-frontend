import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Plus,
  Settings,
  Share2,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";
import { api } from "../../services/api";

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

const SCREEN_PADDING = 20; // matches the px-5 side padding on the card/promo section

const PROMOS = [
  require("../../assets/images/promotion1.png"),
  require("../../assets/images/promotion2.png"),
  require("../../assets/images/promotion3.png"),
];

// Formats the balance with comma separators and always shows two decimal places.
function formatBalance(value: any) {
  const num = Number(value) || 0;
  const [whole, decimals] = num.toFixed(2).split(".");
  return {
    whole: Number(whole).toLocaleString("en-US"),
    decimals,
  };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function prettify(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---- Recent Activity row logic — kept local to this file, mirrors the
// same conventions used on the full Transactions screen ----
function buildRowInfo(item: any) {
  const counterpartyLabel = item.counterparty
    ? item.counterparty.name?.trim() || item.counterparty.phone_number
    : null;

  if (item._source === "transaction") {
    let title: string;

    if (item.type === "request_payment" && counterpartyLabel) {
      title =
        item.direction === "sent"
          ? `You paid ${counterpartyLabel}'s request`
          : `Payment request paid by ${counterpartyLabel}`;
    } else if (counterpartyLabel) {
      title =
        item.direction === "sent"
          ? `Sent to ${counterpartyLabel}`
          : `Received from ${counterpartyLabel}`;
    } else {
      title = prettify(item.type ?? "Transaction");
    }

    return { title, settled: true, isOutgoing: item.direction === "sent" };
  }

  if (item._source === "withdrawal_request") {
    return { title: "Withdrawal", settled: false, isOutgoing: true };
  }

  const title = !item.direction
    ? "Open payment request"
    : item.direction === "sent"
      ? `Payment request from ${counterpartyLabel ?? "someone"}`
      : `You requested from ${counterpartyLabel ?? "someone"}`;

  return { title, settled: false, isOutgoing: item.direction === "sent" };
}

function getInitials(item: any, title: string) {
  const source =
    item.counterparty?.name?.trim() || item.counterparty?.phone_number || title;
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

// Tracks the real keyboard height via native events instead of relying on
// KeyboardAvoidingView's automatic behavior — which is unreliable inside
// React Native's <Modal>, since Modal renders in its own native window and
// often doesn't receive proper keyboard-frame data (especially on Android).
function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
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
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  const { width: screenWidth } = useWindowDimensions();
  const promoWidth = screenWidth - SCREEN_PADDING * 2;
  const promoHeight = promoWidth / 2; // 2:1 aspect ratio

  const [notifOpen, setNotifOpen] = useState(false);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePromo((prev) => {
        const next = (prev + 1) % PROMOS.length;
        promoScrollRef.current?.scrollTo({
          x: next * promoWidth,
          animated: true,
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [promoWidth]);

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

  const recentActivity = [
    ...(data?.transactions ?? []).map((t: any) => ({
      ...t,
      _source: "transaction",
    })),
    ...(data?.withdrawal_requests ?? []).map((t: any) => ({
      ...t,
      _source: "withdrawal_request",
    })),
    ...(data?.payment_requests ?? []).map((t: any) => ({
      ...t,
      _source: "payment_request",
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 5);

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

      setQrValue(response.data.qr_data.url);

      setRequestVisible(false);

      setRequestAmount("");
      setRequestNote("");
      setRequestPhone("");

      setQrVisible(true);

      loadDashboard();
    } catch (error: any) {
      console.log(error.response?.data ?? error);
      Alert.alert(
        "Couldn't create request",
        error.response?.data?.message ?? "Something went wrong.",
      );
    } finally {
      setRequesting(false);
    }
  }

  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* HEADER */}
        <View className="flex-row items-center justify-between px-6 pt-14">
          <View>
            <Text className="text-[13px]" style={{ color: TEXT_SECONDARY }}>
              {getGreeting()}
            </Text>
            <Text
              className="text-[19px] font-bold mt-0.5"
              style={{ color: TEXT_PRIMARY }}
            >
              {data.user.first_name}
            </Text>
          </View>

          <View className="flex-row items-center gap-2.5">
            <Pressable
              onPress={() => router.push("/profile")}
              className="h-11 w-11 items-center justify-center rounded-full border"
              style={{ backgroundColor: SURFACE, borderColor: BORDER }}
            >
              <Settings size={18} color={TEXT_PRIMARY} strokeWidth={1.8} />
            </Pressable>

            <View>
              <Pressable
                onPress={() => setNotifOpen((v) => !v)}
                className="h-11 w-11 items-center justify-center rounded-full border"
                style={{ backgroundColor: SURFACE, borderColor: BORDER }}
              >
                <Bell size={18} color={TEXT_PRIMARY} strokeWidth={1.8} />
              </Pressable>

              {notifOpen && (
                <View
                  className="absolute top-[52px] right-0 w-64 rounded-2xl border p-2"
                  style={{
                    backgroundColor: SHEET_BG,
                    borderColor: BORDER,
                    zIndex: 10,
                  }}
                >
                  <Text
                    className="text-[11px] font-semibold uppercase tracking-wider px-2 pt-2 pb-1"
                    style={{ color: TEXT_SECONDARY }}
                  >
                    Notifications
                  </Text>
                  {/* No notifications backend yet — placeholder only */}
                  <Text
                    className="text-sm px-2 py-3"
                    style={{ color: TEXT_MUTED }}
                  >
                    No notifications yet
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* BALANCE CARD */}
        <View className="px-5 pt-10">
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
                {formatBalance(data.user.balance).whole}
              </Text>
              <Text
                className="text-2xl font-semibold mb-1.5 ml-0.5"
                style={{ color: TEXT_SECONDARY }}
              >
                .{formatBalance(data.user.balance).decimals}
              </Text>
            </View>

            <View className="mt-5 flex-row items-center gap-3">
              <Pressable
                onPress={() => {
                  if (data.user.kyc_status !== "verified") {
                    router.push("/kyc");
                    return;
                  }
                  setSendVisible(true);
                }}
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
                <ArrowDownLeft
                  size={16}
                  color={TEXT_PRIMARY}
                  strokeWidth={2.5}
                />
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
                  e.nativeEvent.contentOffset.x / promoWidth,
                );
                setActivePromo(index);
              }}
            >
              {PROMOS.map((source, index) => (
                <Image
                  key={index}
                  source={source}
                  style={{
                    width: promoWidth,
                    height: promoHeight,
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
                    backgroundColor:
                      activePromo === index ? ACCENT : "#FFFFFF80",
                  }}
                />
              ))}
            </View>
          </View>

          {/* RECENT ACTIVITY */}
          <View className="mt-9">
            <View className="mb-3 flex-row items-center justify-between">
              <Text
                className="text-[15px] font-bold"
                style={{ color: TEXT_PRIMARY }}
              >
                Recent Activity
              </Text>

              <Pressable
                onPress={() => router.push("/transactions")}
                hitSlop={8}
              >
                <Text
                  className="text-[12.5px] font-semibold"
                  style={{ color: ACCENT }}
                >
                  See all
                </Text>
              </Pressable>
            </View>

            {recentActivity.length === 0 && (
              <Text
                className="text-sm py-6 text-center"
                style={{ color: TEXT_MUTED }}
              >
                No transactions yet
              </Text>
            )}

            {recentActivity.map((item, index) => {
              const { title, settled, isOutgoing } = buildRowInfo(item);
              const initials = getInitials(item, title);

              // Received = accent green, sent = neutral light — matches
              // the reference design rather than the red/green convention
              // used elsewhere in the app.
              const amountColor = !settled
                ? TEXT_MUTED
                : isOutgoing
                  ? TEXT_PRIMARY
                  : ACCENT;

              return (
                <View
                  key={index}
                  className="flex-row items-center gap-3 py-2.5"
                >
                  <View
                    className="h-[38px] w-[38px] items-center justify-center rounded-full border"
                    style={{ backgroundColor: SURFACE, borderColor: BORDER }}
                  >
                    <Text
                      className="text-[13px] font-bold"
                      style={{
                        color: settled && !isOutgoing ? ACCENT : TEXT_SECONDARY,
                      }}
                    >
                      {initials}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <Text
                      className="font-semibold"
                      numberOfLines={1}
                      style={{ color: TEXT_PRIMARY }}
                    >
                      {title}
                    </Text>
                  </View>

                  <Text
                    className="font-semibold"
                    style={{ color: amountColor }}
                  >
                    {settled ? (isOutgoing ? "-" : "+") : ""}${item.amount}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* SEND MODAL */}
      <Modal visible={sendVisible} transparent animationType="slide">
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <View
            className="rounded-t-3xl border-t p-6"
            style={{
              backgroundColor: SHEET_BG,
              borderColor: BORDER,
              paddingBottom: insets.bottom + 24,
              marginBottom: keyboardHeight,
            }}
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
        </View>
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
            style={{
              backgroundColor: SHEET_BG,
              borderColor: BORDER,
              paddingBottom: insets.bottom + 24,
              marginBottom: keyboardHeight,
            }}
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
              disabled={requesting || !requestAmount}
              className="mt-2 rounded-2xl py-4"
              style={{
                backgroundColor: requesting || !requestAmount ? BORDER : ACCENT,
              }}
            >
              <Text
                className="text-center font-semibold"
                style={{ color: requestAmount ? BG : TEXT_MUTED }}
              >
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
            className="rounded-t-3xl border-t p-6"
            style={{
              backgroundColor: SHEET_BG,
              borderColor: BORDER,
              paddingBottom: insets.bottom + 24,
            }}
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
