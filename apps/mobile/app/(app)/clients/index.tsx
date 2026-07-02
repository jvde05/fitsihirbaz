import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Link } from "expo-router";
import { trpc } from "@/lib/trpc";
import type { ClientSummary } from "@fit-sihirbaz/shared";

export default function ClientsScreen() {
  const [query, setQuery] = useState("");
  const clientsQuery = trpc.dietitians.getMyClients.useQuery();

  const clients = (clientsQuery.data ?? []).filter((client) => {
    if (!query.trim()) return true;
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    return fullName.includes(query.trim().toLowerCase()) || client.email.toLowerCase().includes(query.trim().toLowerCase());
  });

  return (
    <FlatList<ClientSummary>
      data={clients}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        !clientsQuery.isLoading ? <Text style={styles.emptyText}>Henüz danışanınız yok.</Text> : null
      }
      renderItem={({ item }) => (
        <Link href={`/(app)/clients/${item.id}`} testID={`client-card-${item.id}`} asChild>
          <Pressable style={styles.card}>
            <Text style={styles.cardName}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={styles.cardEmail}>{item.email}</Text>
          </Pressable>
        </Link>
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Danışanlarım</Text>
          <TextInput
            testID="client-search-input"
            style={styles.input}
            placeholder="İsim veya e-posta ara..."
            value={query}
            onChangeText={setQuery}
          />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 16 },
  header: { gap: 8, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  emptyText: { color: "#9ca3af", fontSize: 13 },
  card: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  cardName: { fontSize: 16, fontWeight: "600" },
  cardEmail: { fontSize: 13, color: "#6b7280", marginTop: 2 },
});
