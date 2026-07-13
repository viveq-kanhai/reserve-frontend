import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";
import { api } from "../../services/api";

export default function UserDashboard() {
  const [data, setData] = useState<any>(null);
  const qrRef = useRef<any>(null);

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

  const allTransactions = [
    ...(data?.transactions ?? []),
    ...(data?.withdrawal_requests ?? []),
    ...(data?.payment_requests ?? []),
  ];

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
    <View className="flex-1 bg-black">
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-6 pt-14">
        <Image
          source={{ uri: "https://i.pravatar.cc/100" }}
          className="h-10 w-10 rounded-full"
        />

        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-zinc-900">
          <Ionicons name="notifications" size={20} color="white" />
        </Pressable>
      </View>

      {/* TOP SECTION */}
      <View className="px-6 pt-16">
        <View className="w-2/3">
          <Text className="text-sm text-gray-400">Total Balance</Text>

          <Text className="mt-2 text-5xl font-bold text-white">
            ${data.user.balance}
          </Text>

          <View className="mt-6 flex-row gap-3">
            <Pressable
              onPress={() => setSendVisible(true)}
              className="rounded-full bg-white px-5 py-2"
            >
              <Text className="text-sm font-semibold text-black">Send</Text>
            </Pressable>

            <Pressable
              className="rounded-full bg-zinc-800 px-5 py-2"
              onPress={() => setRequestVisible(true)}
            >
              <Text className="text-sm font-semibold text-white">Request</Text>
            </Pressable>
          </View>
        </View>

        {/* 👇 STAT CARD NOW INSIDE FLOW */}
        <View className="mt-8 rounded-3xl bg-zinc-900 p-6">
          <Text className="text-xs uppercase tracking-widest text-gray-400">
            This Month
          </Text>

          <Text className="mt-2 text-3xl font-bold text-white">$4,250</Text>

          <Text className="mt-1 text-sm text-green-400">
            ↑ 12.8% from last month
          </Text>
        </View>
      </View>

      {/* Push bottom sheet down */}
      <View className="flex-1" />

      {/* Bottom Sheet */}
      <View className="h-[45%] rounded-t-[32px] bg-white px-5 pt-6">
        {/* HEADER ROW */}
        <View className="mb-4 flex-row items-center justify-between">
          {/* Left: Filter */}
          <Pressable className="h-9 w-9 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="filter" size={18} color="black" />
          </Pressable>

          {/* Center: Title */}
          <Text className="text-base font-semibold text-black">
            Transactions
          </Text>

          {/* Right: Search */}
          <Pressable className="h-9 w-9 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="search" size={18} color="black" />
          </Pressable>
        </View>

        {/* LIST */}
        <View className="flex-1">
          {allTransactions.map((item, index) => {
            const isWithdrawal = !!item.amount && item.type === "withdrawal";
            const isPayment = !!item.amount && item.type === "payment";

            return (
              <View
                key={index}
                className="mb-3 flex-row items-center justify-between rounded-2xl bg-gray-50 px-4 py-3"
              >
                {/* LEFT SIDE */}
                <View>
                  <Text className="font-semibold text-black">
                    {isWithdrawal
                      ? "Withdrawal"
                      : isPayment
                        ? "Payment Request"
                        : "Transaction"}
                  </Text>

                  <Text className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>

                {/* RIGHT SIDE */}
                <Text
                  className={`font-semibold ${
                    isWithdrawal ? "text-red-500" : "text-green-600"
                  }`}
                >
                  {isWithdrawal ? "-" : "+"}${item.amount}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <Modal visible={sendVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end bg-black/40"
        >
          <View className="rounded-t-3xl bg-white p-6 pb-10">
            <Text className="mb-6 text-2xl font-bold">Send Points</Text>

            <TextInput
              placeholder="Recipient phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              className="mb-4 rounded-xl border border-gray-300 px-4 py-4"
            />

            <TextInput
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              className="mb-6 rounded-xl border border-gray-300 px-4 py-4"
            />

            <Pressable
              disabled={!phoneNumber || !amount}
              onPress={() => setConfirmVisible(true)}
              className={`items-center rounded-2xl py-4 ${
                phoneNumber && amount ? "bg-black" : "bg-gray-300"
              }`}
            >
              <Text className="font-semibold text-white">Continue</Text>
            </Pressable>

            <Pressable
              onPress={() => setSendVisible(false)}
              className="mt-4 items-center"
            >
              <Text className="text-gray-500">Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={confirmVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="w-[88%] rounded-3xl bg-white p-6">
            <Text className="mb-6 text-center text-2xl font-bold">
              Confirm Transfer
            </Text>

            <View className="mb-6">
              <Text className="text-gray-500">Recipient</Text>

              <Text className="mb-4 text-lg font-semibold">{phoneNumber}</Text>

              <Text className="text-gray-500">Amount</Text>

              <Text className="text-3xl font-bold">${amount}</Text>
            </View>

            <Pressable
              disabled={sending}
              onPress={transfer}
              className="items-center rounded-2xl bg-black py-4"
            >
              <Text className="font-semibold text-white">
                {sending ? "Sending..." : "Confirm"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setConfirmVisible(false)}
              className="mt-4 items-center"
            >
              <Text className="text-gray-500">Back</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={requestVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-white p-6">
            <Text className="mb-5 text-xl font-bold">Request Money</Text>

            <TextInput
              placeholder="Amount"
              keyboardType="numeric"
              value={requestAmount}
              onChangeText={setRequestAmount}
              className="mb-3 rounded-xl border border-gray-300 px-4 py-3"
            />

            <TextInput
              placeholder="Phone number (optional)"
              value={requestPhone}
              onChangeText={setRequestPhone}
              keyboardType="phone-pad"
              className="mb-3 rounded-xl border border-gray-300 px-4 py-3"
            />

            <TextInput
              placeholder="Note (optional)"
              value={requestNote}
              onChangeText={setRequestNote}
              className="mb-5 rounded-xl border border-gray-300 px-4 py-3"
            />

            <Pressable
              onPress={createPaymentRequest}
              disabled={requesting}
              className="rounded-xl bg-black py-4"
            >
              <Text className="text-center font-semibold text-white">
                {requesting ? "Creating..." : "Create Request"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setRequestVisible(false)}
              className="mt-3 py-3"
            >
              <Text className="text-center text-gray-500">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={qrVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-white p-6 pb-10">
            <Text className="mb-5 text-center text-2xl font-bold">
              Payment Request
            </Text>

            <ViewShot
              ref={qrRef}
              options={{
                format: "png",
                quality: 1,
              }}
            >
              <View className="items-center">
                <QRCode value={qrValue} size={220} />

                <Text className="mt-5 text-xl font-bold">
                  ${qrRequest?.amount}
                </Text>

                {qrRequest?.note && (
                  <Text className="mt-2 text-gray-500">{qrRequest.note}</Text>
                )}
              </View>
            </ViewShot>

            <Pressable
              className="mt-8 rounded-2xl bg-black py-4"
              onPress={async () => {
                const uri = await qrRef.current.capture();

                await Sharing.shareAsync(uri);
              }}
            >
              <Text className="text-center font-semibold text-white">
                Share QR Code
              </Text>
            </Pressable>

            <Pressable
              className="mt-3 py-3"
              onPress={() => setQrVisible(false)}
            >
              <Text className="text-center text-gray-500">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
