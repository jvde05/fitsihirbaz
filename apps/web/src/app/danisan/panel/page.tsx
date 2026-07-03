"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";

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
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Panelim</h1>

      {hasNoDietitian && (
        <div className="mb-6 rounded-md border border-brand-200 bg-brand-50 p-4">
          <p className="text-sm font-medium text-gray-900">Henüz bir diyetisyene bağlı değilsiniz</p>
          <p className="mt-1 text-sm text-gray-600">
            Diyet planı, randevu ve mesajlaşma gibi özellikler bir diyetisyenle bağlantı kurduğunuzda
            (bir paket satın aldığınızda) aktif olur. Aşağıdaki kartlar bu yüzden şu an boş görünüyor.
          </p>
          <Link
            href="/diyetisyenler"
            className="mt-3 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Diyetisyen Keşfet →
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Aktif Diyet Planı</p>
          {plansQuery.isLoading && <p className="mt-2 text-sm text-gray-400">Yükleniyor...</p>}
          {!plansQuery.isLoading && !activePlan && (
            <p className="mt-2 text-sm text-gray-400">Henüz bir diyet planınız bulunmuyor.</p>
          )}
          {activePlan && (
            <>
              <p className="mt-2 font-medium text-gray-900">{activePlan.title}</p>
              <p className="text-sm text-gray-500">
                Hedef: {activePlan.targetCalories ?? "-"} kcal · {activePlan.status}
              </p>
              <Link href="/danisan/plan" className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline">
                Planı Görüntüle →
              </Link>
            </>
          )}
        </div>

        <div className="rounded-md border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Yaklaşan Randevu</p>
          {appointmentsQuery.isLoading && <p className="mt-2 text-sm text-gray-400">Yükleniyor...</p>}
          {!appointmentsQuery.isLoading && !upcomingAppointment && (
            <p className="mt-2 text-sm text-gray-400">Yaklaşan randevunuz bulunmuyor.</p>
          )}
          {upcomingAppointment && (
            <>
              <p className="mt-2 font-medium text-gray-900">
                {upcomingAppointment.counterpartFirstName} {upcomingAppointment.counterpartLastName}
              </p>
              <p className="text-sm text-gray-500">{formatDateTime(upcomingAppointment.scheduledAt)}</p>
            </>
          )}
          <Link href="/danisan/randevular" className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline">
            Randevularım →
          </Link>
        </div>

        <div className="rounded-md border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Son İlerleme</p>
          {progressQuery.isLoading && <p className="mt-2 text-sm text-gray-400">Yükleniyor...</p>}
          {!progressQuery.isLoading && !latestProgress && (
            <p className="mt-2 text-sm text-gray-400">Henüz ölçüm kaydınız yok.</p>
          )}
          {latestProgress && (
            <>
              <p className="mt-2 font-medium text-gray-900">
                {latestProgress.weightKg ?? "-"} kg ({latestProgress.logDate})
              </p>
            </>
          )}
          <Link href="/danisan/ilerleme" className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline">
            İlerlemem →
          </Link>
        </div>
      </div>
    </div>
  );
}
