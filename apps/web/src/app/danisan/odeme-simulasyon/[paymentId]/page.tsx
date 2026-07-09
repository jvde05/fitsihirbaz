"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    return <p className="text-muted-foreground">Yükleniyor...</p>;
  }
  if (checkoutQuery.isError) {
    return <QueryErrorNotice message={checkoutQuery.error.message} onRetry={() => checkoutQuery.refetch()} />;
  }
  if (!checkoutQuery.data) {
    return <p className="text-muted-foreground">Ödeme bulunamadı.</p>;
  }

  const details = checkoutQuery.data;
  const isSubmitting = simulateMutation.isLoading;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-semibold text-foreground">Ödeme Simülasyonu</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Bu, gerçek bir ödeme sağlayıcısının hosted checkout sayfasının yerini tutan bir test sayfasıdır.
      </p>

      <Card className="p-4">
        <p className="font-medium text-foreground">{details.packageTitle}</p>
        <p className="text-sm text-muted-foreground">
          {details.dietitianFirstName} {details.dietitianLastName}
        </p>
        <p className="mt-4 text-xl font-semibold text-foreground">
          {details.amount} {details.currency}
        </p>
      </Card>

      {details.status === "INITIATED" && !successMessage && (
        <div className="mt-6 flex gap-3">
          <Button className="flex-1" disabled={isSubmitting} onClick={() => handleOutcome("SUCCESS")}>
            Ödemeyi Onayla
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            disabled={isSubmitting}
            onClick={() => handleOutcome("FAILED")}
          >
            Ödemeyi Reddet
          </Button>
        </div>
      )}

      {successMessage && <p className="mt-6 text-sm font-medium text-primary">{successMessage}</p>}
      {error && <p className="mt-6 text-sm text-destructive">{error}</p>}
    </div>
  );
}
