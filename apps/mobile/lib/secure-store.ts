import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const REFRESH_TOKEN_KEY = "fitsihirbaz_refresh_token";

// expo-secure-store'un web karşılığı SDK 57'de boş bir stub (native Keychain/Keystore
// web'de yok); bu yüzden web'de localStorage'a düşüyoruz — sadece geliştirme/test
// amaçlı, gerçek iOS/Android build'lerinde SecureStore kullanılır.
export async function getStoredRefreshToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setStoredRefreshToken(refreshToken: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    return;
  }
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function clearStoredRefreshToken(): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.removeItem(REFRESH_TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
