"use client";

import { trpc } from "@/lib/trpc";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  PAID: "Ödendi",
  CANCELLED: "İptal Edildi",
  REFUNDED: "İade Edildi",
};

export default function SiparislerPage() {
  const ordersQuery = trpc.orders.listForDietitian.useQuery();
  const orders = ordersQuery.data ?? [];
  const totalEarnings = orders
    .filter((order) => order.status === "PAID")
    .reduce((sum, order) => sum + order.dietitianPayoutAmount, 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Siparişlerim</h1>

      <div className="mb-6 rounded-md border border-gray-200 p-4">
        <p className="text-xs font-semibold uppercase text-gray-500">Toplam Kazanç (Ödenen Siparişler)</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900">{totalEarnings.toFixed(2)} TRY</p>
      </div>

      {ordersQuery.isLoading && <p className="text-gray-500">Yükleniyor...</p>}
      {orders.length === 0 && !ordersQuery.isLoading && <p className="text-gray-500">Henüz siparişiniz yok.</p>}

      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
        {orders.map((order) => (
          <li key={order.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-gray-900">{order.packageTitle}</p>
              <p className="text-sm text-gray-500">
                {order.counterpartFirstName} {order.counterpartLastName} ·{" "}
                {new Date(order.createdAt).toLocaleString("tr-TR")}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">
                {order.dietitianPayoutAmount} {order.currency}
              </p>
              <p className="text-sm text-gray-500">{STATUS_LABELS[order.status]}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
