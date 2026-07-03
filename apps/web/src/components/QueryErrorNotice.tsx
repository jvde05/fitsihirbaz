"use client";

// Bir tRPC sorgusu hata verdiğinde tüm sayfalarda tutarlı gösterilen bildirim.
// Amaç: sorgu hata durumuna geçtiğinde sayfanın sessizce "Yükleniyor..." göstermeye
// devam etmesini (kilitlenmiş gibi görünmesini) önlemek.
export function QueryErrorNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      Veriler yüklenemedi: {message}
      <button type="button" onClick={onRetry} className="ml-3 font-medium underline">
        Tekrar dene
      </button>
    </div>
  );
}
