import { ActivityIndicator, View } from "react-native";
import { Redirect, Slot } from "expo-router";
import { useAuthStore } from "@/lib/auth-store";
import { PushNotificationRegistrar } from "@/components/PushNotificationRegistrar";

export default function AppLayout() {
  const status = useAuthStore((state) => state.status);

  if (status === "idle" || status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (status !== "authenticated") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <PushNotificationRegistrar />
      <Slot />
    </>
  );
}
