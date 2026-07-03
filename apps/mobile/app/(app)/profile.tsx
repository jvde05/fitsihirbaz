import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ActivityLevelSchema,
  GenderSchema,
  GoalSchema,
  UpdateClientProfileInputSchema,
  UpdateDietitianProfileInputSchema,
  UpdateProfileInputSchema,
  type ActivityLevel,
  type Gender,
  type Goal,
  type UpdateClientProfileInput,
  type UpdateDietitianProfileInput,
  type UpdateProfileInput,
} from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { AvatarUploader } from "@/components/AvatarUploader";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";

const GENDER_LABELS: Record<Gender, string> = { MALE: "Erkek", FEMALE: "Kadın", OTHER: "Diğer" };
const GOAL_LABELS: Record<Goal, string> = {
  WEIGHT_LOSS: "Kilo Verme",
  WEIGHT_GAIN: "Kilo Alma",
  MAINTENANCE: "Koruma",
  MUSCLE_GAIN: "Kas Kazanma",
  MEDICAL: "Tıbbi",
};
const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  SEDENTARY: "Hareketsiz",
  LIGHT: "Hafif",
  MODERATE: "Orta",
  ACTIVE: "Aktif",
  VERY_ACTIVE: "Çok Aktif",
};

function ChipSelect<T extends string>({
  value,
  options,
  labels,
  onChange,
  testIdPrefix,
}: {
  value: T | undefined;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
  testIdPrefix: string;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => (
        <Pressable
          key={option}
          testID={`${testIdPrefix}-${option}`}
          style={[styles.chip, value === option && styles.chipSelected]}
          onPress={() => onChange(option)}
        >
          <Text style={value === option ? styles.chipTextSelected : styles.chipText}>{labels[option]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function PersonalInfoCard({
  firstName,
  lastName,
  phone,
  avatarUrl,
}: {
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
}) {
  const utils = trpc.useUtils();
  const [saved, setSaved] = useState(false);

  function invalidateProfile() {
    utils.clients.getProfile.invalidate();
    utils.dietitians.getProfile.invalidate();
  }

  const updateUserMutation = trpc.users.updateProfile.useMutation({
    onSuccess: invalidateProfile,
  });

  const userForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileInputSchema),
    defaultValues: { firstName, lastName, phone: phone ?? "" },
  });

  useEffect(() => {
    userForm.reset({ firstName, lastName, phone: phone ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName, lastName, phone]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Kişisel Bilgiler</Text>

      <AvatarUploader avatarUrl={avatarUrl} onUpdated={invalidateProfile} />

      <Text style={styles.label}>Ad</Text>
      <Controller
        control={userForm.control}
        name="firstName"
        render={({ field }) => (
          <TextInput
            testID="profile-firstName"
            style={styles.input}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      <Text style={styles.label}>Soyad</Text>
      <Controller
        control={userForm.control}
        name="lastName"
        render={({ field }) => (
          <TextInput
            testID="profile-lastName"
            style={styles.input}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      <Text style={styles.label}>Telefon</Text>
      <Controller
        control={userForm.control}
        name="phone"
        render={({ field }) => (
          <TextInput
            testID="profile-phone"
            style={styles.input}
            keyboardType="phone-pad"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      {saved && <Text style={styles.savedText}>Kaydedildi.</Text>}
      <Pressable
        testID="save-personal-info"
        style={styles.button}
        onPress={userForm.handleSubmit((values) => {
          updateUserMutation.mutate(values);
          setSaved(true);
        })}
      >
        <Text style={styles.buttonText}>Kaydet</Text>
      </Pressable>
    </View>
  );
}

function ClientProfileScreen() {
  const utils = trpc.useUtils();
  const profileQuery = trpc.clients.getProfile.useQuery();

  const updateClientMutation = trpc.clients.updateProfile.useMutation({
    onSuccess: () => utils.clients.getProfile.invalidate(),
  });

  const clientForm = useForm<UpdateClientProfileInput>({
    resolver: zodResolver(UpdateClientProfileInputSchema),
    defaultValues: { birthDate: "", medicalNotes: "" },
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    clientForm.reset({
      birthDate: profileQuery.data.birthDate ?? "",
      gender: profileQuery.data.gender ?? undefined,
      heightCm: profileQuery.data.heightCm ?? undefined,
      goal: profileQuery.data.goal ?? undefined,
      activityLevel: profileQuery.data.activityLevel ?? undefined,
      medicalNotes: profileQuery.data.medicalNotes ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileQuery.data]);

  const [savedClient, setSavedClient] = useState(false);

  if (profileQuery.isError) {
    return (
      <View style={styles.center}>
        <QueryErrorNotice message={profileQuery.error.message} onRetry={() => profileQuery.refetch()} />
      </View>
    );
  }

  if (profileQuery.isLoading || !profileQuery.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profilim</Text>

      <PersonalInfoCard
        firstName={profileQuery.data.firstName}
        lastName={profileQuery.data.lastName}
        phone={profileQuery.data.phone}
        avatarUrl={profileQuery.data.avatarUrl}
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sağlık Bilgileri</Text>

        <Text style={styles.label}>Doğum Tarihi (YYYY-MM-DD)</Text>
        <Controller
          control={clientForm.control}
          name="birthDate"
          render={({ field }) => (
            <TextInput
              testID="profile-birthDate"
              style={styles.input}
              placeholder="1995-05-20"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <Text style={styles.label}>Cinsiyet</Text>
        <Controller
          control={clientForm.control}
          name="gender"
          render={({ field }) => (
            <ChipSelect
              value={field.value}
              options={GenderSchema.options}
              labels={GENDER_LABELS}
              onChange={field.onChange}
              testIdPrefix="profile-gender"
            />
          )}
        />

        <Text style={styles.label}>Boy (cm)</Text>
        <Controller
          control={clientForm.control}
          name="heightCm"
          render={({ field }) => (
            <TextInput
              testID="profile-heightCm"
              style={styles.input}
              keyboardType="decimal-pad"
              value={field.value === undefined ? "" : String(field.value)}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <Text style={styles.label}>Hedef</Text>
        <Controller
          control={clientForm.control}
          name="goal"
          render={({ field }) => (
            <ChipSelect
              value={field.value}
              options={GoalSchema.options}
              labels={GOAL_LABELS}
              onChange={field.onChange}
              testIdPrefix="profile-goal"
            />
          )}
        />

        <Text style={styles.label}>Aktivite Seviyesi</Text>
        <Controller
          control={clientForm.control}
          name="activityLevel"
          render={({ field }) => (
            <ChipSelect
              value={field.value}
              options={ActivityLevelSchema.options}
              labels={ACTIVITY_LABELS}
              onChange={field.onChange}
              testIdPrefix="profile-activityLevel"
            />
          )}
        />

        <Text style={styles.label}>Sağlık Notları</Text>
        <Controller
          control={clientForm.control}
          name="medicalNotes"
          render={({ field }) => (
            <TextInput
              testID="profile-medicalNotes"
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        {savedClient && <Text style={styles.savedText}>Kaydedildi.</Text>}
        <Pressable
          testID="save-health-info"
          style={styles.button}
          onPress={clientForm.handleSubmit((values) => {
            updateClientMutation.mutate(values);
            setSavedClient(true);
          })}
        >
          <Text style={styles.buttonText}>Kaydet</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function DietitianProfileScreen() {
  const utils = trpc.useUtils();
  const profileQuery = trpc.dietitians.getProfile.useQuery();
  const [specialtiesInput, setSpecialtiesInput] = useState("");

  const updateDietitianMutation = trpc.dietitians.updateProfile.useMutation({
    onSuccess: () => utils.dietitians.getProfile.invalidate(),
  });

  const dietitianForm = useForm<UpdateDietitianProfileInput>({
    resolver: zodResolver(UpdateDietitianProfileInputSchema),
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    dietitianForm.reset({
      title: profileQuery.data.title ?? "",
      bio: profileQuery.data.bio ?? "",
      yearsOfExperience: profileQuery.data.yearsOfExperience ?? undefined,
      licenseNumber: profileQuery.data.licenseNumber ?? "",
    });
    setSpecialtiesInput(profileQuery.data.specialties.join(", "));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileQuery.data]);

  const [savedDietitian, setSavedDietitian] = useState(false);

  function handleDietitianSubmit(values: UpdateDietitianProfileInput) {
    const specialties = specialtiesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    updateDietitianMutation.mutate({ ...values, specialties });
    setSavedDietitian(true);
  }

  if (profileQuery.isError) {
    return (
      <View style={styles.center}>
        <QueryErrorNotice message={profileQuery.error.message} onRetry={() => profileQuery.refetch()} />
      </View>
    );
  }

  if (profileQuery.isLoading || !profileQuery.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profilim</Text>

      <PersonalInfoCard
        firstName={profileQuery.data.firstName}
        lastName={profileQuery.data.lastName}
        phone={profileQuery.data.phone}
        avatarUrl={profileQuery.data.avatarUrl}
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Uzmanlık Bilgileri</Text>

        <Text style={styles.label}>Unvan</Text>
        <Controller
          control={dietitianForm.control}
          name="title"
          render={({ field }) => (
            <TextInput
              testID="profile-title"
              style={styles.input}
              placeholder="örn. Uzm. Dyt."
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <Text style={styles.label}>Biyografi</Text>
        <Controller
          control={dietitianForm.control}
          name="bio"
          render={({ field }) => (
            <TextInput
              testID="profile-bio"
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <Text style={styles.label}>Uzmanlık Alanları (virgülle ayırın)</Text>
        <TextInput
          testID="profile-specialties"
          style={styles.input}
          placeholder="örn. Spor Beslenmesi, Diyabet"
          value={specialtiesInput}
          onChangeText={setSpecialtiesInput}
        />

        <Text style={styles.label}>Deneyim (yıl)</Text>
        <Controller
          control={dietitianForm.control}
          name="yearsOfExperience"
          render={({ field }) => (
            <TextInput
              testID="profile-yearsOfExperience"
              style={styles.input}
              keyboardType="number-pad"
              value={field.value === undefined ? "" : String(field.value)}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <Text style={styles.label}>Lisans No</Text>
        <Controller
          control={dietitianForm.control}
          name="licenseNumber"
          render={({ field }) => (
            <TextInput
              testID="profile-licenseNumber"
              style={styles.input}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        {savedDietitian && <Text style={styles.savedText}>Kaydedildi.</Text>}
        <Pressable
          testID="save-dietitian-info"
          style={styles.button}
          onPress={dietitianForm.handleSubmit(handleDietitianSubmit)}
        >
          <Text style={styles.buttonText}>Kaydet</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

export default function ProfileScreen() {
  const isDietitian = useAuthStore((s) => s.user?.role) === "DIETITIAN";
  return isDietitian ? <DietitianProfileScreen /> : <ClientProfileScreen />;
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#9ca3af" },
  title: { fontSize: 22, fontWeight: "600" },
  card: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 4 },
  cardTitle: { fontSize: 13, fontWeight: "600", color: "#6b7280", textTransform: "uppercase", marginBottom: 4 },
  label: { fontSize: 13, fontWeight: "500", marginTop: 8 },
  input: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  textArea: { minHeight: 72, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  chipSelected: { backgroundColor: "#059669", borderColor: "#059669" },
  chipText: { color: "#374151", fontSize: 13 },
  chipTextSelected: { color: "#fff", fontSize: 13, fontWeight: "600" },
  savedText: { color: "#047857", fontSize: 12, marginTop: 8 },
  button: {
    marginTop: 12,
    backgroundColor: "#059669",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 24,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
