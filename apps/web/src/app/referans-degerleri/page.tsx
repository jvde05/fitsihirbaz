"use client";

import {
  REFERENCE_LIFE_STAGE_LABELS,
  REFERENCE_NUTRIENT_LABELS,
  REFERENCE_SEX_LABELS,
} from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";

function formatAgeRange(ageMinYears: number, ageMaxYears: number | null) {
  if (ageMaxYears === null) {
    return `${ageMinYears}+ yaş`;
  }
  return `${ageMinYears}-${ageMaxYears} yaş`;
}

export default function ReferansDegerleriPage() {
  const referenceQuery = trpc.referenceIntakes.list.useQuery({});

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">Referans Besin Alım Değerleri</h1>
      <p className="mb-6 max-w-2xl text-sm text-gray-500">
        Yaş, cinsiyet ve yaşam evresine göre günlük referans besin öğesi alım değerleri (BeBiS'teki TÜBER/DRI
        tablolarına benzer şekilde). Sarı etiketli satırlar henüz resmi TÜBER kaynağıyla doğrulanmamış, genel
        uluslararası ortalama yer tutucu değerlerdir — klinik karar için tek başına kullanılmamalıdır.
      </p>

      {referenceQuery.isLoading && <p className="text-gray-500">Yükleniyor...</p>}
      {referenceQuery.data && referenceQuery.data.length === 0 && (
        <p className="text-gray-500">Henüz referans değer eklenmemiş.</p>
      )}

      {referenceQuery.data && referenceQuery.data.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Besin Öğesi</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Yaş</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Cinsiyet</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Yaşam Evresi</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Değer</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Kaynak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {referenceQuery.data.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {REFERENCE_NUTRIENT_LABELS[item.nutrient] ?? item.nutrient}
                  </td>
                  <td className="px-4 py-2 text-gray-700">{formatAgeRange(item.ageMinYears, item.ageMaxYears)}</td>
                  <td className="px-4 py-2 text-gray-700">{REFERENCE_SEX_LABELS[item.sex]}</td>
                  <td className="px-4 py-2 text-gray-700">{REFERENCE_LIFE_STAGE_LABELS[item.lifeStage]}</td>
                  <td className="px-4 py-2 text-gray-900">
                    {item.value} {item.unit}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                        item.isVerifiedSource ? "bg-brand-100 text-brand-700" : "bg-yellow-100 text-yellow-800"
                      }`}
                      title={item.sourceLabel}
                    >
                      {item.isVerifiedSource ? "Doğrulanmış" : "Doğrulanmamış"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
