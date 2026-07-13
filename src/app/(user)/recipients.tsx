import { Ionicons } from "@expo/vector-icons";
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
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-14">
        <Text className="text-3xl font-bold text-white">Recipients</Text>

        {/* ADD BUTTON */}
        <Pressable
          onPress={() => {
            setPhoneNumber("");
            setNickname("");
            setModalVisible(true);
          }}
          className="h-10 items-center justify-center rounded-full bg-white px-6"
        >
          <Text className="text-md font-semibold text-black">Add</Text>
        </Pressable>
      </View>

      <View className="flex-1" />

      {/* Bottom Sheet */}
      <View className="h-[72%] rounded-t-[32px] bg-white px-5 pt-6">
        <View className="mb-5 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-black">Your Recipients</Text>

          {/* SEARCH ICON MOVED HERE */}
          <Pressable className="h-9 w-9 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="search" size={18} color="black" />
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
              className="mb-3 flex-row items-center justify-between rounded-2xl bg-gray-50 p-4"
            >
              <View className="flex-row items-center">
                <Image
                  source={{
                    uri: item.recipient.pfp_path ?? "https://i.pravatar.cc/150",
                  }}
                  className="h-12 w-12 rounded-full"
                />

                <View className="ml-4">
                  <Text className="font-semibold text-black">
                    {item.nickname ||
                      `${item.recipient.first_name} ${item.recipient.last_name}`}
                  </Text>

                  <Text className="text-gray-500">
                    {item.recipient.phone_number}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View className="mt-24 items-center">
              <Ionicons name="people-outline" size={60} color="#9ca3af" />

              <Text className="mt-4 text-lg font-semibold text-gray-700">
                No recipients yet
              </Text>

              <Text className="mt-2 text-center text-gray-500">
                Add someone to send money faster.
              </Text>
            </View>
          }
        />
      </View>

      {/* Add Recipient Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-end bg-black/40">
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <View className="rounded-t-3xl bg-white px-6 pt-6 pb-10">
                <Text className="mb-5 text-xl font-bold">Add Recipient</Text>

                <TextInput
                  placeholder="Phone Number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  className="mb-4 rounded-xl border border-gray-200 px-4 py-4"
                />

                <TextInput
                  placeholder="Nickname (optional)"
                  value={nickname}
                  onChangeText={setNickname}
                  className="mb-6 rounded-xl border border-gray-200 px-4 py-4"
                />

                {/* ADD BUTTON */}
                <Pressable
                  onPress={addRecipient}
                  className="items-center rounded-2xl bg-black py-4"
                >
                  <Text className="font-semibold text-white">
                    Add Recipient
                  </Text>
                </Pressable>

                {/* CANCEL */}
                <Pressable
                  onPress={() => setModalVisible(false)}
                  className="mt-3 items-center py-4"
                >
                  <Text className="font-semibold text-gray-500">Cancel</Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={detailsVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-white p-6 pb-10">
            <Image
              source={{
                uri:
                  selectedRecipient?.recipient?.pfp_path ??
                  "https://i.pravatar.cc/150",
              }}
              className="mx-auto h-24 w-24 rounded-full"
            />

            <Text className="mt-4 text-center text-2xl font-bold">
              {selectedRecipient?.nickname ??
                `${selectedRecipient?.recipient?.first_name} ${selectedRecipient?.recipient?.last_name}`}
            </Text>

            <Text className="mt-1 text-center text-gray-500">
              {selectedRecipient?.recipient?.phone_number}
            </Text>

            <Pressable
              className="mt-8 items-center rounded-2xl bg-black py-4"
              onPress={() => {
                setDetailsVisible(false);

                setPhoneNumber(selectedRecipient.recipient.phone_number);
                setAmount("");

                setSendVisible(true);
              }}
            >
              <Text className="font-semibold text-white">Send Points</Text>
            </Pressable>

            <Pressable
              className="mt-3 items-center rounded-2xl border border-gray-300 py-4"
              onPress={() => {
                setDetailsVisible(false);
                setEditVisible(true);
              }}
            >
              <Text>Edit Recipient</Text>
            </Pressable>

            <Pressable
              className="mt-3 items-center rounded-2xl bg-red-50 py-4"
              onPress={confirmDelete}
            >
              <Text className="font-semibold text-red-500">
                Delete Recipient
              </Text>
            </Pressable>

            <Pressable
              className="mt-5 items-center"
              onPress={() => setDetailsVisible(false)}
            >
              <Text className="text-gray-500">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={editVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-white p-6 pb-10">
            <Text className="mb-5 text-2xl font-bold">Edit Recipient</Text>

            <TextInput
              value={editNickname}
              onChangeText={setEditNickname}
              placeholder="Nickname"
              className="mb-4 rounded-xl border border-gray-300 px-4 py-4"
            />

            <Pressable
              onPress={() => setFavorite(!favorite)}
              className="mb-6 flex-row items-center"
            >
              <Ionicons
                name={favorite ? "star" : "star-outline"}
                size={24}
                color="#FACC15"
              />

              <Text className="ml-3 text-lg">Favorite</Text>
            </Pressable>

            <Pressable
              onPress={updateRecipient}
              className="items-center rounded-2xl bg-black py-4"
            >
              <Text className="font-semibold text-white">Save Changes</Text>
            </Pressable>

            <Pressable
              onPress={() => setEditVisible(false)}
              className="mt-4 items-center"
            >
              <Text className="text-gray-500">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={sendVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-end bg-black/40">
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <View className="rounded-t-3xl bg-white px-6 pt-6 pb-10">
                <Text className="mb-6 text-2xl font-bold">Send Points</Text>

                <Text className="mb-2 text-gray-500">Recipient</Text>

                <TextInput
                  value={phoneNumber}
                  editable={false}
                  className="mb-4 rounded-xl border border-gray-200 bg-gray-100 px-4 py-4"
                />

                <TextInput
                  placeholder="Amount"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  className="mb-6 rounded-xl border border-gray-200 px-4 py-4"
                />

                <Pressable
                  disabled={!amount}
                  onPress={() => setConfirmVisible(true)}
                  className={`items-center rounded-2xl py-4 ${
                    amount ? "bg-black" : "bg-gray-300"
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
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={confirmVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="w-[88%] rounded-3xl bg-white p-6">
            <Text className="mb-6 text-center text-2xl font-bold">
              Confirm Transfer
            </Text>

            <Text className="text-gray-500">Recipient</Text>

            <Text className="mb-4 text-lg font-semibold">{phoneNumber}</Text>

            <Text className="text-gray-500">Amount</Text>

            <Text className="mb-6 text-3xl font-bold">${amount}</Text>

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
    </View>
  );
}
