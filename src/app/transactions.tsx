import { useRouter } from "expo-router";
import { Check, ChevronLeft, Search, User, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../services/api";

const SHEET_BG = "#101317";
const BG = "#0B0D10";
const SURFACE = "#15181C";
const BORDER = "#22262B";
const ACCENT = "#B4DE00";
const TEXT_PRIMARY = "#EDEEF0";
const TEXT_SECONDARY = "#8B9098";
const TEXT_MUTED = "#54585F";
const ERROR = "#E5484D";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "sent", label: "Sent" },
  { key: "received", label: "Received" },
  { key: "withdrawals", label: "Withdrawals" },
  { key: "requests", label: "Requests" },
];

function prettify(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getInitials(item: any, title: string) {
  const source =
    item.counterparty?.name?.trim() || item.counterparty?.phone_number || title;
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function getDateGroup(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return "Earlier";
}

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

    return {
      title,
      subtitle: new Date(item.created_at).toLocaleDateString(),
      settled: true,
      isOutgoing: item.direction === "sent",
    };
  }

  if (item._source === "withdrawal_request") {
    return {
      title: "Withdrawal",
      subtitle: prettify(item.status),
      settled: false,
      isOutgoing: true,
    };
  }

  const title = !item.direction
    ? "Open payment request"
    : item.direction === "sent"
      ? `Payment request from ${counterpartyLabel ?? "someone"}`
      : `You requested from ${counterpartyLabel ?? "someone"}`;

  return {
    title,
    subtitle: prettify(item.status),
    settled: false,
    isOutgoing: item.direction === "sent",
  };
}

