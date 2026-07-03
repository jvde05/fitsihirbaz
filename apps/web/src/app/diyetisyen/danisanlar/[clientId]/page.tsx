"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { WeightChart } from "@/components/WeightChart";
import { resolveMediaUrl } from "@/lib/media";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";

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
          <h1 className="text-2xl font-semibold text-gray-900">
            {client ? `${client.firstName} ${client.lastName}` : "Danışan"}
          </h1>
          {client && <p className="text-sm text-gray-500">{client.email}</p>}
        </div>
        <Link
          href={`/diyetisyen/danisanlar/${clientId}/plan-olustur`}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Plan Oluştur / Düzenle
        </Link>
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
        <h2 className="mb-2 text-lg font-medium text-gray-900">Diyet Planları</h2>
        {plansQuery.data && plansQuery.data.length === 0 && (
          <p className="text-gray-500">Henüz bir plan oluşturulmadı.</p>
        )}
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
          {plansQuery.data?.map((plan) => (
            <li key={plan.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">{plan.title}</p>
                <p className="text-sm text-gray-500">
                  {plan.startDate}
                  {plan.endDate ? ` – ${plan.endDate}` : ""} · Hedef: {plan.targetCalories ?? "-"} kcal
                </p>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {PLAN_STATUS_LABELS[plan.status]}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium text-gray-900">İlerleme</h2>
        {firstWeight !== null && latestWeight !== null && (
          <p className="mb-3 text-sm text-gray-700">
            İlk ölçüm: {firstWeight} kg → Son ölçüm: {latestWeight} kg (
            {(latestWeight - firstWeight).toFixed(1)} kg)
          </p>
        )}
        {logs.length === 0 && <p className="text-gray-500">Henüz ölçüm kaydı yok.</p>}
        {logs.length > 0 && (
          <div className="mb-4">
            <WeightChart logs={logs} />
          </div>
        )}
        {logs.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="py-2">Tarih</th>
                <th className="py-2">Kilo</th>
                <th className="py-2">Yağ Oranı</th>
                <th className="py-2">Bel</th>
                <th className="py-2">Kalça</th>
                <th className="py-2">Notlar</th>
                <th className="py-2">Fotoğraflar</th>
              </tr>
            </thead>
            <tbody>
              {[...logs].reverse().map((log) => (
                <tr key={log.id} className="border-b border-gray-100">
                  <td className="py-2">{log.logDate}</td>
                  <td className="py-2">{log.weightKg ?? "-"}</td>
                  <td className="py-2">{log.bodyFatPercent !== null ? `${log.bodyFatPercent}%` : "-"}</td>
                  <td className="py-2">{log.waistCm ?? "-"}</td>
                  <td className="py-2">{log.hipCm ?? "-"}</td>
                  <td className="py-2 max-w-xs truncate" title={log.notes ?? undefined}>
                    {log.notes ?? "-"}
                  </td>
                  <td className="py-2">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
