"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";

export default function OdemeSimulasyonPage() {
  const params = useParams<{ paymentId: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const checkoutQuery = trpc.payments.getMockCheckoutDetails.useQuery({ paymentId: params.paymentId });

  const simulateMutation = trpc.payments.simulateOutcome.useMutation({
    onSuccess: (payment) => {
      if (payment.status === "SUCCESS") {
        setSuccessMessage("Ödeme başarılı! Panelinize yönlendiriliyorsunuz...");
        setTimeout(() => router.push("/danisan/panel"), 1500);
      } else {
        setError("Ödeme reddedildi. Tekrar deneyebilirsiniz.");
      }
    },
    onError: (err) => setError(err.message),
  });

  function handleOutcome(outcome: "SUCCESS" | "FAILED") {
    setError(null);
    simulateMutation.mutate({ paymentId: params.paymentId, outcome });
  }

  if (checkoutQuery.isLoading) {
    return <p className="text-gray-500">Yükleniyor...</p>;
  }
  if (checkoutQuery.isError) {
    return <QueryErrorNotice message={checkoutQuery.error.message} onRetry={() => checkoutQuery.refetch()} />;
  }
  if (!checkoutQuery.data) {
    return <p className="text-gray-500">Ödeme bulunamadı.</p>;
  }

  const details = checkoutQuery.data;
  const isSubmitting = simulateMutation.isLoading;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">Ödeme Simülasyonu</h1>
      <p className="mb-6 text-sm text-gray-500">
        Bu, gerçek bir ödeme sağlayıcısının hosted checkout sayfasının yerini tutan bir test sayfasıdır.
      </p>

      <div className="rounded-md border border-gray-200 p-4">
        <p className="font-medium text-gray-900">{details.packageTitle}</p>
        <p className="text-sm text-gray-500">
          {details.dietitianFirstName} {details.dietitianLastName}
        </p>
        <p className="mt-4 text-xl font-semibold text-gray-900">
          {details.amount} {details.currency}
        </p>
      </div>

      {details.status === "INITIATED" && !successMessage && (
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => handleOutcome("SUCCESS")}
            disabled={isSubmitting}
            className="flex-1 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            Ödemeyi Onayla
          </button>
          <button
            type="button"
            onClick={() => handleOutcome("FAILED")}
            disabled={isSubmitting}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
          >
            Ödemeyi Reddet
          </button>
        </div>
      )}

      {successMessage && <p className="mt-6 text-sm font-medium text-green-700">{successMessage}</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
    </div>
  );
}
