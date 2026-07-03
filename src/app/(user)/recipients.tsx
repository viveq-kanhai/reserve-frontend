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

  function deleteRecipient(id: string) {
    Alert.alert("Remove recipient?", "", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.delete(`/recipients/${id}`);
          loadRecipients();
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-14">
        <Text className="text-3xl font-bold text-white">Recipients</Text>

        {/* ADD BUTTON */}
        <Pressable
          onPress={() => setModalVisible(true)}
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
            <View className="mb-3 flex-row items-center justify-between rounded-2xl bg-gray-50 p-4">
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

              <Pressable
                onPress={() => deleteRecipient(item.id)}
                className="h-10 w-10 items-center justify-center rounded-full bg-red-50"
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </Pressable>
            </View>
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
    </View>
  );
}
