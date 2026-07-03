import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Link } from "expo-router";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import type { DietitianPublicSummary } from "@fit-sihirbaz/shared";

export default function DietitiansScreen() {
  const [query, setQuery] = useState("");
  const searchQuery = trpc.dietitians.search.useQuery({ query: query || undefined, limit: 20 });

  return (
    <FlatList<DietitianPublicSummary>
      data={searchQuery.data?.items ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        !searchQuery.isLoading && !searchQuery.isError ? (
          <Text style={styles.emptyText}>Sonuç bulunamadı.</Text>
        ) : null
      }
      renderItem={({ item }) => (
        <Link href={`/(app)/dietitians/${item.id}`} testID={`dietitian-card-${item.id}`} asChild>
          <Pressable style={styles.card}>
            <Text style={styles.cardName}>
              {item.firstName} {item.lastName}
            </Text>
            {item.title && <Text style={styles.cardTitle}>{item.title}</Text>}
            {item.specialties.length > 0 && (
              <Text style={styles.cardSpecialties}>{item.specialties.join(", ")}</Text>
            )}
            {item.averageRating !== null && <Text style={styles.cardRating}>★ {item.averageRating.toFixed(1)}</Text>}
          </Pressable>
        </Link>
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Diyetisyenler</Text>
          {searchQuery.isError && (
            <QueryErrorNotice message={searchQuery.error.message} onRetry={() => searchQuery.refetch()} />
          )}
          <TextInput
            testID="dietitian-search-input"
            style={styles.input}
            placeholder="İsim veya uzmanlık ara..."
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
  cardTitle: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  cardSpecialties: { fontSize: 12, color: "#9ca3af", marginTop: 4 },
  cardRating: { fontSize: 13, color: "#374151", marginTop: 6 },
});
