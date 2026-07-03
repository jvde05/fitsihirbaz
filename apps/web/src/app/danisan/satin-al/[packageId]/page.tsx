"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";

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
    return <p className="text-gray-500">Yükleniyor...</p>;
  }
  if (packageQuery.isError) {
    return <QueryErrorNotice message={packageQuery.error.message} onRetry={() => packageQuery.refetch()} />;
  }
  if (!packageQuery.data) {
    return <p className="text-gray-500">Paket bulunamadı.</p>;
  }

  const pkg = packageQuery.data;
  const isSubmitting = createOrderMutation.isLoading || initiatePaymentMutation.isLoading;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Satın Alma Onayı</h1>

      <div className="rounded-md border border-gray-200 p-4">
        <p className="font-medium text-gray-900">{pkg.title}</p>
        <p className="text-sm text-gray-500">
          {pkg.dietitianFirstName} {pkg.dietitianLastName}
          {pkg.dietitianTitle ? ` · ${pkg.dietitianTitle}` : ""}
        </p>
        <p className="mt-2 text-sm text-gray-600">
          {pkg.durationDays} gün{pkg.sessionCount ? ` · ${pkg.sessionCount} görüşme` : ""}
        </p>
        {pkg.description && <p className="mt-2 text-sm text-gray-600">{pkg.description}</p>}
        <p className="mt-4 text-xl font-semibold text-gray-900">
          {pkg.price} {pkg.currency}
        </p>
      </div>

      <button
        type="button"
        onClick={handlePurchase}
        disabled={isSubmitting}
        className="mt-6 w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {isSubmitting ? "Yönlendiriliyor..." : "Satın Al"}
      </button>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
