import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { clearStoredRefreshToken } from "@/lib/secure-store";

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Danışan",
  DIETITIAN: "Diyetisyen",
  ADMIN: "Yönetici",
};

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function nextUpcomingAppointment<T extends { scheduledAt: string; status: string }>(appointments: T[]): T | null {
  const now = Date.now();
  const upcoming = appointments
    .filter((a) => a.status === "SCHEDULED" && new Date(a.scheduledAt).getTime() >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  return upcoming[0] ?? null;
}

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const logoutMutation = trpc.auth.logout.useMutation();
  const isClient = user?.role === "CLIENT";
  const isDietitian = user?.role === "DIETITIAN";

  const plansQuery = trpc.dietPlans.list.useQuery({}, { enabled: isClient });
  const appointmentsQuery = trpc.appointments.listForClient.useQuery(undefined, { enabled: isClient });
  const clientsQuery = trpc.dietitians.getMyClients.useQuery(undefined, { enabled: isDietitian });
  const dietitianAppointmentsQuery = trpc.appointments.listForDietitian.useQuery(undefined, {
    enabled: isDietitian,
  });
  const notificationsQuery = trpc.notifications.list.useQuery();
  const unreadNotificationCount = notificationsQuery.data?.filter((n) => !n.isRead).length ?? 0;

  const todayAppointments = (dietitianAppointmentsQuery.data ?? []).filter((appointment) => {
    if (appointment.status !== "SCHEDULED") return false;
    const scheduledDate = new Date(appointment.scheduledAt);
    const now = new Date();
    return (
      scheduledDate.getFullYear() === now.getFullYear() &&
      scheduledDate.getMonth() === now.getMonth() &&
      scheduledDate.getDate() === now.getDate()
    );
  });

  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      await clearStoredRefreshToken();
      clearSession();
      router.replace("/(auth)/login");
    }
  }

  const activePlan = plansQuery.data?.[0];
  const upcomingAppointment = appointmentsQuery.data ? nextUpcomingAppointment(appointmentsQuery.data) : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Fit Sihirbaz</Text>
      {user && (
        <Text testID="home-greeting" style={styles.greeting}>
          Hoş geldin, {user.firstName} ({ROLE_LABELS[user.role] ?? user.role})
        </Text>
      )}

      <Link href="/(app)/akis" testID="view-feed-link" style={styles.link}>
        Akış →
      </Link>

      <Link href="/(app)/notifications" testID="view-notifications-link" style={styles.link}>
        Bildirimler{unreadNotificationCount > 0 ? ` (${unreadNotificationCount})` : ""} →
      </Link>

      {!isClient && !isDietitian && (
        <Text style={styles.notice}>Bu ekran şu an danışan ve diyetisyen hesapları için hazırlanmıştır.</Text>
      )}

      {isDietitian && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Danışan Sayısı</Text>
            {clientsQuery.isLoading && <ActivityIndicator />}
            {!clientsQuery.isLoading && (
              <Text style={styles.planName} testID="client-count">
                {clientsQuery.data?.length ?? 0}
              </Text>
            )}
            <Link href="/(app)/clients" testID="view-clients-link" style={styles.link}>
              Danışanlarım →
            </Link>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bugünkü Randevular</Text>
            {dietitianAppointmentsQuery.isLoading && <ActivityIndicator />}
            {!dietitianAppointmentsQuery.isLoading && todayAppointments.length === 0 && (
              <Text style={styles.emptyText}>Bugün için randevunuz yok.</Text>
            )}
            {todayAppointments.map((appointment) => (
              <Text key={appointment.id} style={styles.planMeta}>
                {appointment.counterpartFirstName} {appointment.counterpartLastName} —{" "}
                {formatDateTime(appointment.scheduledAt)}
              </Text>
            ))}
            <Link href="/(app)/appointments" testID="view-appointments-link" style={styles.link}>
              Randevu Takvimi →
            </Link>
          </View>

          <Link href="/(app)/orders" testID="view-orders-link" style={styles.link}>
            Siparişlerim / Kazancım →
          </Link>

          <Link href="/(app)/messages" testID="view-messages-link" style={styles.link}>
            Mesajlarım →
          </Link>

          <Link href="/(app)/profile" testID="view-profile-link" style={styles.link}>
            Profilim →
          </Link>
        </>
      )}

      {isClient && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Aktif Diyet Planı</Text>
            {plansQuery.isLoading && <ActivityIndicator />}
            {!plansQuery.isLoading && !activePlan && (
              <Text style={styles.emptyText}>Henüz bir diyet planınız bulunmuyor.</Text>
            )}
            {activePlan && (
              <>
                <Text style={styles.planName}>{activePlan.title}</Text>
                <Text style={styles.planMeta}>
                  Hedef: {activePlan.targetCalories ?? "-"} kcal · {activePlan.status}
                </Text>
                <Link href="/(app)/plan" testID="view-plan-link" style={styles.link}>
                  Planı Görüntüle →
                </Link>
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Yaklaşan Randevu</Text>
            {appointmentsQuery.isLoading && <ActivityIndicator />}
            {!appointmentsQuery.isLoading && !upcomingAppointment && (
              <Text style={styles.emptyText}>Yaklaşan randevunuz bulunmuyor.</Text>
            )}
            {upcomingAppointment && (
              <Text style={styles.planMeta} testID="upcoming-appointment">
                {upcomingAppointment.counterpartFirstName} {upcomingAppointment.counterpartLastName} —{" "}
                {formatDateTime(upcomingAppointment.scheduledAt)}
              </Text>
            )}
            <Link href="/(app)/appointments" testID="view-appointments-link" style={styles.link}>
              Randevularım →
            </Link>
          </View>

          <Link href="/(app)/progress" testID="view-progress-link" style={styles.link}>
            İlerlememi Görüntüle →
          </Link>

          <Link href="/(app)/messages" testID="view-messages-link" style={styles.link}>
            Mesajlarım →
          </Link>

          <Link href="/(app)/profile" testID="view-profile-link" style={styles.link}>
            Profilim →
          </Link>

          <Link href="/(app)/dietitians" testID="view-dietitians-link" style={styles.link}>
            Diyetisyenleri Keşfet →
          </Link>
        </>
      )}

      <Pressable testID="logout-button" style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Çıkış Yap</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: "600" },
  greeting: { fontSize: 16, color: "#374151" },
  notice: { fontSize: 13, color: "#9ca3af" },
  card: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 4 },
  cardTitle: { fontSize: 13, fontWeight: "600", color: "#6b7280", textTransform: "uppercase" },
  planName: { fontSize: 16, fontWeight: "500", marginTop: 4 },
  planMeta: { fontSize: 13, color: "#6b7280" },
  emptyText: { fontSize: 13, color: "#9ca3af" },
  link: { marginTop: 8, color: "#047857", fontWeight: "500" },
  button: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  buttonText: { color: "#374151", fontWeight: "500" },
});
