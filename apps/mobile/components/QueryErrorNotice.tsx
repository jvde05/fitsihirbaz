import { Pressable, StyleSheet, Text, View } from "react-native";

// Bir tRPC sorgusu hata verdiğinde tüm ekranlarda tutarlı gösterilen bildirim
// (web'deki QueryErrorNotice ile aynı amaç): sorgu hata durumuna geçtiğinde
// ekranın sessizce "Yükleniyor..." göstermeye devam etmesini önler.
export function QueryErrorNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Veriler yüklenemedi: {message}</Text>
      <Pressable testID="query-error-retry" onPress={onRetry}>
        <Text style={styles.retryText}>Tekrar dene</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  text: { color: "#b91c1c", fontSize: 13 },
  retryText: { color: "#b91c1c", fontSize: 13, fontWeight: "600", textDecorationLine: "underline" },
});
