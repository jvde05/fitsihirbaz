import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <h1 className="text-4xl font-bold text-gray-900">Fit Sihirbaz</h1>
      <p className="max-w-xl text-gray-600">
        Diyetisyenlerin danışanlarını yönettiği, danışanların diyet planlarını ve
        ilerlemesini takip ettiği, literatür referanslı bir beslenme platformu.
      </p>
      <div className="flex gap-4">
        <Link
          href="/kayit"
          className="rounded-md bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700"
        >
          Hemen Başla
        </Link>
        <Link
          href="/diyetisyenler"
          className="rounded-md border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-100"
        >
          Diyetisyenleri Keşfet
        </Link>
      </div>
    </div>
  );
}
