"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";

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
    return <p className="text-gray-500">Yükleniyor...</p>;
  }
  if (dietitianQuery.isError) {
    return <QueryErrorNotice message={dietitianQuery.error.message} onRetry={() => dietitianQuery.refetch()} />;
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
            {isClient ? (
              <Link
                href={`/danisan/satin-al/${pkg.id}`}
                className="mt-3 block w-full rounded-md bg-brand-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-brand-700"
              >
                Satın Al
              </Link>
            ) : (
              <button
                type="button"
                disabled
                title="Satın almak için danışan hesabıyla giriş yapmalısınız"
                className="mt-3 w-full cursor-not-allowed rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-500"
              >
                Satın Al
              </button>
            )}
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold text-gray-900">Yorumlar</h2>

      {canReview && (
        <form onSubmit={handleReviewSubmit} className="mb-6 flex flex-col gap-3 rounded-md border border-gray-200 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="rating">
              Puan
            </label>
            <select
              id="rating"
              value={rating}
              onChange={(event) => setRating(Number(event.target.value))}
              className="mt-1 rounded-md border border-gray-300 px-2 py-1.5"
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} yıldız
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="comment">
              Yorum (opsiyonel)
            </label>
            <textarea
              id="comment"
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          {reviewError && <p className="text-sm text-red-600">{reviewError}</p>}
          <button
            type="submit"
            disabled={createReviewMutation.isLoading}
            className="self-start rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {createReviewMutation.isLoading ? "Gönderiliyor..." : "Yorumu Gönder"}
          </button>
        </form>
      )}

      {reviewsQuery.data && reviewsQuery.data.length === 0 && (
        <p className="text-gray-500">Henüz yorum yapılmamış.</p>
      )}
      <ul className="space-y-3">
        {reviewsQuery.data?.map((review) => (
          <li key={review.id} className="rounded-md border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-900">
              {"★".repeat(review.rating)}
              {"☆".repeat(5 - review.rating)}{" "}
              <span className="font-normal text-gray-500">
                {review.clientFirstName} {review.clientLastName}
              </span>
            </p>
            {review.comment && <p className="mt-1 text-sm text-gray-600">{review.comment}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
