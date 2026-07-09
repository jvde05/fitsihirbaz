"use client";

import { trpc } from "@/lib/trpc";
import type { AppointmentStatus } from "@fit-sihirbaz/shared";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Planlandı",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal Edildi",
  NO_SHOW: "Gelinmedi",
};

export default function DiyetisyenRandevularPage() {
  const utils = trpc.useUtils();
  const appointmentsQuery = trpc.appointments.listForDietitian.useQuery();

  const updateStatusMutation = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => utils.appointments.listForDietitian.invalidate(),
  });

  function setStatus(id: string, status: AppointmentStatus) {
    updateStatusMutation.mutate({ id, status });
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Randevu Takvimi</h1>

      {appointmentsQuery.isError && (
        <QueryErrorNotice message={appointmentsQuery.error.message} onRetry={() => appointmentsQuery.refetch()} />
      )}

      <ul className="divide-y rounded-md border">
        {appointmentsQuery.data?.map((appointment) => (
          <li key={appointment.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-foreground">
                {appointment.counterpartFirstName} {appointment.counterpartLastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(appointment.scheduledAt).toLocaleString("tr-TR")} · {STATUS_LABELS[appointment.status]}
              </p>
            </div>
            {appointment.status === "SCHEDULED" && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setStatus(appointment.id, "COMPLETED")}>
                  Tamamlandı
                </Button>
                <Button variant="outline" size="sm" onClick={() => setStatus(appointment.id, "NO_SHOW")}>
                  Gelinmedi
                </Button>
                <Button variant="outline" size="sm" onClick={() => setStatus(appointment.id, "CANCELLED")}>
                  İptal Et
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {appointmentsQuery.data?.length === 0 && <EmptyState title="Henüz randevunuz yok" />}
    </div>
  );
}
