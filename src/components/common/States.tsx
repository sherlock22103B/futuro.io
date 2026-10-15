import Link from "next/link";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-8 text-center", className)}>
      <Inbox className="h-10 w-10 text-muted-foreground" aria-hidden />
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Qualcosa non torna",
  messages,
  action,
}: {
  title?: string;
  messages: { text: string; href?: string }[];
  action?: React.ReactNode;
}) {
  return (
    <div role="alert" className="rounded-2xl border border-destructive/50 bg-destructive/10 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-destructive" aria-hidden />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {messages.map((m, i) => (
              <li key={i}>
                {m.href ? (
                  <Link className="underline underline-offset-4 hover:text-primary" href={m.href}>
                    {m.text}
                  </Link>
                ) : (
                  m.text
                )}
              </li>
            ))}
          </ul>
          {action}
        </div>
      </div>
    </div>
  );
}

export function LoadingState({ label = "Caricamento dei tuoi dati…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 p-10 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function BackToSimulator() {
  return (
    <Button asChild>
      <Link href="/simulatore">Vai al simulatore</Link>
    </Button>
  );
}
