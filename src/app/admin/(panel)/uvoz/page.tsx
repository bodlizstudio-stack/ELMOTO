import { importMotorcycles } from "@/lib/actions/admin";
import { prisma } from "@/lib/db";
import { formatLjubljana } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ imported?: string; errors?: string; error?: string }> }) {
  const query = await searchParams;
  const jobs = await prisma.importJob.findMany({ orderBy: { createdAt: "desc" }, take: 10 });
  return (
    <section className="grid gap-6">
      <h1 className="display text-5xl">Uvoz motorjev</h1>
      <p className="max-w-2xl leading-7 text-muted">
        Uvozite CSV ali JSON. Cena 0 se ne zapiše kot prava cena. Fotografije so lahko povezave https ali datoteke v /uploads. Primeri z oznako example se preskočijo.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <a className="btn btn-line" href="/predloge/motorji.csv">Prenesi CSV predlogo</a>
        <a className="btn btn-line" href="/predloge/motorji.json">Prenesi JSON predlogo</a>
      </div>
      {query.imported ? <p>Uvoženih motorjev: {query.imported}. Napak: {query.errors || 0}.</p> : null}
      {query.error ? <p className="text-accent">Uvoz ni uspel ({query.error}).</p> : null}
      <form action={importMotorcycles} className="grid gap-3 bg-panel p-4">
        <input name="file" type="file" accept=".csv,.json,text/csv,application/json" required />
        <button className="btn btn-primary w-full sm:w-auto">Uvozi</button>
      </form>
      <h2 className="display text-3xl">Zgodovina uvozov</h2>
      <ul className="grid gap-2 text-sm">
        {jobs.map((job) => (
          <li key={job.id} className="bg-panel p-3">
            {formatLjubljana(job.createdAt)} · {job.filename} · {job.status}
            <br />
            {job.summary}
          </li>
        ))}
      </ul>
    </section>
  );
}
