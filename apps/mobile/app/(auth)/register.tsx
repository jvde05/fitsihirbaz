import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterInputSchema, type RegisterInput } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { setStoredRefreshToken } from "@/lib/secure-store";

export default function RegisterScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const registerMutation = trpc.auth.register.useMutation();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterInputSchema),
    defaultValues: { role: "CLIENT", firstName: "", lastName: "", email: "", password: "", phone: "" },
  });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    try {
      const result = await registerMutation.mutateAsync(values);
      await setStoredRefreshToken(result.tokens.refreshToken);
      setSession(result.user, result.tokens.accessToken);
      router.replace("/(app)/home");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Kayıt başarısız oldu");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Kayıt Ol</Text>

      <Text style={styles.label}>Hesap türü</Text>
      <Controller
        control={control}
        name="role"
        render={({ field }) => (
          <View style={styles.roleRow}>
            <Pressable
              testID="register-role-client"
              style={[styles.roleOption, field.value === "CLIENT" && styles.roleOptionSelected]}
              onPress={() => field.onChange("CLIENT")}
            >
              <Text style={field.value === "CLIENT" ? styles.roleTextSelected : styles.roleText}>Danışan</Text>
            </Pressable>
            <Pressable
              testID="register-role-dietitian"
              style={[styles.roleOption, field.value === "DIETITIAN" && styles.roleOptionSelected]}
              onPress={() => field.onChange("DIETITIAN")}
            >
              <Text style={field.value === "DIETITIAN" ? styles.roleTextSelected : styles.roleText}>Diyetisyen</Text>
            </Pressable>
          </View>
        )}
      />

      <Text style={styles.label}>Ad</Text>
      <Controller
        control={control}
        name="firstName"
        render={({ field }) => (
          <TextInput
            testID="register-firstName"
            style={styles.input}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
      {errors.firstName && <Text style={styles.error}>{errors.firstName.message}</Text>}

      <Text style={styles.label}>Soyad</Text>
      <Controller
        control={control}
        name="lastName"
        render={({ field }) => (
          <TextInput
            testID="register-lastName"
            style={styles.input}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
      {errors.lastName && <Text style={styles.error}>{errors.lastName.message}</Text>}

      <Text style={styles.label}>E-posta</Text>
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextInput
            testID="register-email"
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
            testID="register-password"
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
        testID="register-submit"
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        disabled={isSubmitting}
        onPress={handleSubmit(onSubmit)}
      >
        <Text style={styles.buttonText}>{isSubmitting ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}</Text>
      </Pressable>

      <Link href="/(auth)/login" style={styles.link}>
        Zaten hesabın var mı? Giriş yap
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 4 },
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
  roleRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  roleOption: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  roleOptionSelected: { backgroundColor: "#059669", borderColor: "#059669" },
  roleText: { color: "#374151" },
  roleTextSelected: { color: "#fff", fontWeight: "600" },
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
