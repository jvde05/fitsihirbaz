import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { setSeenOnboarding } from "@/lib/secure-store";

const HIGHLIGHTS = [
  {
    title: "Kişiye Özel Diyet Planı",
    description: "Diyetisyeninizin oluşturduğu günlük öğün planını, kalori ve makro dağılımıyla birlikte görün.",
  },
  {
    title: "Diyetisyen Bul, Bağlan",
    description: "Uzmanlık alanına ve puanına göre diyetisyen keşfedin, paket satın alarak danışanı olun.",
  },
  {
    title: "İlerlemenizi Takip Edin",
    description: "Kilo, ölçü ve fotoğraflarınızı kaydedin; diyetisyeniniz sizinle otomatik olarak paylaşılan verileri görsün.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();

  async function goTo(path: "/(auth)/login" | "/(auth)/register") {
    await setSeenOnboarding();
    router.replace(path);
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.appName}>Fit Sihirbaz</Text>
        <Text style={styles.tagline}>Diyetisyeninizle aranızdaki dijital köprü</Text>

        <View style={styles.highlights}>
          {HIGHLIGHTS.map((item) => (
            <View key={item.title} style={styles.highlightCard}>
              <Text style={styles.highlightTitle}>{item.title}</Text>
              <Text style={styles.highlightDescription}>{item.description}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable testID="onboarding-register" style={styles.primaryButton} onPress={() => goTo("/(auth)/register")}>
          <Text style={styles.primaryButtonText}>Hemen Başla</Text>
        </Pressable>
        <Pressable testID="onboarding-login" style={styles.secondaryButton} onPress={() => goTo("/(auth)/login")}>
          <Text style={styles.secondaryButtonText}>Zaten hesabım var, giriş yap</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between", padding: 24, paddingTop: 64, paddingBottom: 32 },
  content: { gap: 24 },
  appName: { fontSize: 30, fontWeight: "700", color: "#059669" },
  tagline: { fontSize: 15, color: "#6b7280", marginTop: 4 },
  highlights: { gap: 16, marginTop: 12 },
  highlightCard: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 16 },
  highlightTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  highlightDescription: { fontSize: 13, color: "#6b7280", marginTop: 4, lineHeight: 18 },
  actions: { gap: 10 },
  primaryButton: { backgroundColor: "#059669", borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  secondaryButton: { paddingVertical: 10, alignItems: "center" },
  secondaryButtonText: { color: "#047857", fontWeight: "500", fontSize: 14 },
});
