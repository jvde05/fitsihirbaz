import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Providers } from "@/components/Providers";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Providers>
        <Slot />
        <StatusBar style="auto" />
      </Providers>
    </SafeAreaProvider>
  );
}
