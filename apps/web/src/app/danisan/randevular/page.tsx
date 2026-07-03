"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Planlandı",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal Edildi",
  NO_SHOW: "Gelinmedi",
};

export default function DanisanRandevularPage() {
  const utils = trpc.useUtils();
  const appointmentsQuery = trpc.appointments.listForClient.useQuery();
  const dietitiansQuery = trpc.clients.getMyDietitians.useQuery();
  const [dietitianId, setDietitianId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      setFormError(null);
      setScheduledAt("");
      utils.appointments.listForClient.invalidate();
    },
    onError: (err) => setFormError(err.message),
  });

  const cancelMutation = trpc.appointments.cancel.useMutation({
    onSuccess: () => utils.appointments.listForClient.invalidate(),
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    createMutation.mutate({ dietitianId, scheduledAt });
  }

  const dietitians = dietitiansQuery.data ?? [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Randevularım</h1>

      {dietitians.length === 0 ? (
        <p className="mb-6 text-gray-500">Randevu talep edebilmek için önce bir diyetisyene bağlı olmalısınız.</p>
      ) : (
        <form onSubmit={handleSubmit} className="mb-8 flex flex-wrap items-end gap-3 rounded-md border border-gray-200 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Diyetisyen</label>
            <select
              required
              value={dietitianId}
              onChange={(event) => setDietitianId(event.target.value)}
              className="mt-1 rounded-md border border-gray-300 px-2 py-1.5"
            >
              <option value="">Seçin</option>
              {dietitians.map((dietitian) => (
                <option key={dietitian.id} value={dietitian.id}>
                  {dietitian.firstName} {dietitian.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tarih/Saat</label>
            <input
              required
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="mt-1 rounded-md border border-gray-300 px-2 py-1.5"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isLoading}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {createMutation.isLoading ? "Talep ediliyor..." : "Randevu Talep Et"}
          </button>
          {formError && <p className="w-full text-sm text-red-600">{formError}</p>}
        </form>
      )}

      {appointmentsQuery.isError && (
        <QueryErrorNotice message={appointmentsQuery.error.message} onRetry={() => appointmentsQuery.refetch()} />
      )}

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
              <button
                type="button"
                onClick={() => cancelMutation.mutate({ id: appointment.id })}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                İptal Et
              </button>
            )}
          </li>
        ))}
      </ul>
      {appointmentsQuery.data?.length === 0 && <p className="text-gray-500">Henüz randevunuz yok.</p>}
    </div>
  );
}
