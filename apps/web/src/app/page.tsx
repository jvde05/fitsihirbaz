import Link from "next/link";
import { ClipboardList, LineChart, MessageCircle, Search, Sparkles, UserPlus, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Kişiselleştirilmiş Diyet Planları",
    description: "Diyetisyeniniz size özel öğün planları oluşturur, kalori ve makro hedeflerinizi takip eder.",
  },
  {
    icon: LineChart,
    title: "İlerleme Takibi",
    description: "Kilo, ölçüm ve fotoğraflarınızı düzenli olarak kaydedin, zaman içindeki değişiminizi görün.",
  },
  {
    icon: MessageCircle,
    title: "Diyetisyeninizle Mesajlaşma",
    description: "Sorularınızı doğrudan diyetisyeninize sorun, randevu alın, ilerlemenizi birlikte değerlendirin.",
  },
];

const STEPS = [
  { title: "Kayıt ol", description: "Danışan veya diyetisyen olarak ücretsiz hesap oluştur." },
  { title: "Diyetisyen seç", description: "Uzmanlık alanına göre diyetisyenleri keşfet, bir paket satın al." },
  { title: "Planını takip et", description: "Diyet planını, randevularını ve ilerlemeni tek yerden yönet." },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-24 py-4">
      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-3xl border bg-gradient-to-b from-accent/60 via-accent/20 to-background px-6 py-20 text-center sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_50%_0%,hsl(var(--primary)/0.18),transparent)]"
        />
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Diyetisyenler ve danışanlar için
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">Fit Sihirbaz</h1>
          <p className="text-balance text-lg text-muted-foreground">
            Diyetisyenlerin danışanlarını yönettiği, danışanların diyet planlarını ve ilerlemesini takip
            ettiği, literatür referanslı bir beslenme platformu.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="shadow-lg shadow-primary/20">
              <Link href="/kayit">Hemen Başla</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-background">
              <Link href="/diyetisyenler">Diyetisyenleri Keşfet</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Özellikler */}
      <section>
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="group border-border/60 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
            >
              <CardHeader>
                <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="pt-2 text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section>
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Nasıl Çalışır?</h2>
          <p className="mt-2 text-sm text-muted-foreground">Üç adımda platforma katıl.</p>
        </div>
        <div className="relative grid gap-10 sm:grid-cols-3">
          <div
            aria-hidden
            className="absolute top-7 hidden h-px w-full bg-gradient-to-r from-transparent via-border to-transparent sm:block"
          />
          {STEPS.map((step, index) => (
            <div key={step.title} className="relative flex flex-col items-center gap-3 text-center">
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25 ring-4 ring-background">
                {index + 1}
              </div>
              <p className="font-semibold text-foreground">{step.title}</p>
              <p className="max-w-[16rem] text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bandı */}
      <section className="relative isolate -mx-4 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-6 py-16 text-center text-primary-foreground shadow-xl shadow-primary/20 sm:mx-0">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_20%_0%,hsl(0_0%_100%/0.15),transparent)]"
        />
        <div className="mx-auto flex max-w-md flex-col items-center gap-4">
          <h2 className="text-2xl font-semibold sm:text-3xl">Hemen ücretsiz kayıt ol</h2>
          <p className="text-sm text-primary-foreground/85">
            Danışan veya diyetisyen olarak birkaç dakikada hesabını oluştur, platformu keşfetmeye başla.
          </p>
          <Button asChild size="lg" variant="secondary" className="shadow-lg">
            <Link href="/kayit">Kayıt Ol</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
