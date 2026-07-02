"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function AdminBesinlerPage() {
  const utils = trpc.useUtils();
  const [query, setQuery] = useState("");
  const searchQuery = trpc.foods.search.useQuery({ query, limit: 50 }, { enabled: query.trim().length > 1 });

  const verifyMutation = trpc.admin.foods.verify.useMutation({
    onSuccess: () => utils.foods.search.invalidate(),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Besin Onayı</h1>
      <p className="mb-4 text-sm text-gray-500">
        Bir besin adı arayın; onaylı olmayan besinleri onaylayabilir veya onayı geri alabilirsiniz.
      </p>

      <input
        type="text"
        placeholder="Besin ara..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mb-6 w-full max-w-md rounded-md border border-gray-300 px-3 py-2"
      />

      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
        {searchQuery.data?.items.map((food) => (
          <li key={food.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-gray-900">{food.name}</p>
              <p className="text-sm text-gray-500">
                {food.category} · {food.calories} kcal/100g
              </p>
            </div>
            <button
              type="button"
              onClick={() => verifyMutation.mutate({ id: food.id, approve: !food.isVerified })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                food.isVerified
                  ? "border border-gray-300 text-gray-700 hover:bg-gray-100"
                  : "bg-brand-600 text-white hover:bg-brand-700"
              }`}
            >
              {food.isVerified ? "Onayı Geri Al" : "Onayla"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
