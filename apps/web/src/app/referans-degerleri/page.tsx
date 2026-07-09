"use client";

import {
  REFERENCE_LIFE_STAGE_LABELS,
  REFERENCE_NUTRIENT_LABELS,
  REFERENCE_SEX_LABELS,
} from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
      <h1 className="mb-2 text-2xl font-semibold text-foreground">Referans Besin Alım Değerleri</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Yaş, cinsiyet ve yaşam evresine göre günlük referans besin öğesi alım değerleri (BeBiS&apos;teki TÜBER/DRI
        tablolarına benzer şekilde). Sarı etiketli satırlar henüz resmi TÜBER kaynağıyla doğrulanmamış, genel
        uluslararası ortalama yer tutucu değerlerdir — klinik karar için tek başına kullanılmamalıdır.
      </p>

      {referenceQuery.isLoading && <Skeleton className="h-64 rounded-lg" />}
      {referenceQuery.isError && (
        <QueryErrorNotice message={referenceQuery.error.message} onRetry={() => referenceQuery.refetch()} />
      )}
      {referenceQuery.data && referenceQuery.data.length === 0 && (
        <EmptyState title="Henüz referans değer eklenmemiş" />
      )}

      {referenceQuery.data && referenceQuery.data.length > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Besin Öğesi</TableHead>
                <TableHead>Yaş</TableHead>
                <TableHead>Cinsiyet</TableHead>
                <TableHead>Yaşam Evresi</TableHead>
                <TableHead>Değer</TableHead>
                <TableHead>Kaynak</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referenceQuery.data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-foreground">
                    {REFERENCE_NUTRIENT_LABELS[item.nutrient] ?? item.nutrient}
                  </TableCell>
                  <TableCell>{formatAgeRange(item.ageMinYears, item.ageMaxYears)}</TableCell>
                  <TableCell>{REFERENCE_SEX_LABELS[item.sex]}</TableCell>
                  <TableCell>{REFERENCE_LIFE_STAGE_LABELS[item.lifeStage]}</TableCell>
                  <TableCell className="text-foreground">
                    {item.value} {item.unit}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.isVerifiedSource ? "success" : "warning"} title={item.sourceLabel}>
                      {item.isVerifiedSource ? "Doğrulanmış" : "Doğrulanmamış"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
