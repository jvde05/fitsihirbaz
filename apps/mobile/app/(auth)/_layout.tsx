import { Redirect, Slot } from "expo-router";
import { useAuthStore } from "@/lib/auth-store";

export default function AuthLayout() {
  const status = useAuthStore((state) => state.status);

  if (status === "authenticated") {
    return <Redirect href="/(app)/home" />;
  }

  return <Slot />;
}
