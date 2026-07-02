import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { trpc } from "@/lib/trpc";

// Uygulama açıldığında (kullanıcı giriş yapmışsa) push izni ister, token alır ve
// backend'e kaydeder (MOBIL.md §5). Web önizlemesinde ve simülatörde expo-notifications
// gerçek bir push token üretemez — bu durumlarda sessizce hiçbir şey yapmaz.
export function PushNotificationRegistrar() {
  const attempted = useRef(false);
  const registerMutation = trpc.users.registerPushToken.useMutation();

  useEffect(() => {
    if (attempted.current || Platform.OS === "web" || !Device.isDevice) {
      return;
    }
    attempted.current = true;

    (async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") {
          return;
        }
        const { data: token } = await Notifications.getExpoPushTokenAsync();
        registerMutation.mutate({ token });
      } catch {
        // Push token alınamadı (örn. EAS proje yapılandırması eksik) — sessizce vazgeç,
        // uygulamanın geri kalanı push bildirimi olmadan da tam çalışır.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
