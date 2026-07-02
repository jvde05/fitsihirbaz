"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddProgressLogInputSchema, type AddProgressLogInput } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { WeightChart } from "@/components/WeightChart";

export default function IlerlemePage() {
  const utils = trpc.useUtils();
  const logsQuery = trpc.progress.list.useQuery({});
  const [formError, setFormError] = useState<string | null>(null);

  const addLogMutation = trpc.progress.addLog.useMutation({
    onSuccess: () => {
      reset();
      setFormError(null);
      utils.progress.list.invalidate();
    },
    onError: (err) => setFormError(err.message),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddProgressLogInput>({ resolver: zodResolver(AddProgressLogInputSchema) });

  async function onSubmit(values: AddProgressLogInput) {
    setFormError(null);
    await addLogMutation.mutateAsync(values);
  }

  const logs = logsQuery.data ?? [];
  const latestWeight = logs.length > 0 ? logs[logs.length - 1].weightKg : null;
  const firstWeight = logs.length > 0 ? logs[0].weightKg : null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">İlerleme</h1>

      {firstWeight !== null && latestWeight !== null && (
        <div className="mb-6 rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-700">
          İlk ölçüm: {firstWeight} kg → Son ölçüm: {latestWeight} kg (
          {(latestWeight - firstWeight).toFixed(1)} kg)
        </div>
      )}

      <div className="mb-6">
        <WeightChart logs={logs} />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mb-8 grid grid-cols-2 gap-3 rounded-md border border-gray-200 p-4 sm:grid-cols-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="logDate">
            Tarih
          </label>
          <input
            id="logDate"
            type="date"
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5"
            {...register("logDate")}
          />
          {errors.logDate && <p className="mt-1 text-xs text-red-600">{errors.logDate.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="weightKg">
            Kilo (kg)
          </label>
          <input
            id="weightKg"
            type="number"
            step="0.1"
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5"
            {...register("weightKg")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="waistCm">
            Bel (cm)
          </label>
          <input
            id="waistCm"
            type="number"
            step="0.1"
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5"
            {...register("waistCm")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="hipCm">
            Kalça (cm)
          </label>
          <input
            id="hipCm"
            type="number"
            step="0.1"
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5"
            {...register("hipCm")}
          />
        </div>
        <div className="col-span-2 sm:col-span-4">
          {formError && <p className="mb-2 text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? "Kaydediliyor..." : "Ölçüm Ekle"}
          </button>
        </div>
      </form>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500">
            <th className="py-2">Tarih</th>
            <th className="py-2">Kilo</th>
            <th className="py-2">Bel</th>
            <th className="py-2">Kalça</th>
          </tr>
        </thead>
        <tbody>
          {[...logs].reverse().map((log) => (
            <tr key={log.id} className="border-b border-gray-100">
              <td className="py-2">{log.logDate}</td>
              <td className="py-2">{log.weightKg ?? "-"}</td>
              <td className="py-2">{log.waistCm ?? "-"}</td>
              <td className="py-2">{log.hipCm ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {logs.length === 0 && <p className="text-gray-500">Henüz ölçüm kaydı yok.</p>}
    </div>
  );
}
