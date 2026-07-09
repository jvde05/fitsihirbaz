"use client";

import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";

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
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Siparişlerim</h1>

      <Card className="mb-6 p-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Toplam Kazanç (Ödenen Siparişler)</p>
        <p className="mt-2 text-2xl font-semibold text-foreground">{totalEarnings.toFixed(2)} TRY</p>
      </Card>

      {ordersQuery.isLoading && <p className="text-muted-foreground">Yükleniyor...</p>}
      {ordersQuery.isError && (
        <QueryErrorNotice message={ordersQuery.error.message} onRetry={() => ordersQuery.refetch()} />
      )}
      {orders.length === 0 && !ordersQuery.isLoading && !ordersQuery.isError && (
        <EmptyState title="Henüz siparişiniz yok" />
      )}

      <ul className="divide-y rounded-md border">
        {orders.map((order) => (
          <li key={order.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-foreground">{order.packageTitle}</p>
              <p className="text-sm text-muted-foreground">
                {order.counterpartFirstName} {order.counterpartLastName} ·{" "}
                {new Date(order.createdAt).toLocaleString("tr-TR")}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium text-foreground">
                {order.dietitianPayoutAmount} {order.currency}
              </p>
              <p className="text-sm text-muted-foreground">{STATUS_LABELS[order.status]}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
