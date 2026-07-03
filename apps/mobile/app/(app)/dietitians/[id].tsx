import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";

export default function DietitianProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const utils = trpc.useUtils();
  const dietitianQuery = trpc.dietitians.getPublicProfile.useQuery({ id });
  const packagesQuery = trpc.packages.browse.useQuery({ dietitianId: id, limit: 50 });
  const reviewsQuery = trpc.reviews.listForDietitian.useQuery({ dietitianId: id });
  const ordersQuery = trpc.orders.listForClient.useQuery();
  const canReview = (ordersQuery.data ?? []).some((order) => order.dietitianId === id && order.status === "PAID");

  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const createOrderMutation = trpc.orders.create.useMutation({ onError: (err) => setPurchaseError(err.message) });
  const initiatePaymentMutation = trpc.payments.initiate.useMutation({ onError: (err) => setPurchaseError(err.message) });

  async function handlePurchase(packageId: string) {
    setPurchaseError(null);
    try {
      const order = await createOrderMutation.mutateAsync({ packageId });
      const { checkoutUrl } = await initiatePaymentMutation.mutateAsync({ orderId: order.id });
      await Linking.openURL(checkoutUrl);
    } catch {
      // Hata mesajı zaten onError ile state'e yazıldı.
    }
  }

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const createReviewMutation = trpc.reviews.create.useMutation({
    onSuccess: () => {
      setReviewError(null);
      setComment("");
      utils.reviews.listForDietitian.invalidate({ dietitianId: id });
      utils.dietitians.getPublicProfile.invalidate({ id });
    },
    onError: (err) => setReviewError(err.message),
  });

  if (dietitianQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (dietitianQuery.isError) {
    return (
      <View style={styles.center}>
        <QueryErrorNotice message={dietitianQuery.error.message} onRetry={() => dietitianQuery.refetch()} />
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
  const isPurchasing = createOrderMutation.isLoading || initiatePaymentMutation.isLoading;

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
          <Pressable
            testID={`buy-package-${pkg.id}`}
            style={styles.buyButton}
            disabled={isPurchasing}
            onPress={() => handlePurchase(pkg.id)}
          >
            <Text style={styles.buyButtonText}>{isPurchasing ? "Yönlendiriliyor..." : "Satın Al"}</Text>
          </Pressable>
        </View>
      ))}
      {purchaseError && <Text style={styles.errorText}>{purchaseError}</Text>}

      <Text style={styles.sectionTitle}>Yorumlar</Text>

      {canReview && (
        <View style={styles.reviewForm}>
          <Text style={styles.formLabel}>Puan</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} testID={`rating-${value}`} onPress={() => setRating(value)}>
                <Text style={styles.ratingStar}>{value <= rating ? "★" : "☆"}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.formLabel}>Yorum (opsiyonel)</Text>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            multiline
            placeholder="Deneyiminizi paylaşın"
          />
          {reviewError && <Text style={styles.errorText}>{reviewError}</Text>}
          <Pressable
            testID="submit-review"
            style={styles.buyButton}
            disabled={createReviewMutation.isLoading}
            onPress={() => createReviewMutation.mutate({ dietitianId: id, rating, comment: comment || undefined })}
          >
            <Text style={styles.buyButtonText}>
              {createReviewMutation.isLoading ? "Gönderiliyor..." : "Yorumu Gönder"}
            </Text>
          </Pressable>
        </View>
      )}

      {reviewsQuery.data?.length === 0 && <Text style={styles.emptyText}>Henüz yorum yapılmamış.</Text>}
      {reviewsQuery.data?.map((review) => (
        <View key={review.id} style={styles.reviewCard}>
          <Text style={styles.reviewHeader}>
            {"★".repeat(review.rating)}
            {"☆".repeat(5 - review.rating)} {review.clientFirstName} {review.clientLastName}
          </Text>
          {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#9ca3af", fontSize: 13 },
  errorText: { color: "#dc2626", fontSize: 13 },
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
  buyButton: {
    marginTop: 10,
    backgroundColor: "#16a34a",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  buyButtonText: { color: "#ffffff", fontWeight: "500", fontSize: 13 },
  reviewForm: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 14, marginBottom: 12, gap: 6 },
  formLabel: { fontSize: 13, fontWeight: "500", color: "#374151" },
  ratingRow: { flexDirection: "row", gap: 4 },
  ratingStar: { fontSize: 22, color: "#f59e0b" },
  commentInput: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 8, minHeight: 60, fontSize: 13 },
  reviewCard: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 12, marginBottom: 8 },
  reviewHeader: { fontSize: 13, fontWeight: "500" },
  reviewComment: { fontSize: 13, color: "#6b7280", marginTop: 4 },
});
