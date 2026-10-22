import { deleteFaq, deleteMedia, deleteTestimonial, saveFaq, savePage, saveSettings, saveTestimonial, uploadMedia } from "@/lib/actions/admin";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const query = await searchParams;
  const [settings, pages, faqs, testimonials, media] = await Promise.all([
    getSettings(),
    prisma.page.findMany({ orderBy: { title: "asc" } }),
    prisma.faqItem.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
    prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.mediaAsset.findMany({ orderBy: [{ kind: "asc" }, { sortOrder: "asc" }] }),
  ]);
  return (
    <section className="grid gap-10">
      <h1 className="display text-5xl">Vsebina</h1>
      {query.saved ? <p className="text-accent">Shranjeno.</p> : null}
      {query.error ? <p className="text-accent">Preverite vnos ({query.error}).</p> : null}

      <form action={saveSettings} className="grid gap-3 bg-panel p-4">
        <h2 className="display text-3xl">Kontakt in SEO</h2>
        <Text name="phone" label="Telefon" defaultValue={settings.phoneDisplay} />
        <Text name="email" label="E-pošta" defaultValue={settings.email} />
        <Text name="instagram" label="Instagram" defaultValue={settings.instagram} />
        <Text name="hours" label="Delovni čas" defaultValue={settings.hours} />
        <Text name="notifyEmail" label="E-pošta za obvestila" defaultValue={settings.notifyEmail} />
        <Text name="seoHomeTitle" label="SEO naslov prve strani" defaultValue={settings.seoHomeTitle} />
        <label className="field dark-fields">
          <span>SEO opis prve strani</span>
          <textarea name="seoHomeDescription" defaultValue={settings.seoHomeDescription} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="newsletter" defaultChecked={settings.newsletterEnabled} className="h-5 w-5" />
          Vklopi prijavo na obvestila
        </label>
        <button className="btn btn-primary w-full sm:w-auto">Shrani nastavitve</button>
      </form>

      <form action={uploadMedia} className="grid gap-3 bg-panel p-4">
        <h2 className="display text-3xl">Fotografije strani</h2>
        <label className="field dark-fields">
          <span>Mesto</span>
          <select name="kind" defaultValue="hero">
            <option value="hero">Glavna fotografija</option>
            <option value="sale">Prodaja</option>
            <option value="rent">Najem</option>
            <option value="about">O nas</option>
            <option value="instagram">Instagram</option>
            <option value="gallery">Galerija</option>
          </select>
        </label>
        <Text name="alt" label="Opis fotografije" />
        <Text name="linkUrl" label="Povezava, na primer objava na Instagramu" />
        <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
        <button className="btn btn-primary w-full sm:w-auto">Naloži</button>
      </form>
      <div className="grid gap-3 sm:grid-cols-2">
        {media.map((item) => (
          <article key={item.id} className="bg-panel p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={item.alt} className="aspect-video w-full object-cover" />
            <p className="mt-2 text-sm">{item.kind} {item.linkUrl ? `· ${item.linkUrl}` : ""}</p>
            <form action={deleteMedia}>
              <input type="hidden" name="id" value={item.id} />
              <button className="mt-2 underline">Odstrani</button>
            </form>
          </article>
        ))}
      </div>

      <div className="grid gap-4">
        <h2 className="display text-3xl">Vprašanja</h2>
        {faqs.map((faq) => (
          <form key={faq.id} action={saveFaq} className="grid gap-3 bg-panel p-4">
            <input type="hidden" name="id" value={faq.id} />
            <Text name="category" label="Kategorija" defaultValue={faq.category} />
            <Text name="question" label="Vprašanje" defaultValue={faq.question} />
            <label className="field dark-fields"><span>Odgovor</span><textarea name="answer" defaultValue={faq.answer} /></label>
            <Text name="sortOrder" label="Vrstni red" type="number" defaultValue={faq.sortOrder} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={faq.published} className="h-5 w-5" /> Objavi</label>
            <button className="btn btn-primary w-full sm:w-auto">Shrani vprašanje</button>
          </form>
        ))}
        <form action={saveFaq} className="grid gap-3 bg-panel p-4">
          <h3>Novo vprašanje</h3>
          <Text name="category" label="Kategorija" defaultValue="Splošno" />
          <Text name="question" label="Vprašanje" />
          <label className="field dark-fields"><span>Odgovor</span><textarea name="answer" /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked className="h-5 w-5" /> Objavi</label>
          <button className="btn btn-primary w-full sm:w-auto">Dodaj</button>
        </form>
        {faqs.map((faq) => (
          <form key={`delete-${faq.id}`} action={deleteFaq}>
            <input type="hidden" name="id" value={faq.id} />
            <button className="text-sm underline">Izbriši: {faq.question}</button>
          </form>
        ))}
      </div>

      <div className="grid gap-4">
        <h2 className="display text-3xl">Ocene</h2>
        <p className="text-sm text-muted">Ocena je javna šele, ko jo objavite. Ne dodajajte izmišljenih oseb.</p>
        <form action={saveTestimonial} className="grid gap-3 bg-panel p-4">
          <Text name="authorName" label="Ime" />
          <label className="field dark-fields"><span>Besedilo</span><textarea name="text" /></label>
          <Text name="rating" label="Ocena 1–5, ni obvezno" type="number" />
          <Text name="source" label="Vir" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" className="h-5 w-5" /> Objavi</label>
          <button className="btn btn-primary w-full sm:w-auto">Shrani oceno</button>
        </form>
        {testimonials.map((item) => (
          <form key={item.id} action={deleteTestimonial} className="flex flex-wrap items-center justify-between gap-3 bg-panel p-3">
            <input type="hidden" name="id" value={item.id} />
            <span>{item.authorName} · {item.published ? "objavljeno" : "skrito"}</span>
            <button className="underline">Izbriši</button>
          </form>
        ))}
      </div>

      <div className="grid gap-4">
        <h2 className="display text-3xl">Pravna besedila</h2>
        {pages.map((page) => (
          <form key={page.slug} action={savePage} className="grid gap-3 bg-panel p-4">
            <input type="hidden" name="slug" value={page.slug} />
            <Text name="title" label="Naslov" defaultValue={page.title} />
            <Text name="seoTitle" label="SEO naslov" defaultValue={page.seoTitle} />
            <Text name="seoDescription" label="SEO opis" defaultValue={page.seoDescription} />
            <label className="field dark-fields"><span>Besedilo</span><textarea name="body" defaultValue={page.body} className="min-h-64" /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="confirmed" defaultChecked={page.confirmed} className="h-5 w-5" /> Besedilo je pregledano in lahko velja kot uradno</label>
            <button className="btn btn-primary w-full sm:w-auto">Shrani besedilo</button>
          </form>
        ))}
      </div>
    </section>
  );
}

function Text({ name, label, defaultValue = "", type = "text" }: { name: string; label: string; defaultValue?: string | number; type?: string }) {
  return (
    <label className="field dark-fields">
      <span>{label}</span>
      <input name={name} type={type} defaultValue={defaultValue} />
    </label>
  );
}