export default function TransactionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailItem, setDetailItem] = useState<any>(null); // the raw row that was tapped
  const [detailRequest, setDetailRequest] = useState<any>(null); // fetched payment_request detail
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    loadPage(1, false, filter);
  }, [filter]);

  async function loadPage(
    pageToLoad: number,
    append: boolean,
    activeFilter: string,
  ) {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const res = await api.get(
        `/transactions?page=${pageToLoad}&filter=${activeFilter}`,
      );

      setTransactions((prev) =>
        append ? [...prev, ...res.data.data] : res.data.data,
      );
      setPage(res.data.current_page);
      setLastPage(res.data.last_page);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Couldn't load transactions.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function loadMore() {
    if (loadingMore || page >= lastPage) return;
    loadPage(page + 1, true, filter);
  }

  function selectFilter(key: string) {
    if (key === filter) return;
    setFilter(key);
    setPage(1);
  }

  function isRowTappable(item: any) {
    return (
      item._source === "payment_request" ||
      (item._source === "transaction" && item.type === "request_payment")
    );
  }

  async function openDetail(item: any) {
    if (!isRowTappable(item)) return;

    setDetailItem(item);
    setDetailVisible(true);
    setDetailError(null);

    if (item._source === "payment_request") {
      setDetailRequest(null);
      setDetailLoading(true);

      try {
        const res = await api.get(`/payment-requests/${item.id}`);
        setDetailRequest(res.data);
      } catch (e: any) {
        setDetailError(
          e.response?.data?.message ?? "Couldn't load this request.",
        );
      } finally {
        setDetailLoading(false);
      }
    }
  }

  function closeDetail() {
    setDetailVisible(false);
    setDetailItem(null);
    setDetailRequest(null);
    setDetailError(null);
  }

  async function cancelRequest() {
    if (!detailRequest) return;

    try {
      setActing(true);
      await api.post(`/payment-requests/${detailRequest.id}/cancel`);
      closeDetail();
      loadPage(1, false, filter);
    } catch (e: any) {
      setDetailError(
        e.response?.data?.message ?? "Couldn't cancel this request.",
      );
    } finally {
      setActing(false);
    }
  }

  async function approveRequest() {
    if (!detailRequest) return;

    try {
      setActing(true);
      await api.post(`/payment-requests/${detailRequest.id}/approve`);
      closeDetail();
      loadPage(1, false, filter);
    } catch (e: any) {
      setDetailError(
        e.response?.data?.message ?? "Couldn't approve this request.",
      );
    } finally {
      setActing(false);
    }
  }

  async function declineRequest() {
    if (!detailRequest) return;

    try {
      setActing(true);
      await api.post(`/payment-requests/${detailRequest.id}/reject`);
      closeDetail();
      loadPage(1, false, filter);
    } catch (e: any) {
      setDetailError(
        e.response?.data?.message ?? "Couldn't decline this request.",
      );
    } finally {
      setActing(false);
    }
  }

  // NOTE: this only searches whatever's already loaded on screen, not your
  // full history — a real backend search (matching counterparty names across
  // every page) would need the query restructured to join names in before
  // pagination. Ask if you want that built properly.
  const visibleTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;

    const q = searchQuery.trim().toLowerCase();

    return transactions.filter((item) => {
      const { title } = buildRowInfo(item);
      return title.toLowerCase().includes(q);
    });
  }, [transactions, searchQuery]);

  // Inserts date-header pseudo-rows into a flat array so a single FlatList
  // (still driving the existing onEndReached pagination) can render grouped
  // sections without switching to SectionList.
  const groupedData = useMemo(() => {
    const groups: Record<string, any[]> = {};
    const order = ["Today", "Yesterday", "Earlier"];

    for (const item of visibleTransactions) {
      const group = getDateGroup(item.created_at);
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    }

    const data: any[] = [];
    for (const label of order) {
      if (groups[label]?.length) {
        data.push({ _isHeader: true, label });
        data.push(...groups[label]);
      }
    }
    return data;
  }, [visibleTransactions]);

  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      {/* HEADER */}
      <View className="flex-row items-center px-6 pt-14 pb-4">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full border"
          style={{ backgroundColor: SURFACE, borderColor: BORDER }}
          hitSlop={8}
        >
          <ChevronLeft size={18} color={TEXT_PRIMARY} strokeWidth={2.2} />
        </Pressable>

        <Text
          className="ml-4 text-2xl font-bold"
          style={{ color: TEXT_PRIMARY }}
        >
          Transactions
        </Text>
      </View>

      {/* SEARCH — always visible */}
      <View className="px-6 pb-4">
        <View
          className="flex-row items-center gap-2.5 rounded-2xl border px-4"
          style={{ backgroundColor: SURFACE, borderColor: BORDER, height: 46 }}
        >
          <Search size={16} color={TEXT_MUTED} strokeWidth={2} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search transactions"
            placeholderTextColor={TEXT_MUTED}
            className="flex-1 text-[14px]"
            style={{ color: TEXT_PRIMARY }}
          />
        </View>
      </View>

      {/* FILTER CHIPS */}
      <View className="pb-2">
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(f) => f.key}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
          renderItem={({ item: f }) => {
            const active = f.key === filter;
            return (
              <Pressable
                onPress={() => selectFilter(f.key)}
                className="rounded-full border px-4 py-2"
                style={{
                  backgroundColor: active ? ACCENT : SURFACE,
                  borderColor: active ? ACCENT : BORDER,
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: active ? BG : TEXT_SECONDARY }}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={TEXT_SECONDARY} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center" style={{ color: TEXT_SECONDARY }}>
            {error}
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedData}
          keyExtractor={(item, index) =>
            item._isHeader
              ? `header-${item.label}-${index}`
              : `${item._source}-${item.id}-${index}`
          }
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          ListEmptyComponent={
            <View className="mt-24 items-center">
              <Text className="text-sm" style={{ color: TEXT_MUTED }}>
                {searchQuery ? "No matches" : "No transactions yet"}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator color={TEXT_SECONDARY} />
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            if (item._isHeader) {
              return (
                <Text
                  className="text-xs font-semibold uppercase tracking-wider mt-2 mb-1.5"
                  style={{ color: TEXT_MUTED }}
                >
                  {item.label}
                </Text>
              );
            }

            const { title, subtitle, settled, isOutgoing } = buildRowInfo(item);
            const initials = getInitials(item, title);

            // Received = accent green, sent = neutral light (not red) —
            // matches the reference design's convention rather than the
            // red/green scheme used elsewhere in the app so far.
            const amountColor = !settled
              ? TEXT_MUTED
              : isOutgoing
                ? TEXT_PRIMARY
                : ACCENT;

            const tappable = isRowTappable(item);

            return (
              <Pressable
                onPress={() => openDetail(item)}
                disabled={!tappable}
                className="flex-row items-center justify-between py-2.5"
              >
                <View className="flex-row items-center gap-3 flex-1 pr-3">
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
                    <Text className="text-xs" style={{ color: TEXT_SECONDARY }}>
                      {subtitle}
                    </Text>
                  </View>
                </View>

                <Text className="font-semibold" style={{ color: amountColor }}>
                  {settled ? (isOutgoing ? "-" : "+") : ""}${item.amount}
                </Text>
              </Pressable>
            );
          }}
        />
      )}

      {/* DETAIL MODAL */}
      <Modal visible={detailVisible} transparent animationType="slide">
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
            {detailItem?._source === "transaction" ? (
              // ---- Paid payment request: info only, no actions ----
              <>
                <View className="items-center mb-6">
                  <View
                    className="h-16 w-16 rounded-full items-center justify-center border"
                    style={{ backgroundColor: SURFACE, borderColor: BORDER }}
                  >
                    <Check size={26} color={ACCENT} strokeWidth={2.5} />
                  </View>

                  <Text
                    className="mt-4 text-lg font-semibold"
                    style={{ color: TEXT_PRIMARY }}
                  >
                    {detailItem.direction === "sent"
                      ? "Payment Sent"
                      : "Payment Received"}
                  </Text>

                  <Text className="mt-1" style={{ color: TEXT_SECONDARY }}>
                    {detailItem.direction === "sent"
                      ? `to ${detailItem.counterparty?.name?.trim() || detailItem.counterparty?.phone_number || "Unknown"}`
                      : `from ${detailItem.counterparty?.name?.trim() || detailItem.counterparty?.phone_number || "Unknown"}`}
                  </Text>
                </View>

                <View
                  className="rounded-2xl border p-5 mb-6"
                  style={{ backgroundColor: SURFACE, borderColor: BORDER }}
                >
                  <Text
                    className="text-xs uppercase tracking-widest text-center"
                    style={{ color: TEXT_SECONDARY }}
                  >
                    Amount
                  </Text>
                  <Text
                    className="mt-1 text-4xl font-bold text-center"
                    style={{ color: TEXT_PRIMARY }}
                  >
                    ${detailItem.amount}
                  </Text>

                  {detailItem.note && (
                    <Text
                      className="mt-3 text-center"
                      style={{ color: TEXT_SECONDARY }}
                    >
                      "{detailItem.note}"
                    </Text>
                  )}

                  <View
                    className="mt-4 pt-4"
                    style={{ borderTopWidth: 1, borderTopColor: BORDER }}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs" style={{ color: TEXT_MUTED }}>
                        Originated from
                      </Text>
                      <Text
                        className="text-xs font-medium"
                        style={{ color: TEXT_SECONDARY }}
                      >
                        Payment Request
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between mt-1.5">
                      <Text className="text-xs" style={{ color: TEXT_MUTED }}>
                        Date
                      </Text>
                      <Text
                        className="text-xs font-medium"
                        style={{ color: TEXT_SECONDARY }}
                      >
                        {new Date(detailItem.created_at).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>

                <Pressable onPress={closeDetail} className="items-center">
                  <Text style={{ color: TEXT_SECONDARY }}>Close</Text>
                </Pressable>
              </>
            ) : detailLoading ? (
              <View className="py-10 items-center">
                <ActivityIndicator color={ACCENT} />
              </View>
            ) : detailError && !detailRequest ? (
              <>
                <Text
                  className="text-center mb-6"
                  style={{ color: TEXT_SECONDARY }}
                >
                  {detailError}
                </Text>
                <Pressable onPress={closeDetail} className="items-center">
                  <Text style={{ color: TEXT_SECONDARY }}>Close</Text>
                </Pressable>
              </>
            ) : detailRequest ? (
              (() => {
                const isRequester = detailRequest.is_requester;
                const isPending = detailRequest.status === "pending";
                const counterparty = isRequester
                  ? detailRequest.requestedUser
                  : detailRequest.requester;
                const counterpartyLabel = counterparty
                  ? `${counterparty.first_name} ${counterparty.last_name}`
                  : "Anyone with the link";
                const qrValue = `kluis://payment-requests/${detailRequest.id}`;

                return (
                  <>
                    <View className="items-center mb-6">
                      <View
                        className="h-16 w-16 rounded-full items-center justify-center border"
                        style={{
                          backgroundColor: SURFACE,
                          borderColor: BORDER,
                        }}
                      >
                        <User
                          size={26}
                          color={TEXT_SECONDARY}
                          strokeWidth={1.8}
                        />
                      </View>

                      <Text
                        className="mt-4 text-lg font-semibold"
                        style={{ color: TEXT_PRIMARY }}
                      >
                        {isRequester
                          ? `Requested from ${counterpartyLabel}`
                          : `Requested by ${counterpartyLabel}`}
                      </Text>

                      <View
                        className="mt-2 rounded-full px-3 py-1"
                        style={{
                          backgroundColor: isPending
                            ? `${ACCENT}1A`
                            : `${TEXT_MUTED}1A`,
                        }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: isPending ? ACCENT : TEXT_MUTED }}
                        >
                          {detailRequest.status.charAt(0).toUpperCase() +
                            detailRequest.status.slice(1)}
                        </Text>
                      </View>
                    </View>

                    <View
                      className="rounded-2xl border p-5 mb-6"
                      style={{ backgroundColor: SURFACE, borderColor: BORDER }}
                    >
                      <Text
                        className="text-xs uppercase tracking-widest text-center"
                        style={{ color: TEXT_SECONDARY }}
                      >
                        Amount
                      </Text>
                      <Text
                        className="mt-1 text-4xl font-bold text-center"
                        style={{ color: TEXT_PRIMARY }}
                      >
                        ${detailRequest.amount}
                      </Text>

                      {detailRequest.note && (
                        <Text
                          className="mt-3 text-center"
                          style={{ color: TEXT_SECONDARY }}
                        >
                          "{detailRequest.note}"
                        </Text>
                      )}
                    </View>

                    {/* QR — only shown for your own still-pending request */}
                    {isRequester && isPending && (
                      <View
                        className="items-center rounded-3xl p-6 mb-6"
                        style={{ backgroundColor: "#FFFFFF" }}
                      >
                        <QRCode value={qrValue} size={180} />
                      </View>
                    )}

                    {detailError && (
                      <Text
                        className="text-center mb-4 text-sm"
                        style={{ color: ERROR }}
                      >
                        {detailError}
                      </Text>
                    )}

                    {/* Your own pending request — Cancel */}
                    {isRequester && isPending && (
                      <Pressable
                        onPress={cancelRequest}
                        disabled={acting}
                        className="items-center rounded-2xl py-4 mb-3"
                        style={{ backgroundColor: `${ERROR}1A` }}
                      >
                        <Text
                          className="font-semibold"
                          style={{ color: ERROR }}
                        >
                          {acting ? "Cancelling..." : "Cancel Request"}
                        </Text>
                      </Pressable>
                    )}

                    {/* A request aimed at you — Approve / Decline */}
                    {!isRequester && isPending && (
                      <View className="flex-row gap-3 mb-3">
                        <Pressable
                          onPress={declineRequest}
                          disabled={acting}
                          className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border py-4"
                          style={{
                            backgroundColor: SURFACE,
                            borderColor: BORDER,
                          }}
                        >
                          <X size={18} color={ERROR} strokeWidth={2.5} />
                          <Text
                            className="font-semibold"
                            style={{ color: ERROR }}
                          >
                            Decline
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={approveRequest}
                          disabled={acting}
                          className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-4"
                          style={{
                            backgroundColor: acting ? `${ACCENT}80` : ACCENT,
                          }}
                        >
                          <Check size={18} color={BG} strokeWidth={2.5} />
                          <Text className="font-semibold" style={{ color: BG }}>
                            {acting ? "..." : "Approve"}
                          </Text>
                        </Pressable>
                      </View>
                    )}

                    <Pressable
                      onPress={closeDetail}
                      className="items-center mt-2"
                    >
                      <Text style={{ color: TEXT_SECONDARY }}>Close</Text>
                    </Pressable>
                  </>
                );
              })()
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}
