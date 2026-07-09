"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Randevularım</h1>

      {dietitians.length === 0 ? (
        <p className="mb-6 text-muted-foreground">Randevu talep edebilmek için önce bir diyetisyene bağlı olmalısınız.</p>
      ) : (
        <form onSubmit={handleSubmit} className="mb-8 flex flex-wrap items-end gap-3 rounded-md border p-4">
          <div className="space-y-1.5">
            <Label>Diyetisyen</Label>
            <Select required value={dietitianId} onValueChange={setDietitianId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {dietitians.map((dietitian) => (
                  <SelectItem key={dietitian.id} value={dietitian.id}>
                    {dietitian.firstName} {dietitian.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tarih/Saat</Label>
            <Input
              required
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="w-56"
            />
          </div>
          <Button type="submit" disabled={createMutation.isLoading}>
            {createMutation.isLoading ? "Talep ediliyor..." : "Randevu Talep Et"}
          </Button>
          {formError && <p className="w-full text-sm text-destructive">{formError}</p>}
        </form>
      )}

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
              <Button variant="outline" size="sm" onClick={() => cancelMutation.mutate({ id: appointment.id })}>
                İptal Et
              </Button>
            )}
          </li>
        ))}
      </ul>
      {appointmentsQuery.data?.length === 0 && <EmptyState title="Henüz randevunuz yok" />}
    </div>
  );
}
