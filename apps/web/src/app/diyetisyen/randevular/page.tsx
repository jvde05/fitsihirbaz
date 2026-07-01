"use client";

import { trpc } from "@/lib/trpc";
import type { AppointmentStatus } from "@fit-sihirbaz/shared";

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
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Randevu Takvimi</h1>

      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
        {appointmentsQuery.data?.map((appointment) => (
          <li key={appointment.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-gray-900">
                {appointment.counterpartFirstName} {appointment.counterpartLastName}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(appointment.scheduledAt).toLocaleString("tr-TR")} · {STATUS_LABELS[appointment.status]}
              </p>
            </div>
            {appointment.status === "SCHEDULED" && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus(appointment.id, "COMPLETED")}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Tamamlandı
                </button>
                <button
                  type="button"
                  onClick={() => setStatus(appointment.id, "NO_SHOW")}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Gelinmedi
                </button>
                <button
                  type="button"
                  onClick={() => setStatus(appointment.id, "CANCELLED")}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  İptal Et
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {appointmentsQuery.data?.length === 0 && <p className="text-gray-500">Henüz randevunuz yok.</p>}
    </div>
  );
}
