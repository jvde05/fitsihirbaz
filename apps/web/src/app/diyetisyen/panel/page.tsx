"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";

export default function DiyetisyenPanelPage() {
  const clientsQuery = trpc.dietitians.getMyClients.useQuery();
  const appointmentsQuery = trpc.appointments.listForDietitian.useQuery();

  const clientCount = clientsQuery.data?.length ?? 0;
  const pendingAppointments = (appointmentsQuery.data ?? []).filter((a) => a.status === "SCHEDULED");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Panelim</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Danışan Sayısı</p>
          {clientsQuery.isLoading ? (
            <p className="mt-2 text-sm text-gray-400">Yükleniyor...</p>
          ) : (
            <p className="mt-2 text-2xl font-semibold text-gray-900">{clientCount}</p>
          )}
          <Link href="/diyetisyen/danisanlar" className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline">
            Danışanlarım →
          </Link>
        </div>

        <div className="rounded-md border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Bekleyen Randevular</p>
          {appointmentsQuery.isLoading ? (
            <p className="mt-2 text-sm text-gray-400">Yükleniyor...</p>
          ) : (
            <p className="mt-2 text-2xl font-semibold text-gray-900">{pendingAppointments.length}</p>
          )}
          <Link href="/diyetisyen/randevular" className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline">
            Randevularım →
          </Link>
        </div>
      </div>

      {pendingAppointments.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Yaklaşan Randevular</h2>
          <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
            {pendingAppointments.slice(0, 5).map((appointment) => (
              <li key={appointment.id} className="px-4 py-3 text-sm">
                <span className="font-medium text-gray-900">
                  {appointment.counterpartFirstName} {appointment.counterpartLastName}
                </span>{" "}
                <span className="text-gray-500">{new Date(appointment.scheduledAt).toLocaleString("tr-TR")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
