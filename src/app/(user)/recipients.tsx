import {
  ArrowUpRight,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
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

// ---- Reusable modal input, kept local to this file ----
function ModalField({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  editable = true,
}: {
  value: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "decimal-pad";
  editable?: boolean;
}) {
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={TEXT_MUTED}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType ?? "default"}
      editable={editable}
      className="mb-4 rounded-2xl border px-4 py-4 text-[15px]"
      style={{
        backgroundColor: editable ? SURFACE : "#0F1215",
        borderColor: BORDER,
        color: editable ? TEXT_PRIMARY : TEXT_SECONDARY,
      }}
    />
  );
}

export default function Recipients() {
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nickname, setNickname] = useState("");

  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [favorite, setFavorite] = useState(false);

  const [sendVisible, setSendVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [sending, setSending] = useState(false);

  async function loadRecipients() {
    try {
      setLoading(true);

      const res = await api.get("/recipients");
      setRecipients(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecipients();
  }, []);

  async function addRecipient() {
    try {
      await api.post("/recipients", {
        phone_number: phoneNumber,
        nickname,
      });

      setModalVisible(false);
      setPhoneNumber("");
      setNickname("");

      loadRecipients();
    } catch (e: any) {
      Alert.alert(
        "Error",
        e.response?.data?.message ?? "Something went wrong.",
      );
    }
  }

  async function confirmDelete() {
    Alert.alert("Delete recipient?", "You can always add them again later.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.delete(`/recipients/${selectedRecipient.id}`);

          setDetailsVisible(false);

          loadRecipients();
        },
      },
    ]);
  }

  async function updateRecipient() {
    try {
      await api.put(`/recipients/${selectedRecipient.id}`, {
        nickname: editNickname,
        is_favorite: favorite,
      });

      setEditVisible(false);
      setDetailsVisible(false);

      loadRecipients();
    } catch (e) {
      Alert.alert("Couldn't update recipient.");
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

      setAmount("");
      setPhoneNumber("");
    } catch (e: any) {
      Alert.alert(
        "Transfer failed",
        e.response?.data?.message ?? "Something went wrong.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-14">
        <Text className="text-3xl font-bold" style={{ color: TEXT_PRIMARY }}>
          Recipients
        </Text>

        {/* ADD BUTTON */}
        <Pressable
          onPress={() => {
            setPhoneNumber("");
            setNickname("");
            setModalVisible(true);
          }}
          className="h-10 flex-row items-center gap-1.5 rounded-full px-5"
          style={{ backgroundColor: ACCENT }}
        >
          <Plus size={16} color={BG} strokeWidth={2.5} />
          <Text className="text-[14px] font-semibold" style={{ color: BG }}>
            Add
          </Text>
        </Pressable>
      </View>

      <View className="flex-1" />

      {/* Bottom Sheet */}
      <View
        className="h-[72%] rounded-t-[32px] border-t px-5 pt-6"
        style={{ backgroundColor: SHEET_BG, borderColor: BORDER }}
      >
        <View className="mb-5 flex-row items-center justify-between">
          <Text className="text-xl font-bold" style={{ color: TEXT_PRIMARY }}>
            Your Recipients
          </Text>

          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full border"
            style={{ backgroundColor: SURFACE, borderColor: BORDER }}
          >
            <Search size={16} color={TEXT_PRIMARY} strokeWidth={2} />
          </Pressable>
        </View>

        <FlatList
          data={recipients}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={loadRecipients}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setSelectedRecipient(item);
                setEditNickname(item.nickname ?? "");
                setFavorite(item.is_favorite);
                setDetailsVisible(true);
              }}
              className="mb-3 flex-row items-center justify-between rounded-2xl border p-4"
              style={{ backgroundColor: SURFACE, borderColor: BORDER }}
            >
              <View className="flex-row items-center">
                <Image
                  source={{
                    uri: item.recipient.pfp_path ?? "https://i.pravatar.cc/150",
                  }}
                  className="h-12 w-12 rounded-full border"
                  style={{ borderColor: BORDER }}
                />

                <View className="ml-4">
                  <Text
                    className="font-semibold"
                    style={{ color: TEXT_PRIMARY }}
                  >
                    {item.nickname ||
                      `${item.recipient.first_name} ${item.recipient.last_name}`}
                  </Text>

                  <Text style={{ color: TEXT_SECONDARY }}>
                    {item.recipient.phone_number}
                  </Text>
                </View>
              </View>

              {item.is_favorite && (
                <Star size={16} color={ACCENT} fill={ACCENT} strokeWidth={0} />
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            <View className="mt-24 items-center">
              <Users size={48} color={TEXT_MUTED} strokeWidth={1.5} />

              <Text
                className="mt-4 text-lg font-semibold"
                style={{ color: TEXT_PRIMARY }}
              >
                No recipients yet
              </Text>

              <Text
                className="mt-2 text-center"
                style={{ color: TEXT_SECONDARY }}
              >
                Add someone to send money faster.
              </Text>
            </View>
          }
        />
      </View>

      {/* Add Recipient Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            className="flex-1 justify-end"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <View
                className="rounded-t-3xl border-t px-6 pt-6 pb-10"
                style={{ backgroundColor: SHEET_BG, borderColor: BORDER }}
              >
                <Text
                  className="mb-5 text-xl font-bold"
                  style={{ color: TEXT_PRIMARY }}
                >
                  Add Recipient
                </Text>

                <ModalField
                  placeholder="Phone Number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />

                <ModalField
                  placeholder="Nickname (optional)"
                  value={nickname}
                  onChangeText={setNickname}
                />

                {/* ADD BUTTON */}
                <Pressable
                  onPress={addRecipient}
                  className="items-center rounded-2xl py-4"
                  style={{ backgroundColor: ACCENT }}
                >
                  <Text className="font-semibold" style={{ color: BG }}>
                    Add Recipient
                  </Text>
                </Pressable>

                {/* CANCEL */}
                <Pressable
                  onPress={() => setModalVisible(false)}
                  className="mt-3 items-center py-4"
                >
                  <Text
                    className="font-semibold"
                    style={{ color: TEXT_SECONDARY }}
                  >
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* DETAILS MODAL */}
      <Modal visible={detailsVisible} animationType="slide" transparent>
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <View
            className="rounded-t-3xl border-t p-6 pb-10"
            style={{ backgroundColor: SHEET_BG, borderColor: BORDER }}
          >
            <Image
              source={{
                uri:
                  selectedRecipient?.recipient?.pfp_path ??
                  "https://i.pravatar.cc/150",
              }}
              className="mx-auto h-24 w-24 rounded-full border"
              style={{ borderColor: BORDER }}
            />

            <Text
              className="mt-4 text-center text-2xl font-bold"
              style={{ color: TEXT_PRIMARY }}
            >
              {selectedRecipient?.nickname ??
                `${selectedRecipient?.recipient?.first_name} ${selectedRecipient?.recipient?.last_name}`}
            </Text>

            <Text
              className="mt-1 text-center"
              style={{ color: TEXT_SECONDARY }}
            >
              {selectedRecipient?.recipient?.phone_number}
            </Text>

            <Pressable
              className="mt-8 flex-row items-center justify-center gap-2 rounded-2xl py-4"
              style={{ backgroundColor: ACCENT }}
              onPress={() => {
                setDetailsVisible(false);

                setPhoneNumber(selectedRecipient.recipient.phone_number);
                setAmount("");

                setSendVisible(true);
              }}
            >
              <ArrowUpRight size={16} color={BG} strokeWidth={2.5} />
              <Text className="font-semibold" style={{ color: BG }}>
                Send Points
              </Text>
            </Pressable>

            <Pressable
              className="mt-3 flex-row items-center justify-center gap-2 rounded-2xl border py-4"
              style={{ backgroundColor: SURFACE, borderColor: BORDER }}
              onPress={() => {
                setDetailsVisible(false);
                setEditVisible(true);
              }}
            >
              <Pencil size={15} color={TEXT_PRIMARY} strokeWidth={2} />
              <Text style={{ color: TEXT_PRIMARY }}>Edit Recipient</Text>
            </Pressable>

            <Pressable
              className="mt-3 flex-row items-center justify-center gap-2 rounded-2xl py-4"
              style={{ backgroundColor: "#2A1416" }}
              onPress={confirmDelete}
            >
              <Trash2 size={15} color={ERROR} strokeWidth={2} />
              <Text className="font-semibold" style={{ color: ERROR }}>
                Delete Recipient
              </Text>
            </Pressable>

            <Pressable
              className="mt-5 items-center"
              onPress={() => setDetailsVisible(false)}
            >
              <Text style={{ color: TEXT_SECONDARY }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <View
            className="rounded-t-3xl border-t p-6 pb-10"
            style={{ backgroundColor: SHEET_BG, borderColor: BORDER }}
          >
            <Text
              className="mb-5 text-2xl font-bold"
              style={{ color: TEXT_PRIMARY }}
            >
              Edit Recipient
            </Text>

            <ModalField
              value={editNickname}
              onChangeText={setEditNickname}
              placeholder="Nickname"
            />

            <Pressable
              onPress={() => setFavorite(!favorite)}
              className="mb-6 flex-row items-center"
            >
              <Star
                size={22}
                color={favorite ? ACCENT : TEXT_MUTED}
                fill={favorite ? ACCENT : "transparent"}
                strokeWidth={1.5}
              />

              <Text className="ml-3 text-lg" style={{ color: TEXT_PRIMARY }}>
                Favorite
              </Text>
            </Pressable>

            <Pressable
              onPress={updateRecipient}
              className="items-center rounded-2xl py-4"
              style={{ backgroundColor: ACCENT }}
            >
              <Text className="font-semibold" style={{ color: BG }}>
                Save Changes
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setEditVisible(false)}
              className="mt-4 items-center"
            >
              <Text style={{ color: TEXT_SECONDARY }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* SEND MODAL */}
      <Modal visible={sendVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            className="flex-1 justify-end"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <View
                className="rounded-t-3xl border-t px-6 pt-6 pb-10"
                style={{ backgroundColor: SHEET_BG, borderColor: BORDER }}
              >
                <Text
                  className="mb-6 text-2xl font-bold"
                  style={{ color: TEXT_PRIMARY }}
                >
                  Send Points
                </Text>

                <Text className="mb-2" style={{ color: TEXT_SECONDARY }}>
                  Recipient
                </Text>

                <ModalField value={phoneNumber} editable={false} />

                <ModalField
                  placeholder="Amount"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />

                <Pressable
                  disabled={!amount}
                  onPress={() => setConfirmVisible(true)}
                  className="items-center rounded-2xl py-4"
                  style={{ backgroundColor: amount ? ACCENT : BORDER }}
                >
                  <Text
                    className="font-semibold"
                    style={{ color: amount ? BG : TEXT_MUTED }}
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
          </View>
        </TouchableWithoutFeedback>
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
    </View>
  );
}
