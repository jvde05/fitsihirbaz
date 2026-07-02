"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";

export default function DiyetisyenProfilPage() {
  const params = useParams<{ id: string }>();
  const dietitianQuery = trpc.dietitians.getPublicProfile.useQuery({ id: params.id });
  const packagesQuery = trpc.packages.browse.useQuery({ dietitianId: params.id, limit: 50 });

  if (dietitianQuery.isLoading) {
    return <p className="text-gray-500">Yükleniyor...</p>;
  }
  if (!dietitianQuery.data) {
    return <p className="text-gray-500">Diyetisyen bulunamadı.</p>;
  }

  const dietitian = dietitianQuery.data;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          {dietitian.firstName} {dietitian.lastName}
        </h1>
        {dietitian.title && <p className="text-gray-600">{dietitian.title}</p>}
        {dietitian.averageRating !== null && (
          <p className="mt-1 text-sm text-gray-600">★ {dietitian.averageRating.toFixed(1)}</p>
        )}
        {dietitian.specialties.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {dietitian.specialties.map((specialty) => (
              <span key={specialty} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                {specialty}
              </span>
            ))}
          </div>
        )}
        {dietitian.bio && <p className="mt-4 whitespace-pre-line text-gray-700">{dietitian.bio}</p>}
      </div>

      <h2 className="mb-3 text-lg font-semibold text-gray-900">Paketler</h2>
      {packagesQuery.data && packagesQuery.data.items.length === 0 && (
        <p className="text-gray-500">Bu diyetisyenin şu anda aktif bir paketi yok.</p>
      )}
      <div className="space-y-3">
        {packagesQuery.data?.items.map((pkg) => (
          <div key={pkg.id} className="rounded-md border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{pkg.title}</p>
                <p className="text-sm text-gray-500">
                  {pkg.durationDays} gün{pkg.sessionCount ? ` · ${pkg.sessionCount} görüşme` : ""}
                </p>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {pkg.price} {pkg.currency}
              </p>
            </div>
            {pkg.description && <p className="mt-2 text-sm text-gray-600">{pkg.description}</p>}
            <button
              type="button"
              disabled
              title="Ödeme entegrasyonu yakında eklenecek"
              className="mt-3 w-full cursor-not-allowed rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-500"
            >
              Satın Al (Çok Yakında)
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
