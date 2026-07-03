"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateArticleInputSchema, type CreateArticleInput } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";

export default function IcerikPage() {
  const utils = trpc.useUtils();
  const articlesQuery = trpc.articles.listMine.useQuery();
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = trpc.articles.create.useMutation({
    onSuccess: () => {
      reset();
      setFormError(null);
      utils.articles.listMine.invalidate();
    },
    onError: (err) => setFormError(err.message),
  });

  const publishMutation = trpc.articles.publish.useMutation({
    onSuccess: () => utils.articles.listMine.invalidate(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateArticleInput>({ resolver: zodResolver(CreateArticleInputSchema) });

  async function onSubmit(values: CreateArticleInput) {
    setFormError(null);
    await createMutation.mutateAsync(values);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">İçerik / Literatür</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mb-8 flex flex-col gap-3 rounded-md border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700">Yeni Makale</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="title">
            Başlık
          </label>
          <input
            id="title"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            {...register("title")}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="slug">
            Slug (URL, örn. protein-ihtiyaci)
          </label>
          <input
            id="slug"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            {...register("slug")}
          />
          {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="body">
            İçerik
          </label>
          <textarea
            id="body"
            rows={6}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            {...register("body")}
          />
          {errors.body && <p className="mt-1 text-sm text-red-600">{errors.body.message}</p>}
        </div>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="self-start rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isSubmitting ? "Kaydediliyor..." : "Taslak Olarak Kaydet"}
        </button>
      </form>

      {articlesQuery.isError && (
        <QueryErrorNotice message={articlesQuery.error.message} onRetry={() => articlesQuery.refetch()} />
      )}

      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
        {articlesQuery.data?.map((article) => (
          <li key={article.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-gray-900">
                {article.title}{" "}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    article.publishedAt ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {article.publishedAt ? "Yayında" : "Taslak"}
                </span>
              </p>
              <p className="text-sm text-gray-500">/{article.slug}</p>
            </div>
            {!article.publishedAt && (
              <button
                type="button"
                onClick={() => publishMutation.mutate({ id: article.id })}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Yayınla
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
