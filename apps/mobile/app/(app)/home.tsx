import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { clearStoredRefreshToken } from "@/lib/secure-store";

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Danışan",
  DIETITIAN: "Diyetisyen",
  ADMIN: "Yönetici",
};

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const logoutMutation = trpc.auth.logout.useMutation();

  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      await clearStoredRefreshToken();
      clearSession();
      router.replace("/(auth)/login");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fit Sihirbaz</Text>
      {user && (
        <Text testID="home-greeting" style={styles.greeting}>
          Hoş geldin, {user.firstName} ({ROLE_LABELS[user.role] ?? user.role})
        </Text>
      )}
      <Pressable testID="logout-button" style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Çıkış Yap</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: "600" },
  greeting: { fontSize: 16, color: "#374151" },
  button: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: { color: "#374151", fontWeight: "500" },
});
