import { notFound } from "next/navigation";
import { MotorcycleEditor } from "@/components/motorcycle-editor";
import { deleteMotorcycle, setMotorcycleStatus, updateImage, uploadMotorcycleImages } from "@/lib/actions/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditMotorcyclePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const bike = await prisma.motorcycle.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } }, specifications: true },
  });
  if (!bike) notFound();
  const specs = bike.specifications.map((spec) => `${spec.label}: ${spec.value}`).join("\n");
  return (
    <div className="grid gap-8">
      {query.saved ? <p className="text-sm text-accent">Shranjeno.</p> : null}
      {query.error ? <p className="text-sm text-accent">Dejanje ni uspelo: {query.error}.</p> : null}
      <MotorcycleEditor
        bike={{
          ...bike,
          sourceCheckedAt: bike.sourceCheckedAt ? bike.sourceCheckedAt.toISOString().slice(0, 10) : "",
          specs,
        }}
      />
      <section className="bg-panel p-4">
        <h2 className="display text-3xl">Fotografije</h2>
        <form action={uploadMotorcycleImages} className="mt-4 grid gap-3">
          <input type="hidden" name="id" value={bike.id} />
          <input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple required />
          <button className="btn btn-primary w-full sm:w-auto">Naloži</button>
        </form>
        <div className="mt-4 grid gap-3">
          {bike.images.map((image) => (
            <div key={image.id} className="grid gap-3 border border-white/10 p-3 sm:grid-cols-[5rem_1fr]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={image.alt} className="h-20 w-full object-cover" />
              <div className="flex flex-wrap gap-2">
                <ImageButton imageId={image.id} actionName="up" label="Višje" />
                <ImageButton imageId={image.id} actionName="down" label="Nižje" />
                <ImageButton imageId={image.id} actionName="cover" label={image.isCover ? "Naslovna" : "Nastavi naslovno"} />
                <ImageButton imageId={image.id} actionName="delete" label="Izbriši" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-panel p-4">
        <h2 className="display text-3xl">Stanje</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {["AVAILABLE", "RESERVED", "SOLD", "HIDDEN", "ARCHIVED"].map((status) => (
            <form key={status} action={setMotorcycleStatus}>
              <input type="hidden" name="id" value={bike.id} />
              <input type="hidden" name="status" value={status} />
              <button className="btn btn-line">{status === "SOLD" ? "Prodano" : status === "RESERVED" ? "Rezervirano" : status === "HIDDEN" ? "Skrij" : status === "ARCHIVED" ? "Arhiviraj" : "Na voljo"}</button>
            </form>
          ))}
        </div>
        <form action={deleteMotorcycle} className="mt-6 grid gap-3">
          <input type="hidden" name="id" value={bike.id} />
          <label className="field dark-fields">
            <span>Za trajni izbris vpišite IZBRISI</span>
            <input name="confirm" />
          </label>
          <button className="btn btn-line w-full sm:w-auto">Trajno izbriši</button>
        </form>
      </section>
    </div>
  );
}

function ImageButton({ imageId, actionName, label }: { imageId: string; actionName: string; label: string }) {
  return (
    <form action={updateImage}>
      <input type="hidden" name="imageId" value={imageId} />
      <input type="hidden" name="imageAction" value={actionName} />
      <button className="btn btn-line">{label}</button>
    </form>
  );
}
