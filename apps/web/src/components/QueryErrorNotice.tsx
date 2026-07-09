"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Bir tRPC sorgusu hata verdiğinde tüm sayfalarda tutarlı gösterilen bildirim.
// Amaç: sorgu hata durumuna geçtiğinde sayfanın sessizce "Yükleniyor..." göstermeye
// devam etmesini (kilitlenmiş gibi görünmesini) önlemek.
export function QueryErrorNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Veriler yüklenemedi: {message}
        <button type="button" onClick={onRetry} className="ml-3 font-medium underline">
          Tekrar dene
        </button>
      </AlertDescription>
    </Alert>
  );
}
