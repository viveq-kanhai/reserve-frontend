import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, User, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

const BG = "#0B0D10";
const SURFACE = "#15181C";
const BORDER = "#22262B";
const ACCENT = "#B4DE00";
const TEXT_PRIMARY = "#EDEEF0";
const TEXT_SECONDARY = "#8B9098";
const TEXT_MUTED = "#54585F";
const ERROR = "#E5484D";

export default function PaymentRequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!user) return; // wait for auth to resolve before fetching
    loadRequest();
  }, [id, user]);

  async function loadRequest() {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get(`/payment-requests/${id}`);
      setPaymentRequest(res.data);
    } catch (e: any) {
      setError(
        e.response?.data?.message ?? "Couldn't load this payment request.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function approve() {
    try {
      setActing(true);

      await api.post(`/payment-requests/${id}/approve`);

      Alert.alert("Success", "Payment sent.");
      router.back();
    } catch (e: any) {
      Alert.alert(
        "Couldn't approve",
        e.response?.data?.message ?? "Something went wrong.",
      );
    } finally {
      setActing(false);
    }
  }

  async function reject() {
    try {
      setActing(true);

      await api.post(`/payment-requests/${id}/reject`);

      Alert.alert("Declined", "Payment request declined.");
      router.back();
    } catch (e: any) {
      Alert.alert(
        "Couldn't decline",
        e.response?.data?.message ?? "Something went wrong.",
      );
    } finally {
      setActing(false);
    }
  }

  // AuthContext itself is still figuring out if there's a valid session.
  if (authLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: BG }}
      >
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  // Not logged in. In normal operation AuthProvider's own redirect effect
  // sends the person to /(auth)/login before this ever renders — this is
  // just a safety fallback in case that timing ever changes.
  if (!user) {
    return (
      <View
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: BG }}
      >
        <Text
          className="text-lg font-semibold text-center"
          style={{ color: TEXT_PRIMARY }}
        >
          Log in to view this request
        </Text>
        <Pressable
          onPress={() => router.replace("/(auth)/login")}
          className="mt-6 rounded-2xl px-6 py-3"
          style={{ backgroundColor: ACCENT }}
        >
          <Text className="font-semibold" style={{ color: BG }}>
            Go to Login
          </Text>
        </Pressable>
      </View>
    );
  }

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

  if (error || !paymentRequest) {
    return (
      <View
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: BG }}
      >
        <Text className="text-center" style={{ color: TEXT_SECONDARY }}>
          {error ?? "This payment request couldn't be found."}
        </Text>
        <Pressable onPress={() => router.back()} className="mt-6">
          <Text style={{ color: ACCENT }}>Close</Text>
        </Pressable>
      </View>
    );
  }

  const isRequester = paymentRequest.requester_user_id === user.id;
  const isPending = paymentRequest.status === "pending";
  const requesterName = paymentRequest.requester
    ? `${paymentRequest.requester.first_name} ${paymentRequest.requester.last_name}`
    : "Unknown";

  return (
    <View
      className="flex-1 items-center justify-center px-8"
      style={{ backgroundColor: BG }}
    >
      <View className="w-full items-center mb-6">
        <View
          className="h-16 w-16 rounded-full items-center justify-center border"
          style={{ backgroundColor: SURFACE, borderColor: BORDER }}
        >
          <User size={26} color={TEXT_SECONDARY} strokeWidth={1.8} />
        </View>

        <Text
          className="mt-4 text-lg font-semibold"
          style={{ color: TEXT_PRIMARY }}
        >
          {requesterName}
        </Text>
        <Text className="mt-1" style={{ color: TEXT_SECONDARY }}>
          {paymentRequest.requester?.phone_number}
        </Text>
      </View>

      <View
        className="w-full rounded-2xl border p-5 mb-6"
        style={{ backgroundColor: SURFACE, borderColor: BORDER }}
      >
        <Text
          className="text-xs uppercase tracking-widest text-center"
          style={{ color: TEXT_SECONDARY }}
        >
          Requesting
        </Text>
        <Text
          className="mt-1 text-4xl font-bold text-center"
          style={{ color: TEXT_PRIMARY }}
        >
          ${paymentRequest.amount}
        </Text>

        {paymentRequest.note && (
          <Text className="mt-3 text-center" style={{ color: TEXT_SECONDARY }}>
            "{paymentRequest.note}"
          </Text>
        )}
      </View>

      {!isPending && (
        <Text className="text-center mb-4" style={{ color: TEXT_MUTED }}>
          This request is {paymentRequest.status}.
        </Text>
      )}

      {isRequester && isPending && (
        <Text className="text-center mb-4" style={{ color: TEXT_MUTED }}>
          Waiting for payment.
        </Text>
      )}

      {!isRequester && isPending && (
        <View className="w-full flex-row gap-3">
          <Pressable
            onPress={reject}
            disabled={acting}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border py-4"
            style={{ backgroundColor: SURFACE, borderColor: BORDER }}
          >
            <X size={18} color={ERROR} strokeWidth={2.5} />
            <Text className="font-semibold" style={{ color: ERROR }}>
              Decline
            </Text>
          </Pressable>

          <Pressable
            onPress={approve}
            disabled={acting}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-4"
            style={{ backgroundColor: acting ? `${ACCENT}80` : ACCENT }}
          >
            <Check size={18} color={BG} strokeWidth={2.5} />
            <Text className="font-semibold" style={{ color: BG }}>
              {acting ? "..." : "Approve"}
            </Text>
          </Pressable>
        </View>
      )}

      <Pressable onPress={() => router.back()} className="mt-6 items-center">
        <Text style={{ color: TEXT_SECONDARY }}>Close</Text>
      </Pressable>
    </View>
  );
}
