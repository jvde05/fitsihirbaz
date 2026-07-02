"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { Role } from "@fit-sihirbaz/shared";

const ROLE_LABELS: Record<Role, string> = {
  CLIENT: "Danışan",
  DIETITIAN: "Diyetisyen",
  ADMIN: "Yönetici",
};

export default function AdminKullanicilarPage() {
  const utils = trpc.useUtils();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role | "">("");

  const usersQuery = trpc.admin.users.list.useQuery({
    query: query.trim() || undefined,
    role: role || undefined,
    limit: 50,
  });

  const setActiveMutation = trpc.admin.users.setActive.useMutation({
    onSuccess: () => utils.admin.users.list.invalidate(),
    onError: (err) => alert(err.message),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Kullanıcılar</h1>

      <div className="mb-6 flex gap-3">
        <input
          type="text"
          placeholder="İsim veya e-posta ara..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2"
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as Role | "")}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">Tüm Roller</option>
          <option value="CLIENT">Danışan</option>
          <option value="DIETITIAN">Diyetisyen</option>
          <option value="ADMIN">Yönetici</option>
        </select>
      </div>

      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
        {usersQuery.data?.items.map((user) => (
          <li key={user.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-gray-900">
                {user.firstName} {user.lastName}{" "}
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {ROLE_LABELS[user.role]}
                </span>
                {!user.isActive && (
                  <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Pasif</span>
                )}
              </p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveMutation.mutate({ id: user.id, isActive: !user.isActive })}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {user.isActive ? "Pasife Al" : "Aktifleştir"}
            </button>
          </li>
        ))}
      </ul>
      {usersQuery.data?.items.length === 0 && <p className="text-gray-500">Sonuç bulunamadı.</p>}
    </div>
  );
}
