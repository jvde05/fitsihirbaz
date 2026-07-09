"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { WeightChart } from "@/components/WeightChart";
import { resolveMediaUrl } from "@/lib/media";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PLAN_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Taslak",
  ACTIVE: "Aktif",
  COMPLETED: "Tamamlandı",
  ARCHIVED: "Arşivlendi",
};

export default function DanisanDetayPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = params.clientId;

  const clientsQuery = trpc.dietitians.getMyClients.useQuery();
  const client = clientsQuery.data?.find((c) => c.id === clientId);

  const progressQuery = trpc.progress.list.useQuery({ clientId });
  const plansQuery = trpc.dietPlans.list.useQuery({ clientId });

  const logs = progressQuery.data ?? [];
  const firstWeight = logs.length > 0 ? logs[0].weightKg : null;
  const latestWeight = logs.length > 0 ? logs[logs.length - 1].weightKg : null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {client ? `${client.firstName} ${client.lastName}` : "Danışan"}
          </h1>
          {client && <p className="text-sm text-muted-foreground">{client.email}</p>}
        </div>
        <Button asChild>
          <Link href={`/diyetisyen/danisanlar/${clientId}/plan-olustur`}>Plan Oluştur / Düzenle</Link>
        </Button>
      </div>

      {(clientsQuery.isError || progressQuery.isError || plansQuery.isError) && (
        <QueryErrorNotice
          message={(clientsQuery.error ?? progressQuery.error ?? plansQuery.error)?.message ?? "Bilinmeyen hata"}
          onRetry={() => {
            clientsQuery.refetch();
            progressQuery.refetch();
            plansQuery.refetch();
          }}
        />
      )}

      <div className="mb-6">
        <h2 className="mb-2 text-lg font-medium text-foreground">Diyet Planları</h2>
        {plansQuery.data && plansQuery.data.length === 0 && (
          <EmptyState title="Henüz bir plan oluşturulmadı" />
        )}
        <ul className="divide-y rounded-md border">
          {plansQuery.data?.map((plan) => (
            <li key={plan.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-foreground">{plan.title}</p>
                <p className="text-sm text-muted-foreground">
                  {plan.startDate}
                  {plan.endDate ? ` – ${plan.endDate}` : ""} · Hedef: {plan.targetCalories ?? "-"} kcal
                </p>
              </div>
              <Badge variant="secondary">{PLAN_STATUS_LABELS[plan.status]}</Badge>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium text-foreground">İlerleme</h2>
        {firstWeight !== null && latestWeight !== null && (
          <p className="mb-3 text-sm text-foreground/90">
            İlk ölçüm: {firstWeight} kg → Son ölçüm: {latestWeight} kg (
            {(latestWeight - firstWeight).toFixed(1)} kg)
          </p>
        )}
        {logs.length === 0 && <EmptyState title="Henüz ölçüm kaydı yok" />}
        {logs.length > 0 && (
          <div className="mb-4">
            <WeightChart logs={logs} />
          </div>
        )}
        {logs.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Kilo</TableHead>
                <TableHead>Yağ Oranı</TableHead>
                <TableHead>Bel</TableHead>
                <TableHead>Kalça</TableHead>
                <TableHead>Notlar</TableHead>
                <TableHead>Fotoğraflar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...logs].reverse().map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.logDate}</TableCell>
                  <TableCell>{log.weightKg ?? "-"}</TableCell>
                  <TableCell>{log.bodyFatPercent !== null ? `${log.bodyFatPercent}%` : "-"}</TableCell>
                  <TableCell>{log.waistCm ?? "-"}</TableCell>
                  <TableCell>{log.hipCm ?? "-"}</TableCell>
                  <TableCell className="max-w-xs truncate" title={log.notes ?? undefined}>
                    {log.notes ?? "-"}
                  </TableCell>
                  <TableCell>
                    {log.photoUrls.length > 0 && (
                      <div className="flex gap-1">
                        {log.photoUrls.map((url) => (
                          <a key={url} href={resolveMediaUrl(url) ?? "#"} target="_blank" rel="noreferrer">
                            <img
                              src={resolveMediaUrl(url) ?? undefined}
                              alt=""
                              className="h-10 w-10 rounded object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
