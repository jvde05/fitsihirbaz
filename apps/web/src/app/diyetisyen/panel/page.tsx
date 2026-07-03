"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";

export default function DiyetisyenPanelPage() {
  const clientsQuery = trpc.dietitians.getMyClients.useQuery();
  const appointmentsQuery = trpc.appointments.listForDietitian.useQuery();
  const ordersQuery = trpc.orders.listForDietitian.useQuery();

  const clientCount = clientsQuery.data?.length ?? 0;
  const pendingAppointments = (appointmentsQuery.data ?? []).filter((a) => a.status === "SCHEDULED");
  const recentOrders = ordersQuery.data ?? [];
  const totalEarnings = recentOrders
    .filter((order) => order.status === "PAID")
    .reduce((sum, order) => sum + order.dietitianPayoutAmount, 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Panelim</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Danışan Sayısı</p>
          {clientsQuery.isLoading && <p className="mt-2 text-sm text-gray-400">Yükleniyor...</p>}
          {clientsQuery.isError && <p className="mt-2 text-sm text-red-600">Yüklenemedi</p>}
          {!clientsQuery.isLoading && !clientsQuery.isError && (
            <p className="mt-2 text-2xl font-semibold text-gray-900">{clientCount}</p>
          )}
          <Link href="/diyetisyen/danisanlar" className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline">
            Danışanlarım →
          </Link>
        </div>

        <div className="rounded-md border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Bekleyen Randevular</p>
          {appointmentsQuery.isLoading && <p className="mt-2 text-sm text-gray-400">Yükleniyor...</p>}
          {appointmentsQuery.isError && <p className="mt-2 text-sm text-red-600">Yüklenemedi</p>}
          {!appointmentsQuery.isLoading && !appointmentsQuery.isError && (
            <p className="mt-2 text-2xl font-semibold text-gray-900">{pendingAppointments.length}</p>
          )}
          <Link href="/diyetisyen/randevular" className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline">
            Randevularım →
          </Link>
        </div>

        <div className="rounded-md border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Toplam Kazanç</p>
          {ordersQuery.isLoading && <p className="mt-2 text-sm text-gray-400">Yükleniyor...</p>}
          {ordersQuery.isError && <p className="mt-2 text-sm text-red-600">Yüklenemedi</p>}
          {!ordersQuery.isLoading && !ordersQuery.isError && (
            <p className="mt-2 text-2xl font-semibold text-gray-900">{totalEarnings.toFixed(2)} TRY</p>
          )}
          <Link href="/diyetisyen/siparisler" className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline">
            Siparişlerim →
          </Link>
        </div>
      </div>

      {recentOrders.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Son Siparişler</h2>
          <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
            {recentOrders.slice(0, 5).map((order) => (
              <li key={order.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>
                  <span className="font-medium text-gray-900">{order.packageTitle}</span>{" "}
                  <span className="text-gray-500">
                    · {order.counterpartFirstName} {order.counterpartLastName}
                  </span>
                </span>
                <span className="text-gray-500">
                  {order.dietitianPayoutAmount} {order.currency}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
