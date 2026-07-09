"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SatinAlPage() {
  const params = useParams<{ packageId: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const packageQuery = trpc.packages.getById.useQuery({ id: params.packageId });

  const createOrderMutation = trpc.orders.create.useMutation({
    onError: (err) => setError(err.message),
  });
  const initiatePaymentMutation = trpc.payments.initiate.useMutation({
    onError: (err) => setError(err.message),
  });

  async function handlePurchase() {
    setError(null);
    try {
      const order = await createOrderMutation.mutateAsync({ packageId: params.packageId });
      const { checkoutUrl } = await initiatePaymentMutation.mutateAsync({ orderId: order.id });
      router.push(checkoutUrl);
    } catch {
      // Hata mesajı zaten onError ile state'e yazıldı.
    }
  }

  if (packageQuery.isLoading) {
    return <p className="text-muted-foreground">Yükleniyor...</p>;
  }
  if (packageQuery.isError) {
    return <QueryErrorNotice message={packageQuery.error.message} onRetry={() => packageQuery.refetch()} />;
  }
  if (!packageQuery.data) {
    return <p className="text-muted-foreground">Paket bulunamadı.</p>;
  }

  const pkg = packageQuery.data;
  const isSubmitting = createOrderMutation.isLoading || initiatePaymentMutation.isLoading;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Satın Alma Onayı</h1>

      <Card className="p-4">
        <p className="font-medium text-foreground">{pkg.title}</p>
        <p className="text-sm text-muted-foreground">
          {pkg.dietitianFirstName} {pkg.dietitianLastName}
          {pkg.dietitianTitle ? ` · ${pkg.dietitianTitle}` : ""}
        </p>
        <p className="mt-2 text-sm text-foreground/90">
          {pkg.durationDays} gün{pkg.sessionCount ? ` · ${pkg.sessionCount} görüşme` : ""}
        </p>
        {pkg.description && <p className="mt-2 text-sm text-foreground/90">{pkg.description}</p>}
        <p className="mt-4 text-xl font-semibold text-foreground">
          {pkg.price} {pkg.currency}
        </p>
      </Card>

      <Button className="mt-6 w-full" disabled={isSubmitting} onClick={handlePurchase}>
        {isSubmitting ? "Yönlendiriliyor..." : "Satın Al"}
      </Button>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
