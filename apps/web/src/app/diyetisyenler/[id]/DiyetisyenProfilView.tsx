"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Star } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DiyetisyenProfilView() {
  const params = useParams<{ id: string }>();
  const { status, user } = useAuthStore();
  const dietitianQuery = trpc.dietitians.getPublicProfile.useQuery({ id: params.id });
  const packagesQuery = trpc.packages.browse.useQuery({ dietitianId: params.id, limit: 50 });
  const reviewsQuery = trpc.reviews.listForDietitian.useQuery({ dietitianId: params.id });
  const isClient = status === "authenticated" && user?.role === "CLIENT";
  const ordersQuery = trpc.orders.listForClient.useQuery(undefined, { enabled: isClient });
  const canReview = isClient && (ordersQuery.data ?? []).some((order) => order.dietitianId === params.id && order.status === "PAID");

  const utils = trpc.useUtils();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const createReviewMutation = trpc.reviews.create.useMutation({
    onSuccess: () => {
      setReviewError(null);
      setComment("");
      utils.reviews.listForDietitian.invalidate({ dietitianId: params.id });
      utils.dietitians.getPublicProfile.invalidate({ id: params.id });
    },
    onError: (err) => setReviewError(err.message),
  });

  function handleReviewSubmit(event: React.FormEvent) {
    event.preventDefault();
    setReviewError(null);
    createReviewMutation.mutate({ dietitianId: params.id, rating, comment: comment || undefined });
  }

  if (dietitianQuery.isLoading) {
    return <p className="text-muted-foreground">Yükleniyor...</p>;
  }
  if (dietitianQuery.isError) {
    return <QueryErrorNotice message={dietitianQuery.error.message} onRetry={() => dietitianQuery.refetch()} />;
  }
  if (!dietitianQuery.data) {
    return <p className="text-muted-foreground">Diyetisyen bulunamadı.</p>;
  }

  const dietitian = dietitianQuery.data;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {dietitian.firstName} {dietitian.lastName}
          </h1>
          {dietitian.verificationStatus === "VERIFIED" && <Badge variant="success">Onaylı</Badge>}
        </div>
        {dietitian.title && <p className="text-muted-foreground">{dietitian.title}</p>}
        {dietitian.averageRating !== null && (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            {dietitian.averageRating.toFixed(1)}
          </p>
        )}
        {dietitian.specialties.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {dietitian.specialties.map((specialty) => (
              <Badge key={specialty} variant="secondary">
                {specialty}
              </Badge>
            ))}
          </div>
        )}
        {dietitian.bio && <p className="mt-4 whitespace-pre-line text-foreground/90">{dietitian.bio}</p>}
      </div>

      <h2 className="mb-3 text-lg font-semibold text-foreground">Paketler</h2>
      {packagesQuery.data && packagesQuery.data.items.length === 0 && (
        <EmptyState title="Aktif paket yok" description="Bu diyetisyenin şu anda aktif bir paketi yok." />
      )}
      <div className="space-y-3">
        {packagesQuery.data?.items.map((pkg) => (
          <Card key={pkg.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{pkg.title}</p>
                <p className="text-sm text-muted-foreground">
                  {pkg.durationDays} gün{pkg.sessionCount ? ` · ${pkg.sessionCount} görüşme` : ""}
                </p>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {pkg.price} {pkg.currency}
              </p>
            </div>
            {pkg.description && <p className="mt-2 text-sm text-muted-foreground">{pkg.description}</p>}
            {isClient ? (
              <Button asChild className="mt-3 w-full">
                <Link href={`/danisan/satin-al/${pkg.id}`}>Satın Al</Link>
              </Button>
            ) : (
              <Button
                type="button"
                disabled
                title="Satın almak için danışan hesabıyla giriş yapmalısınız"
                className="mt-3 w-full"
              >
                Satın Al
              </Button>
            )}
          </Card>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold text-foreground">Yorumlar</h2>

      {canReview && (
        <form onSubmit={handleReviewSubmit} className="mb-6 flex flex-col gap-3 rounded-md border p-4">
          <div className="space-y-1.5">
            <Label>Puan</Label>
            <Select value={String(rating)} onValueChange={(value) => setRating(Number(value))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 4, 3, 2, 1].map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value} yıldız
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comment">Yorum (opsiyonel)</Label>
            <Textarea
              id="comment"
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </div>
          {reviewError && <p className="text-sm text-destructive">{reviewError}</p>}
          <Button type="submit" disabled={createReviewMutation.isLoading} className="self-start">
            {createReviewMutation.isLoading ? "Gönderiliyor..." : "Yorumu Gönder"}
          </Button>
        </form>
      )}

      {reviewsQuery.data && reviewsQuery.data.length === 0 && (
        <EmptyState title="Henüz yorum yapılmamış" />
      )}
      <ul className="space-y-3">
        {reviewsQuery.data?.map((review) => (
          <li key={review.id} className="rounded-md border p-4">
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={i < review.rating ? "h-4 w-4 fill-warning text-warning" : "h-4 w-4 text-muted-foreground/30"}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {review.clientFirstName} {review.clientLastName}
              </span>
            </div>
            {review.comment && <p className="mt-1 text-sm text-foreground/90">{review.comment}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
