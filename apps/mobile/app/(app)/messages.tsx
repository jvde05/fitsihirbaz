import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { trpc } from "@/lib/trpc";
import type { Conversation, Message } from "@fit-sihirbaz/shared";

const POLL_INTERVAL_MS = 5000;

function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: Conversation;
  onPress: () => void;
}) {
  return (
    <Pressable testID={`conversation-${conversation.id}`} style={styles.conversationRow} onPress={onPress}>
      <Text style={styles.conversationName}>
        {conversation.counterpartFirstName} {conversation.counterpartLastName}
      </Text>
      {conversation.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{conversation.unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

function MessageThread({ conversationId, onBack }: { conversationId: string; onBack: () => void }) {
  const utils = trpc.useUtils();
  const [draft, setDraft] = useState("");
  const messagesQuery = trpc.messages.listMessages.useQuery(
    { conversationId },
    { refetchInterval: POLL_INTERVAL_MS },
  );
  const sendMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      setDraft("");
      utils.messages.listMessages.invalidate({ conversationId });
      utils.messages.listConversations.invalidate();
    },
  });

  function handleSend() {
    if (!draft.trim()) return;
    sendMutation.mutate({ conversationId, content: draft.trim() });
  }

  return (
    <View style={styles.threadContainer}>
      <Pressable testID="back-to-conversations" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Sohbetler</Text>
      </Pressable>
      <FlatList<Message>
        data={messagesQuery.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.threadContent}
        renderItem={({ item }) => (
          <View style={styles.messageBubble}>
            <Text style={styles.messageText}>{item.content}</Text>
          </View>
        )}
      />
      <View style={styles.composer}>
        <TextInput
          testID="message-input"
          style={styles.composerInput}
          placeholder="Mesaj yazın..."
          value={draft}
          onChangeText={setDraft}
        />
        <Pressable testID="send-message-button" style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Gönder</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function MessagesScreen() {
  const utils = trpc.useUtils();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const dietitiansQuery = trpc.clients.getMyDietitians.useQuery();
  const conversationsQuery = trpc.messages.listConversations.useQuery(undefined, {
    refetchInterval: POLL_INTERVAL_MS,
  });

  const startConversationMutation = trpc.messages.getOrCreateConversation.useMutation({
    onSuccess: (conversation) => {
      setConversationId(conversation.id);
      utils.messages.listConversations.invalidate();
    },
  });

  if (conversationId) {
    return <MessageThread conversationId={conversationId} onBack={() => setConversationId(null)} />;
  }

  const dietitians = dietitiansQuery.data ?? [];
  const conversations = conversationsQuery.data ?? [];

  return (
    <FlatList<Conversation>
      data={conversations}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={<Text style={styles.emptyText}>Henüz bir sohbetiniz yok.</Text>}
      renderItem={({ item }) => (
        <ConversationRow conversation={item} onPress={() => setConversationId(item.id)} />
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Mesajlar</Text>
          {dietitians.length > 0 && (
            <View style={styles.startSection}>
              <Text style={styles.label}>Sohbet Başlat</Text>
              {dietitians.map((dietitian) => (
                <Pressable
                  key={dietitian.id}
                  testID={`start-conversation-${dietitian.id}`}
                  style={styles.startButton}
                  onPress={() => startConversationMutation.mutate({ counterpartId: dietitian.id })}
                >
                  <Text style={styles.startButtonText}>
                    {dietitian.firstName} {dietitian.lastName}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          <Text style={styles.label}>Sohbetler</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 16 },
  header: { gap: 8, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "500", color: "#6b7280", marginTop: 8 },
  startSection: { gap: 6 },
  startButton: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  startButtonText: { fontSize: 13, color: "#374151" },
  emptyText: { color: "#9ca3af", fontSize: 13 },
  conversationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  conversationName: { fontSize: 14, color: "#111827" },
  unreadBadge: { backgroundColor: "#059669", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  unreadBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  threadContainer: { flex: 1 },
  backButton: { padding: 16, paddingBottom: 8 },
  backButtonText: { color: "#047857", fontWeight: "500" },
  threadContent: { paddingHorizontal: 16, gap: 8 },
  messageBubble: { backgroundColor: "#f9fafb", borderRadius: 8, padding: 10 },
  messageText: { fontSize: 14, color: "#111827" },
  composer: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  composerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: "#059669",
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  sendButtonText: { color: "#fff", fontWeight: "600" },
});
