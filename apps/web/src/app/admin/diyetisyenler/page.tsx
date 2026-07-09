"use client";

import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { EmptyState } from "@/components/EmptyState";
import { resolveMediaUrl } from "@/lib/media";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_VARIANT = {
  VERIFIED: "success",
  REJECTED: "destructive",
  PENDING: "secondary",
} as const;

export default function AdminDiyetisyenlerPage() {
  const utils = trpc.useUtils();
  const dietitiansQuery = trpc.admin.dietitians.list.useQuery({});

  const verifyMutation = trpc.admin.dietitians.verify.useMutation({
    onSuccess: () => utils.admin.dietitians.list.invalidate(),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Diyetisyen Doğrulama</h1>

      {dietitiansQuery.isError && (
        <QueryErrorNotice message={dietitiansQuery.error.message} onRetry={() => dietitiansQuery.refetch()} />
      )}

      <ul className="divide-y rounded-md border">
        {dietitiansQuery.data?.map((dietitian) => (
          <li key={dietitian.id} className="flex items-start justify-between gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">
                  {dietitian.firstName} {dietitian.lastName}
                </p>
                <Badge variant={STATUS_VARIANT[dietitian.verificationStatus]}>{dietitian.verificationStatus}</Badge>
              </div>
              {dietitian.title && <p className="text-sm text-muted-foreground">{dietitian.title}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {dietitian.email} {dietitian.licenseNumber ? `· Lisans No: ${dietitian.licenseNumber}` : "· Lisans no girilmemiş"}
              </p>

              <div className="mt-2">
                {dietitian.certificationUrls.length === 0 ? (
                  <p className="text-xs text-destructive">Hiç sertifika/lisans belgesi yüklenmemiş.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {dietitian.certificationUrls.map((url) => (
                      <a
                        key={url}
                        href={resolveMediaUrl(url) ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="block h-16 w-16 overflow-hidden rounded-md border"
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
                <Button size="sm" onClick={() => verifyMutation.mutate({ id: dietitian.id, status: "VERIFIED" })}>
                  Onayla
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => verifyMutation.mutate({ id: dietitian.id, status: "REJECTED" })}
                >
                  Reddet
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {dietitiansQuery.data?.length === 0 && <EmptyState title="Kayıtlı diyetisyen yok" />}
    </div>
  );
}
