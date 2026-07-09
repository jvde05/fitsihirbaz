"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR");
}

export default function DanisanPanelPage() {
  const plansQuery = trpc.dietPlans.list.useQuery({});
  const appointmentsQuery = trpc.appointments.listForClient.useQuery();
  const progressQuery = trpc.progress.list.useQuery({});
  const dietitiansQuery = trpc.clients.getMyDietitians.useQuery();

  const activePlan = plansQuery.data?.[0];
  const now = Date.now();
  const upcomingAppointment = (appointmentsQuery.data ?? [])
    .filter((a) => a.status === "SCHEDULED" && new Date(a.scheduledAt).getTime() >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];
  const latestProgress = progressQuery.data?.[progressQuery.data.length - 1];
  const hasNoDietitian = dietitiansQuery.data !== undefined && dietitiansQuery.data.length === 0;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Panelim</h1>

      {hasNoDietitian && (
        <Card className="mb-6 border-primary/20 bg-accent p-4">
          <p className="text-sm font-medium text-foreground">Henüz bir diyetisyene bağlı değilsiniz</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Diyet planı, randevu ve mesajlaşma gibi özellikler bir diyetisyenle bağlantı kurduğunuzda
            (bir paket satın aldığınızda) aktif olur. Aşağıdaki kartlar bu yüzden şu an boş görünüyor.
          </p>
          <Button asChild className="mt-3">
            <Link href="/diyetisyenler">Diyetisyen Keşfet →</Link>
          </Button>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Aktif Diyet Planı</p>
          {plansQuery.isLoading && <p className="mt-2 text-sm text-muted-foreground">Yükleniyor...</p>}
          {plansQuery.isError && <p className="mt-2 text-sm text-destructive">Yüklenemedi: {plansQuery.error.message}</p>}
          {!plansQuery.isLoading && !plansQuery.isError && !activePlan && (
            <p className="mt-2 text-sm text-muted-foreground">Henüz bir diyet planınız bulunmuyor.</p>
          )}
          {activePlan && (
            <>
              <p className="mt-2 font-medium text-foreground">{activePlan.title}</p>
              <p className="text-sm text-muted-foreground">
                Hedef: {activePlan.targetCalories ?? "-"} kcal · {activePlan.status}
              </p>
              <Link href="/danisan/plan" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
                Planı Görüntüle →
              </Link>
            </>
          )}
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Yaklaşan Randevu</p>
          {appointmentsQuery.isLoading && <p className="mt-2 text-sm text-muted-foreground">Yükleniyor...</p>}
          {appointmentsQuery.isError && (
            <p className="mt-2 text-sm text-destructive">Yüklenemedi: {appointmentsQuery.error.message}</p>
          )}
          {!appointmentsQuery.isLoading && !appointmentsQuery.isError && !upcomingAppointment && (
            <p className="mt-2 text-sm text-muted-foreground">Yaklaşan randevunuz bulunmuyor.</p>
          )}
          {upcomingAppointment && (
            <>
              <p className="mt-2 font-medium text-foreground">
                {upcomingAppointment.counterpartFirstName} {upcomingAppointment.counterpartLastName}
              </p>
              <p className="text-sm text-muted-foreground">{formatDateTime(upcomingAppointment.scheduledAt)}</p>
            </>
          )}
          <Link href="/danisan/randevular" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
            Randevularım →
          </Link>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Son İlerleme</p>
          {progressQuery.isLoading && <p className="mt-2 text-sm text-muted-foreground">Yükleniyor...</p>}
          {progressQuery.isError && (
            <p className="mt-2 text-sm text-destructive">Yüklenemedi: {progressQuery.error.message}</p>
          )}
          {!progressQuery.isLoading && !progressQuery.isError && !latestProgress && (
            <p className="mt-2 text-sm text-muted-foreground">Henüz ölçüm kaydınız yok.</p>
          )}
          {latestProgress && (
            <p className="mt-2 font-medium text-foreground">
              {latestProgress.weightKg ?? "-"} kg ({latestProgress.logDate})
            </p>
          )}
          <Link href="/danisan/ilerleme" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
            İlerlemem →
          </Link>
        </Card>
      </div>
    </div>
  );
}
