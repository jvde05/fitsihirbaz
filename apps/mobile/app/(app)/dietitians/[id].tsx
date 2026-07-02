import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { trpc } from "@/lib/trpc";

export default function DietitianProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dietitianQuery = trpc.dietitians.getPublicProfile.useQuery({ id });
  const packagesQuery = trpc.packages.browse.useQuery({ dietitianId: id, limit: 50 });

  if (dietitianQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!dietitianQuery.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Diyetisyen bulunamadı.</Text>
      </View>
    );
  }

  const dietitian = dietitianQuery.data;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.name}>
        {dietitian.firstName} {dietitian.lastName}
      </Text>
      {dietitian.title && <Text style={styles.title}>{dietitian.title}</Text>}
      {dietitian.averageRating !== null && <Text style={styles.rating}>★ {dietitian.averageRating.toFixed(1)}</Text>}

      {dietitian.specialties.length > 0 && (
        <View style={styles.specialtyRow}>
          {dietitian.specialties.map((specialty) => (
            <View key={specialty} style={styles.specialtyChip}>
              <Text style={styles.specialtyChipText}>{specialty}</Text>
            </View>
          ))}
        </View>
      )}

      {dietitian.bio && <Text style={styles.bio}>{dietitian.bio}</Text>}

      <Text style={styles.sectionTitle}>Paketler</Text>
      {packagesQuery.data?.items.length === 0 && (
        <Text style={styles.emptyText}>Bu diyetisyenin şu anda aktif bir paketi yok.</Text>
      )}
      {packagesQuery.data?.items.map((pkg) => (
        <View key={pkg.id} style={styles.packageCard}>
          <View style={styles.packageHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.packageTitle}>{pkg.title}</Text>
              <Text style={styles.packageMeta}>
                {pkg.durationDays} gün{pkg.sessionCount ? ` · ${pkg.sessionCount} görüşme` : ""}
              </Text>
            </View>
            <Text style={styles.packagePrice}>
              {pkg.price} {pkg.currency}
            </Text>
          </View>
          {pkg.description && <Text style={styles.packageDescription}>{pkg.description}</Text>}
          <View style={styles.disabledButton}>
            <Text style={styles.disabledButtonText}>Satın Al (Çok Yakında)</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#9ca3af", fontSize: 13 },
  name: { fontSize: 22, fontWeight: "600" },
  title: { fontSize: 14, color: "#6b7280" },
  rating: { fontSize: 13, color: "#374151" },
  specialtyRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  specialtyChip: { backgroundColor: "#f3f4f6", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  specialtyChipText: { fontSize: 12, color: "#374151" },
  bio: { fontSize: 14, color: "#374151", marginTop: 12, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 20, marginBottom: 4 },
  packageCard: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 14, marginBottom: 10 },
  packageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  packageTitle: { fontSize: 15, fontWeight: "600" },
  packageMeta: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  packagePrice: { fontSize: 16, fontWeight: "600" },
  packageDescription: { fontSize: 13, color: "#6b7280", marginTop: 8 },
  disabledButton: {
    marginTop: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  disabledButtonText: { color: "#9ca3af", fontWeight: "500", fontSize: 13 },
});
