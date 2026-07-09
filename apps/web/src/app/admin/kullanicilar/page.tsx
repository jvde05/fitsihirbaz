"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { Role } from "@fit-sihirbaz/shared";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROLE_LABELS: Record<Role, string> = {
  CLIENT: "Danışan",
  DIETITIAN: "Diyetisyen",
  ADMIN: "Yönetici",
};

const ALL_ROLES = "ALL";

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
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Kullanıcılar</h1>

      <div className="mb-6 flex gap-3">
        <Input
          type="text"
          placeholder="İsim veya e-posta ara..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="flex-1"
        />
        <Select
          value={role || ALL_ROLES}
          onValueChange={(value) => setRole(value === ALL_ROLES ? "" : (value as Role))}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ROLES}>Tüm Roller</SelectItem>
            <SelectItem value="CLIENT">Danışan</SelectItem>
            <SelectItem value="DIETITIAN">Diyetisyen</SelectItem>
            <SelectItem value="ADMIN">Yönetici</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {usersQuery.isError && (
        <QueryErrorNotice message={usersQuery.error.message} onRetry={() => usersQuery.refetch()} />
      )}

      <ul className="divide-y rounded-md border">
        {usersQuery.data?.items.map((user) => (
          <li key={user.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">
                  {user.firstName} {user.lastName}
                </p>
                <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                {!user.isActive && <Badge variant="destructive">Pasif</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveMutation.mutate({ id: user.id, isActive: !user.isActive })}
            >
              {user.isActive ? "Pasife Al" : "Aktifleştir"}
            </Button>
          </li>
        ))}
      </ul>
      {usersQuery.data?.items.length === 0 && <EmptyState title="Sonuç bulunamadı" />}
    </div>
  );
}
