import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginInputSchema, type LoginInput } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { setStoredRefreshToken } from "@/lib/secure-store";

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const loginMutation = trpc.auth.login.useMutation();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginInputSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    try {
      const result = await loginMutation.mutateAsync(values);
      await setStoredRefreshToken(result.tokens.refreshToken);
      setSession(result.user, result.tokens.accessToken);
      router.replace("/(app)/home");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Giriş başarısız oldu");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Giriş Yap</Text>

      <Text style={styles.label}>E-posta</Text>
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextInput
            testID="login-email"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
      {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

      <Text style={styles.label}>Şifre</Text>
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextInput
            testID="login-password"
            style={styles.input}
            secureTextEntry
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
      {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

      {serverError && <Text style={styles.error}>{serverError}</Text>}

      <Pressable
        testID="login-submit"
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        disabled={isSubmitting}
        onPress={handleSubmit(onSubmit)}
      >
        <Text style={styles.buttonText}>{isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}</Text>
      </Pressable>

      <Link href="/(auth)/register" style={styles.link}>
        Hesabın yok mu? Kayıt ol
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 4 },
  title: { fontSize: 24, fontWeight: "600", marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "500", marginTop: 12 },
  input: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: { color: "#dc2626", fontSize: 13, marginTop: 4 },
  button: {
    marginTop: 24,
    backgroundColor: "#059669",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "600" },
  link: { marginTop: 16, textAlign: "center", color: "#047857" },
});
