"use client";

import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { resolveMediaUrl } from "@/lib/media";

export default function AdminDiyetisyenlerPage() {
  const utils = trpc.useUtils();
  const dietitiansQuery = trpc.admin.dietitians.list.useQuery({});

  const verifyMutation = trpc.admin.dietitians.verify.useMutation({
    onSuccess: () => utils.admin.dietitians.list.invalidate(),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Diyetisyen Doğrulama</h1>

      {dietitiansQuery.isError && (
        <QueryErrorNotice message={dietitiansQuery.error.message} onRetry={() => dietitiansQuery.refetch()} />
      )}

      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
        {dietitiansQuery.data?.map((dietitian) => (
          <li key={dietitian.id} className="flex items-start justify-between gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900">
                {dietitian.firstName} {dietitian.lastName}{" "}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    dietitian.verificationStatus === "VERIFIED"
                      ? "bg-brand-100 text-brand-700"
                      : dietitian.verificationStatus === "REJECTED"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {dietitian.verificationStatus}
                </span>
              </p>
              {dietitian.title && <p className="text-sm text-gray-500">{dietitian.title}</p>}
              <p className="mt-1 text-xs text-gray-500">
                {dietitian.email} {dietitian.licenseNumber ? `· Lisans No: ${dietitian.licenseNumber}` : "· Lisans no girilmemiş"}
              </p>

              <div className="mt-2">
                {dietitian.certificationUrls.length === 0 ? (
                  <p className="text-xs text-red-600">Hiç sertifika/lisans belgesi yüklenmemiş.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {dietitian.certificationUrls.map((url) => (
                      <a
                        key={url}
                        href={resolveMediaUrl(url) ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="block h-16 w-16 overflow-hidden rounded-md border border-gray-200"
                      >
                        <img src={resolveMediaUrl(url) ?? undefined} alt="" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {dietitian.verificationStatus === "PENDING" && (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => verifyMutation.mutate({ id: dietitian.id, status: "VERIFIED" })}
                  className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Onayla
                </button>
                <button
                  type="button"
                  onClick={() => verifyMutation.mutate({ id: dietitian.id, status: "REJECTED" })}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Reddet
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {dietitiansQuery.data?.length === 0 && <p className="text-gray-500">Kayıtlı diyetisyen yok.</p>}
    </div>
  );
}
