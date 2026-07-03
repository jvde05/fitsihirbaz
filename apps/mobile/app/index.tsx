import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuthStore } from "@/lib/auth-store";
import { hasSeenOnboarding } from "@/lib/secure-store";

export default function Index() {
  const status = useAuthStore((state) => state.status);
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);

  useEffect(() => {
    if (status !== "unauthenticated") return;
    hasSeenOnboarding().then(setOnboardingSeen);
  }, [status]);

  if (status === "idle" || status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (status === "authenticated") {
    return <Redirect href="/(app)/home" />;
  }

  if (onboardingSeen === null) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={onboardingSeen ? "/(auth)/login" : "/onboarding"} />;
}
