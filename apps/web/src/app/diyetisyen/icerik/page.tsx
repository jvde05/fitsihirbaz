"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateArticleInputSchema, type CreateArticleInput } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
      <h1 className="mb-6 text-2xl font-semibold text-foreground">İçerik / Literatür</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mb-8 flex flex-col gap-3 rounded-md border p-4">
        <h2 className="text-sm font-semibold text-foreground">Yeni Makale</h2>
        <div className="space-y-1.5">
          <Label htmlFor="title">Başlık</Label>
          <Input id="title" {...register("title")} />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug (URL, örn. protein-ihtiyaci)</Label>
          <Input id="slug" {...register("slug")} />
          {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="body">İçerik</Label>
          <Textarea id="body" rows={6} {...register("body")} />
          {errors.body && <p className="text-sm text-destructive">{errors.body.message}</p>}
        </div>
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <Button type="submit" disabled={isSubmitting} className="self-start">
          {isSubmitting ? "Kaydediliyor..." : "Taslak Olarak Kaydet"}
        </Button>
      </form>

      {articlesQuery.isError && (
        <QueryErrorNotice message={articlesQuery.error.message} onRetry={() => articlesQuery.refetch()} />
      )}

      <ul className="divide-y rounded-md border">
        {articlesQuery.data?.map((article) => (
          <li key={article.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{article.title}</p>
                <Badge variant={article.publishedAt ? "success" : "secondary"}>
                  {article.publishedAt ? "Yayında" : "Taslak"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">/{article.slug}</p>
            </div>
            {!article.publishedAt && (
              <Button variant="outline" size="sm" onClick={() => publishMutation.mutate({ id: article.id })}>
                Yayınla
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
