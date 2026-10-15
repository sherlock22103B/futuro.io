import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">Errore 404</p>
      <h1 className="text-3xl font-bold">Questa pagina non esiste</h1>
      <p className="max-w-md text-muted-foreground">Il futuro è ancora da scrivere, ma questa pagina no. Torna alla home o riprendi la simulazione.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild><Link href="/">Torna alla home</Link></Button>
        <Button asChild variant="outline"><Link href="/simulatore">Vai al simulatore</Link></Button>
      </div>
    </div>
  );
}
