"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";

function NutrientGroup({ title, values }: { title: string; values: Record<string, number> | null }) {
  if (!values || Object.keys(values).length === 0) {
    return null;
  }
  return (
    <div className="rounded-md border border-gray-200 p-4">
      <h3 className="mb-2 text-sm font-semibold text-gray-700">{title}</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
        {Object.entries(values).map(([key, value]) => (
          <div key={key} className="flex justify-between gap-2">
            <dt className="text-gray-500">{key}</dt>
            <dd className="text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function BesinDetayContent() {
  const params = useParams<{ id: string }>();
  const foodQuery = trpc.foods.getById.useQuery({ id: params.id });

  if (foodQuery.isLoading) {
    return <p className="text-gray-500">Yükleniyor...</p>;
  }
  if (foodQuery.isError) {
    return <QueryErrorNotice message={foodQuery.error.message} onRetry={() => foodQuery.refetch()} />;
  }
  if (!foodQuery.data) {
    return <p className="text-gray-500">Besin bulunamadı.</p>;
  }

  const food = foodQuery.data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {food.name}
          {!food.isVerified && (
            <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
              Onay bekliyor
            </span>
          )}
        </h1>
        {food.nameEn && <p className="text-sm text-gray-500">{food.nameEn}</p>}
        <p className="mt-1 text-sm text-gray-500">
          {food.category}
          {food.servingDescription && ` · ${food.servingDescription}`}
        </p>
      </div>

      <div className="rounded-md border border-gray-200 p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Temel Besin Değerleri (100g)</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-gray-500">Kalori</dt>
            <dd className="text-lg font-medium text-gray-900">{food.calories} kcal</dd>
          </div>
          <div>
            <dt className="text-gray-500">Protein</dt>
            <dd className="text-lg font-medium text-gray-900">{food.protein} g</dd>
          </div>
          <div>
            <dt className="text-gray-500">Karbonhidrat</dt>
            <dd className="text-lg font-medium text-gray-900">{food.carbs} g</dd>
          </div>
          <div>
            <dt className="text-gray-500">Yağ</dt>
            <dd className="text-lg font-medium text-gray-900">{food.fat} g</dd>
          </div>
          {food.fiber !== null && (
            <div>
              <dt className="text-gray-500">Lif</dt>
              <dd className="text-gray-900">{food.fiber} g</dd>
            </div>
          )}
          {food.sugar !== null && (
            <div>
              <dt className="text-gray-500">Şeker</dt>
              <dd className="text-gray-900">{food.sugar} g</dd>
            </div>
          )}
          {food.glycemicIndex !== null && (
            <div>
              <dt className="text-gray-500">Glisemik İndeks</dt>
              <dd className="text-gray-900">{food.glycemicIndex}</dd>
            </div>
          )}
        </dl>
      </div>

      <NutrientGroup title="Vitaminler" values={food.vitamins} />
      <NutrientGroup title="Mineraller" values={food.minerals} />
      <NutrientGroup title="Amino Asitler" values={food.aminoAcids} />
      <NutrientGroup title="Yağ Asitleri" values={food.fattyAcids} />

      <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-1 text-sm font-semibold text-gray-700">Kaynak</h2>
        <p className="text-sm text-gray-700">{food.sourceName}</p>
        <p className="mt-1 text-sm text-gray-500">{food.sourceCitation}</p>
        {food.sourceUrl && (
          <a
            href={food.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm text-brand-700 hover:underline"
          >
            Kaynağa git →
          </a>
        )}
      </div>
    </div>
  );
}

export default function BesinDetayPage() {
  return (
    <RequireAuth>
      <BesinDetayContent />
    </RequireAuth>
  );
}
